'use client'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useCareStore, moodLabel, ChatMessage, scoreColor } from '@/lib/store'
import BottomNav from '@/components/BottomNav'

const MAX_API_MESSAGES = 20

const CRISIS_RE = /suicid|me matar|vou me matar|quero morrer|me machucar|nao aguento mais viver|não aguento mais viver|quero sumir|nao quero mais viver|não quero mais viver|quero acabar com tudo|quero desaparecer|sem vontade de viver|nao vale a pena viver|não vale a pena viver|tirar minha vida|acabar com minha vida/i

function getQuickPrompts(patterns: string[], score: number): string[] {
  const base = ['Como estou me sentindo', 'Preciso respirar', 'Nao consigo dormir']
  const extra: string[] = []
  if (patterns.some(p => p.includes('TDAH'))) extra.push('Nao consigo focar')
  if (patterns.some(p => p.includes('nsied'))) extra.push('Estou ansioso agora')
  if (patterns.some(p => p.includes('urnout'))) extra.push('Estou exausto')
  if (patterns.some(p => p.includes('epres'))) extra.push('Estou me sentindo vazio')
  if (score < 35) extra.push('Preciso de ajuda agora')
  return [...extra.slice(0, 2), ...base].slice(0, 4)
}

function Bubble({ msg, streamingContent }: { msg: ChatMessage; streamingContent?: string }) {
  const isUser = msg.role === 'user'
  const content = streamingContent !== undefined ? streamingContent : msg.content
  const lines = content.split('\n')
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          style={{ background: 'rgba(0,212,160,0.15)', border: '0.5px solid rgba(0,212,160,0.3)', color: '#00D4A0' }}>
          C
        </div>
      )}
      <div
        className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
        style={
          isUser
            ? { background: '#FFFFFF', color: '#0A0A0A', borderBottomRightRadius: 4 }
            : { background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.09)', color: '#D0D0D0', borderBottomLeftRadius: 4 }
        }
      >
        {lines.map((line, i) => (
          <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
        ))}
        {streamingContent !== undefined && (
          <motion.span
            className="inline-block w-0.5 h-3.5 ml-0.5 align-middle rounded-full"
            style={{ background: '#00D4A0' }}
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  )
}

export default function ChatPage() {
  const store = useCareStore()
  const { userName, currentScore, currentMood, checkIns, psychProfile, chatMessages, addChatMessage, clearChat } = store
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleInput = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  const patterns = psychProfile?.detectedPatterns ?? []
  const name = userName ? userName.split(' ')[0] : null

  const { trend, streak } = useMemo(() => {
    const scores = checkIns.slice(0, 7).map(c => c.score)
    const t: 'improving' | 'declining' | 'stable' | 'unknown' = scores.length >= 2
      ? scores[0] > scores[scores.length - 1] ? 'improving'
      : scores[0] < scores[scores.length - 1] ? 'declining' : 'stable'
      : 'unknown'
    const days = new Set(checkIns.map(c => new Date(c.timestamp).toDateString()))
    let count = 0; const d = new Date()
    while (days.has(d.toDateString())) { count++; d.setDate(d.getDate() - 1) }
    return { trend: t, streak: count }
  }, [checkIns])

  const quickPrompts = useMemo(() => getQuickPrompts(patterns, currentScore), [patterns, currentScore])

  const welcomeMsg = useMemo<ChatMessage>(() => ({
    id: 'welcome',
    role: 'assistant',
    content: `${name ? `Ola, ${name}. ` : 'Ola. '}Estou aqui para te apoiar.${currentScore ? ` Score atual: ${currentScore}.` : ''}${currentMood ? ` Ultimo registro: ${moodLabel[currentMood]}.` : ''}${patterns.length ? ` Conheco seu perfil - ${patterns.slice(0, 2).join(' e ')}.` : ''} O que esta acontecendo agora?`,
    timestamp: 0,
  }), [name, currentScore, currentMood, patterns])

  const allMessages = useMemo<ChatMessage[]>(
    () => [welcomeMsg, ...chatMessages],
    [welcomeMsg, chatMessages]
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages.length, streaming, streamingContent])

  const send = async (text = input.trim()) => {
    if (!text || streaming) return
    setInput('')

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() }
    addChatMessage(userMsg)

    // Local crisis check — never call API
    if (CRISIS_RE.test(text) || currentScore < 15) {
      const crisisMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${name ? `${name}, estou` : 'Estou'} aqui com voce agora. Esse nivel de dor merece apoio humano especializado.\n\nO CVV atende 24h pelo 188, gratuitamente e com sigilo total. Voce pode ligar ou acessar cvv.org.br.\n\nVoce nao precisa passar por isso sozinho.`,
        timestamp: Date.now(),
      }
      addChatMessage(crisisMsg)
      return
    }

    // Build messages history for API — cap at last MAX_API_MESSAGES to avoid context overflow
    const historySlice = chatMessages.slice(-MAX_API_MESSAGES)
    const apiMessages = [
      ...historySlice.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: text },
    ]

    setStreaming(true)
    setStreamingContent('')
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          context: {
            score: currentScore,
            mood: currentMood ? moodLabel[currentMood] : '',
            patterns,
            trend,
            streak,
            name,
          },
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error('API error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setStreamingContent(full)
      }

      // Commit complete message to store
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: full,
        timestamp: Date.now(),
      })
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        addChatMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Nao consegui me conectar agora. Verifique sua conexao e tente novamente.',
          timestamp: Date.now(),
        })
      }
    } finally {
      setStreaming(false)
      setStreamingContent('')
    }
  }

  const color = scoreColor(currentScore)

  return (
    <div className="h-screen flex flex-col" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: `radial-gradient(ellipse 50% 30% at 50% 0%, ${color}06 0%, transparent 60%)` }} />

      {/* Header */}
      <div className="relative z-10 px-5 pt-14 pb-4 flex items-center justify-between"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)', background: 'rgba(8,8,8,0.6)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm"
            style={{ background: 'rgba(0,212,160,0.12)', border: '0.5px solid rgba(0,212,160,0.3)', color: '#00D4A0' }}>
            C
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white tracking-wide text-base">CARE Tutor</h1>
              <motion.div className="w-1.5 h-1.5 rounded-full bg-[#00D4A0]"
                animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            </div>
            <p className="text-[11px]" style={{ color: '#505050' }}>
              {currentMood ? `${moodLabel[currentMood]} · Score ${currentScore}` : 'Apoio emocional · Claude AI'}
            </p>
          </div>
        </div>
        {confirmClear ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: '#606060' }}>Apagar histórico?</span>
            <button onClick={() => { clearChat(); setConfirmClear(false) }}
              className="text-[11px] px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'rgba(255,68,102,0.12)', color: '#FF4466', border: '0.5px solid rgba(255,68,102,0.25)' }}>
              Sim
            </button>
            <button onClick={() => setConfirmClear(false)}
              className="text-[11px] px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#606060', border: '0.5px solid rgba(255,255,255,0.08)' }}>
              Não
            </button>
          </div>
        ) : (
          <button onClick={() => chatMessages.length > 0 ? setConfirmClear(true) : null}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)', opacity: chatMessages.length > 0 ? 1 : 0.3 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#606060" strokeWidth={2} strokeLinecap="round">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
          </button>
        )}
      </div>

      {/* Profile context strip */}
      {patterns.length > 0 && chatMessages.length === 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="relative z-10 px-5 py-3 flex items-center gap-2"
          style={{ background: 'rgba(0,212,160,0.04)', borderBottom: '0.5px solid rgba(0,212,160,0.1)' }}>
          <span className="text-[10px]" style={{ color: '#00D4A0', opacity: 0.7 }}>✦</span>
          <p className="text-[11px]" style={{ color: '#505050' }}>
            Respostas personalizadas para:{' '}
            <span style={{ color: '#707070' }}>{patterns.slice(0, 2).join(', ')}</span>
          </p>
        </motion.div>
      )}

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3">
        {allMessages.map(m => <Bubble key={m.id} msg={m} />)}

        {/* Streaming bubble — shown while response is coming in */}
        {streaming && (
          <Bubble
            msg={{ id: 'streaming', role: 'assistant', content: '', timestamp: 0 }}
            streamingContent={streamingContent}
          />
        )}

        {/* Typing indicator — shown before first token arrives */}
        {streaming && streamingContent === '' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2 -mt-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{ background: 'rgba(0,212,160,0.15)', border: '0.5px solid rgba(0,212,160,0.3)', color: '#00D4A0' }}>C</div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#505050' }}
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick prompts */}
        {chatMessages.length === 0 && !streaming && (
          <div className="flex flex-wrap gap-2 mt-2">
            {quickPrompts.map(q => (
              <button key={q} onClick={() => send(q)}
                className="px-4 py-2 rounded-full text-xs font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', color: '#909090' }}>
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Disclaimer */}
      <p className="relative z-10 text-center text-[10px] py-1.5 px-4" style={{ color: '#303030' }}>
        CARE nao substitui psicologos · CVV 188 (24h)
      </p>

      {/* Input */}
      <div className="relative z-10 px-4 py-3 flex items-end gap-2.5"
        style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(20px)' }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => { setInput(e.target.value); handleInput() }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="O que esta acontecendo agora?"
          rows={1}
          className="flex-1 text-white text-sm font-light resize-none leading-relaxed py-2.5 px-4 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)', caretColor: '#fff', maxHeight: 120, overflowY: 'auto' }}
        />
        {streaming ? (
          <button onClick={() => abortRef.current?.abort()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            style={{ background: 'rgba(255,68,102,0.1)', border: '0.5px solid rgba(255,68,102,0.3)' }}>
            <div className="w-3 h-3 rounded-sm" style={{ background: '#FF4466' }} />
          </button>
        ) : (
          <button onClick={() => send()} disabled={!input.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            style={{ background: input.trim() ? '#FFFFFF' : 'rgba(255,255,255,0.06)' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
              stroke={input.trim() ? '#0A0A0A' : '#505050'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
