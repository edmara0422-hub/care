'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCareStore, CheckIn, MoodLevel, moodLabel, moodEmoji, moodColor, moodToScore, scoreColor } from '@/lib/store'
import { useTypingRhythm } from '@/lib/useSensors'
import BottomNav from '@/components/BottomNav'

const MOODS: MoodLevel[] = ['otimo', 'bem', 'ok', 'mal', 'crise']

const NOTE_PLACEHOLDER: Record<MoodLevel, string> = {
  otimo: 'O que está indo bem? O que contribuiu para esse estado?',
  bem: 'Como você está se sentindo agora? Algo de bom aconteceu?',
  ok: 'O que está pesando levemente? Tem algo que gostaria de registrar?',
  mal: 'O que está difícil agora? Pode escrever livremente — sem julgamento.',
  crise: 'Você não precisa estar bem. Escreva o que está sentindo, com suas palavras.',
}

const TRIGGERS = [
  'Trabalho', 'Relacionamento', 'Família', 'Sono ruim',
  'Saúde', 'Finanças', 'Solidão', 'Sobrecarga',
  'Conflito', 'Incerteza', 'Redes sociais', 'Dor física', 'Outro',
]

const POSITIVE_TRIGGERS = [
  'Exercício', 'Descanso', 'Socialização', 'Foco', 'Natureza',
  'Alimentação', 'Gratidão', 'Criatividade', 'Conexão', 'Realização',
]

function useStreak(checkIns: CheckIn[]) {
  return useMemo(() => {
    if (!checkIns.length) return 0
    const days = new Set(
      checkIns.map((c) => new Date(c.timestamp).toDateString())
    )
    let streak = 0
    const d = new Date()
    while (days.has(d.toDateString())) {
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }, [checkIns])
}

function timeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function todayCheckIn(checkIns: CheckIn[]) {
  const today = new Date().toDateString()
  return checkIns.find((c) => new Date(c.timestamp).toDateString() === today) ?? null
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts: number) {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoje'
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function groupByDay(checkIns: CheckIn[]) {
  const groups: Record<string, CheckIn[]> = {}
  checkIns.forEach((c) => {
    const key = new Date(c.timestamp).toDateString()
    if (!groups[key]) groups[key] = []
    groups[key].push(c)
  })
  return Object.entries(groups)
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .slice(0, 14)
}

export default function CheckInPage() {
  const router = useRouter()
  const { userName, addCheckIn, checkIns } = useCareStore()
  const typingMetrics = useTypingRhythm()
  const streak = useStreak(checkIns)
  const todayCi = todayCheckIn(checkIns)
  const grouped = useMemo(() => groupByDay(checkIns), [checkIns])

  const [mood, setMood] = useState<MoodLevel | null>(null)
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [step, setStep] = useState<'mood' | 'detail' | 'done'>('mood')
  const [submitting, setSubmitting] = useState(false)

  const toggle = (t: string) =>
    setSelectedTriggers((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t])

  const selectMood = (m: MoodLevel) => {
    setMood(m)
    if (m === 'otimo' || m === 'bem') {
      // skip triggers for positive moods, go straight to optional note
    }
    setStep('detail')
  }

  const submit = () => {
    if (!mood || submitting) return
    setSubmitting(true)
    const sensorData = typingMetrics ? { typingBurst: typingMetrics.burstScore } : undefined
    addCheckIn(mood, moodToScore[mood], note || undefined, selectedTriggers.length ? selectedTriggers : undefined, sensorData)
    setStep('done')
    setTimeout(() => {
      setStep('mood')
      setMood(null)
      setSelectedTriggers([])
      setNote('')
      setSubmitting(false)
    }, 2800)
  }

  const firstName = userName ? userName.split(' ')[0] : null

  return (
    <div className="min-h-screen pb-28 overflow-x-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-700"
        style={{
          background: mood
            ? `radial-gradient(ellipse 70% 35% at 50% 0%, ${moodColor[mood]}10 0%, transparent 70%)`
            : 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(0,212,160,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 px-5 pt-14">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[11px] tracking-[3px] uppercase mb-1" style={{ color: '#505050' }}>
              {timeGreeting()}{firstName ? `, ${firstName}` : ''}
            </p>
            <h1 className="font-bold text-white leading-tight" style={{ fontSize: 28, letterSpacing: -0.5 }}>
              Como você está?
            </h1>
          </div>
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center px-4 py-2.5 rounded-2xl"
              style={{ background: 'rgba(255,180,0,0.08)', border: '0.5px solid rgba(255,180,0,0.2)' }}
            >
              <span className="text-xl leading-none">🔥</span>
              <span className="font-bold text-sm mt-0.5" style={{ color: '#FFB800' }}>{streak}d</span>
              <span className="text-[9px] tracking-widest uppercase" style={{ color: '#FFB800', opacity: 0.6 }}>seguidos</span>
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP: MOOD */}
          {step === 'mood' && (
            <motion.div
              key="mood"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              {todayCi && (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)' }}
                >
                  <span className="text-xl">{moodEmoji[todayCi.mood]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">Último registro hoje: {moodLabel[todayCi.mood]}</p>
                    <p className="text-[11px]" style={{ color: '#505050' }}>{formatTime(todayCi.timestamp)}</p>
                  </div>
                  <span className="text-[10px] tracking-widest uppercase" style={{ color: '#00D4A0', opacity: 0.8 }}>✓ feito</span>
                </div>
              )}

              <p className="text-[11px] tracking-[2px] uppercase mb-4" style={{ color: '#505050' }}>
                {todayCi ? 'Novo registro' : 'Primeiro registro do dia'}
              </p>

              <div className="flex flex-col gap-2">
                {MOODS.map((m, i) => {
                  const c = moodColor[m]
                  const score = moodToScore[m]
                  return (
                    <motion.button
                      key={m}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ x: 6, scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => selectMood(m)}
                      className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left relative overflow-hidden"
                      style={{
                        background: `${c}0A`,
                        border: `0.5px solid ${c}25`,
                      }}
                    >
                      {/* color fill on left */}
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full" style={{ background: c }} />
                      {/* glow orb */}
                      <div className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none"
                        style={{ background: `linear-gradient(to left, ${c}08, transparent)` }} />

                      <span className="text-3xl relative z-10">{moodEmoji[m]}</span>
                      <div className="flex-1 relative z-10">
                        <p className="font-semibold text-white text-sm leading-none mb-0.5">{moodLabel[m]}</p>
                        <p className="text-[11px] font-light" style={{ color: `${c}80` }}>
                          {m === 'otimo' ? 'Energia alta, mente clara' :
                           m === 'bem' ? 'Estável, no ritmo' :
                           m === 'ok' ? 'Indo, algo leve pesa' :
                           m === 'mal' ? 'Cansado, peso emocional' :
                           'Precisando de apoio agora'}
                        </p>
                      </div>
                      <div className="relative z-10 flex flex-col items-end gap-0.5">
                        <span className="font-bold text-base tabular-nums" style={{ color: c }}>{score}</span>
                        <span className="text-[9px] tracking-wide" style={{ color: `${c}60` }}>pts</span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* History timeline */}
              {grouped.length > 0 && (
                <div className="mt-10">
                  <p className="text-[11px] tracking-[2px] uppercase mb-4" style={{ color: '#505050' }}>Histórico</p>
                  <div className="flex flex-col gap-5">
                    {grouped.map(([dayKey, cis]) => (
                      <div key={dayKey}>
                        <p className="text-[11px] font-medium mb-2.5 tracking-wide" style={{ color: '#404040' }}>
                          {formatDate(cis[0].timestamp)}
                        </p>
                        <div className="flex flex-col gap-2">
                          {cis.map((ci) => (
                            <div
                              key={ci.id}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl"
                              style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.06)' }}
                            >
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: moodColor[ci.mood] }}
                              />
                              <span className="text-lg">{moodEmoji[ci.mood]}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white">{moodLabel[ci.mood]}</p>
                                {ci.note && (
                                  <p className="text-[11px] truncate mt-0.5" style={{ color: '#505050' }}>{ci.note}</p>
                                )}
                                {ci.triggers && ci.triggers.length > 0 && (
                                  <p className="text-[10px] mt-0.5 truncate" style={{ color: '#404040' }}>
                                    {ci.triggers.join(', ')}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-0.5">
                                <span
                                  className="text-[11px] font-bold"
                                  style={{ color: scoreColor(ci.score) }}
                                >
                                  {ci.score}
                                </span>
                                <span className="text-[10px]" style={{ color: '#404040' }}>
                                  {formatTime(ci.timestamp)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP: DETAIL */}
          {step === 'detail' && mood && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              {/* Selected mood recap */}
              <div
                className="flex items-center gap-4 px-5 py-4 rounded-2xl mb-6"
                style={{
                  background: `${moodColor[mood]}10`,
                  border: `0.5px solid ${moodColor[mood]}40`,
                }}
              >
                <span className="text-3xl">{moodEmoji[mood]}</span>
                <div className="flex-1">
                  <p className="font-semibold text-white text-base">{moodLabel[mood]}</p>
                  <p className="text-[11px]" style={{ color: moodColor[mood], opacity: 0.8 }}>Score: {moodToScore[mood]}</p>
                </div>
                <button
                  onClick={() => { setMood(null); setStep('mood'); setSelectedTriggers([]); setNote('') }}
                  className="text-[11px] px-3 py-1.5 rounded-full"
                  style={{ color: '#505050', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)' }}
                >
                  Trocar
                </button>
              </div>

              {/* Crisis alert */}
              {mood === 'crise' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-2xl p-4 mb-5"
                  style={{ background: '#FF446610', border: '0.5px solid #FF446640' }}
                >
                  <p className="text-[#FF4466] text-sm font-medium">
                    ⚠️ Em situações de risco, ligue para o CVV: <strong>188</strong> (24h, gratuito)
                  </p>
                </motion.div>
              )}

              {/* Triggers — negative for ok/mal/crise, positive for otimo/bem */}
              {(mood === 'otimo' || mood === 'bem') && (
                <div className="mb-6">
                  <p className="text-[11px] tracking-[2px] uppercase mb-3" style={{ color: '#505050' }}>O que ajudou?</p>
                  <div className="flex flex-wrap gap-2">
                    {POSITIVE_TRIGGERS.map((t) => {
                      const sel = selectedTriggers.includes(t)
                      return (
                        <button
                          key={t}
                          onClick={() => toggle(t)}
                          className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                          style={{
                            background: sel ? 'rgba(0,212,160,0.12)' : 'rgba(255,255,255,0.04)',
                            border: sel ? '0.5px solid rgba(0,212,160,0.35)' : '0.5px solid rgba(255,255,255,0.08)',
                            color: sel ? '#00D4A0' : '#606060',
                          }}
                        >
                          {t}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {(mood === 'ok' || mood === 'mal' || mood === 'crise') && (
                <div className="mb-6">
                  <p className="text-[11px] tracking-[2px] uppercase mb-3" style={{ color: '#505050' }}>O que está pesando?</p>
                  <div className="flex flex-wrap gap-2">
                    {TRIGGERS.map((t) => {
                      const sel = selectedTriggers.includes(t)
                      return (
                        <button
                          key={t}
                          onClick={() => toggle(t)}
                          className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                          style={{
                            background: sel ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                            border: sel ? '0.5px solid rgba(255,255,255,0.25)' : '0.5px solid rgba(255,255,255,0.08)',
                            color: sel ? '#fff' : '#606060',
                          }}
                        >
                          {t}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Note */}
              <div className="mb-8">
                <p className="text-[11px] tracking-[2px] uppercase mb-3" style={{ color: '#505050' }}>Nota livre (opcional)</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={NOTE_PLACEHOLDER[mood]}
                  maxLength={300}
                  rows={3}
                  className="w-full text-white font-light text-sm leading-relaxed resize-none p-4 rounded-2xl outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '0.5px solid rgba(255,255,255,0.07)',
                    caretColor: '#fff',
                  }}
                />
                {note.length > 0 && (
                  <p className="text-right text-[10px] mt-1" style={{ color: '#404040' }}>{note.length}/300</p>
                )}
              </div>

              <button
                onClick={submit}
                disabled={submitting}
                className="w-full py-4 rounded-full font-semibold text-base tracking-wide transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #CCCCCC 100%)',
                  color: '#0A0A0A',
                }}
              >
                {submitting ? 'Registrando...' : 'Registrar agora'}
              </button>
            </motion.div>
          )}

          {/* STEP: DONE */}
          {step === 'done' && mood && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="flex flex-col items-center justify-center pt-20 gap-5"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="text-6xl"
              >
                {moodEmoji[mood]}
              </motion.div>
              <div className="text-center">
                <h2 className="font-bold text-2xl text-white mb-2">Registrado</h2>
                <p className="text-sm font-light" style={{ color: '#606060' }}>
                  Obrigado por se cuidar{firstName ? `, ${firstName}` : ''}.
                </p>
              </div>
              {streak > 0 && (
                <div
                  className="px-5 py-2.5 rounded-full text-sm font-medium"
                  style={{ background: 'rgba(255,180,0,0.1)', color: '#FFB800', border: '0.5px solid rgba(255,180,0,0.3)' }}
                >
                  🔥 {streak} {streak === 1 ? 'dia' : 'dias'} seguidos
                </div>
              )}
              <div className="w-16 h-1 rounded-full" style={{ background: moodColor[mood], opacity: 0.6 }} />

              {/* Contextual CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col gap-2 w-full mt-2"
              >
                {(mood === 'mal' || mood === 'crise') ? (
                  <button
                    onClick={() => router.replace('/chat')}
                    className="w-full py-3.5 rounded-2xl text-sm font-semibold"
                    style={{ background: 'rgba(0,212,160,0.1)', color: '#00D4A0', border: '0.5px solid rgba(0,212,160,0.25)' }}
                  >
                    💬 Conversar com CARE
                  </button>
                ) : (
                  <button
                    onClick={() => router.replace('/insights')}
                    className="w-full py-3.5 rounded-2xl text-sm font-semibold"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.08)' }}
                  >
                    Ver evolução →
                  </button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  )
}
