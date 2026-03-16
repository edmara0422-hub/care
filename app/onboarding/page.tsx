'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCareStore, MoodLevel, moodLabel, moodColor, moodToScore, PsychProfile } from '@/lib/store'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Answer { questionId: string; value: number; tags: string[] }

interface QuestionOption {
  label: string
  desc?: string
  value: number
  tags: string[]
  color?: string
}

interface Question {
  id: string
  category: string
  text: string
  sub?: string
  type: 'single' | 'multi' | 'scale'
  options: QuestionOption[]
}

// ─── Banco de perguntas ───────────────────────────────────────────────────────
const QUESTIONS: Question[] = [
  {
    id: 'diagnosis',
    category: 'DIAGNÓSTICO',
    text: 'Você já tem algum diagnóstico ou suspeita?',
    sub: 'Pode selecionar mais de um. Isso ajuda o CARE a ser mais preciso.',
    type: 'multi',
    options: [
      { label: 'Ansiedade', desc: 'Diagnóstico confirmado ou forte suspeita', value: 85, tags: ['ansiedade'], color: '#FF8C00' },
      { label: 'TDAH', desc: 'Diagnóstico confirmado ou forte suspeita', value: 85, tags: ['tdah'], color: '#7B8BFF' },
      { label: 'Depressão', desc: 'Diagnóstico confirmado ou forte suspeita', value: 85, tags: ['depressao'], color: '#FF4466' },
      { label: 'Burnout', desc: 'Diagnóstico confirmado ou episódio recente', value: 85, tags: ['burnout'], color: '#FF6B35' },
      { label: 'Enxaqueca crônica', desc: 'Fortemente ligada a ansiedade e estresse', value: 85, tags: ['ansiedade', 'estresse'], color: '#C084FC' },
      { label: 'Outro / Não sei', desc: 'Tenho sintomas mas sem diagnóstico formal', value: 0, tags: [] },
      { label: 'Nenhum diagnóstico', desc: 'Sem diagnóstico ou suspeita formal', value: 0, tags: [] },
    ],
  },
  {
    id: 'medication',
    category: 'MEDICAÇÃO',
    text: 'Você faz uso de alguma medicação?',
    sub: 'Isso ajuda o CARE a entender seu contexto de cuidado.',
    type: 'single',
    options: [
      { label: 'Sim, com acompanhamento', desc: 'Psiquiatra, neurologista ou médico prescreveu e acompanha', value: 0, tags: ['med_acompanhamento'], color: '#00D4A0' },
      { label: 'Sim, mas sem acompanhamento', desc: 'Tomo por conta própria ou a prescrição não é revisada há tempo', value: 60, tags: ['med_sem_acompanhamento', 'estresse'], color: '#FF8C00' },
      { label: 'Me automédico às vezes', desc: 'Ansiolíticos, analgésicos ou outros sem receita quando preciso', value: 70, tags: ['med_automedicacao', 'ansiedade', 'estresse'], color: '#FF6B35' },
      { label: 'Não tomo medicação', desc: 'Sem uso atual de medicamentos', value: 0, tags: ['med_nenhuma'], color: '#C8C8C8' },
    ],
  },
  {
    id: 'sleep',
    category: 'SONO',
    text: 'Como está seu sono nos últimos meses?',
    sub: 'Seja honesta — o CARE não julga.',
    type: 'single',
    options: [
      { label: 'Durmo bem', desc: 'Acordo descansada na maioria dos dias', value: 0, tags: [], color: '#00D4A0' },
      { label: 'Irregular', desc: 'Às vezes bem, às vezes horrível', value: 40, tags: ['estresse', 'ansiedade'], color: '#FFB800' },
      { label: 'Difícil adormecer', desc: 'A mente não para mesmo quando o corpo quer', value: 70, tags: ['ansiedade', 'tdah'], color: '#FF8C00' },
      { label: 'Acordo exausta', desc: 'Durmo, mas não descansa', value: 80, tags: ['depressao', 'burnout'], color: '#FF4466' },
      { label: 'Quase não durmo', desc: 'Insônia constante, cansaço extremo', value: 90, tags: ['ansiedade', 'depressao', 'burnout'], color: '#FF2255' },
    ],
  },
  {
    id: 'thoughts',
    category: 'MENTE',
    text: 'Seus pensamentos costumam...',
    sub: 'Como funciona sua cabeça no dia a dia?',
    type: 'single',
    options: [
      { label: 'Fluir com calma', desc: 'Consigo focar e pausar quando quero', value: 0, tags: [], color: '#00D4A0' },
      { label: 'Divagar bastante', desc: 'Minha mente viaja, às vezes me perco', value: 35, tags: ['tdah'], color: '#7BF8C4' },
      { label: 'Acelerar à noite', desc: 'De dia ok, mas à noite a mente dispara', value: 60, tags: ['ansiedade', 'estresse'], color: '#FFB800' },
      { label: 'Não conseguir parar', desc: 'Pensamentos rápidos, difíceis de controlar', value: 80, tags: ['ansiedade', 'tdah'], color: '#FF8C00' },
      { label: 'Me catastrofizar', desc: 'Vou direto ao pior cenário, sempre', value: 90, tags: ['ansiedade', 'depressao'], color: '#FF4466' },
    ],
  },
  {
    id: 'energy',
    category: 'ENERGIA',
    text: 'Como está sua energia e motivação?',
    sub: 'No geral, nos últimos 30 dias.',
    type: 'single',
    options: [
      { label: 'Alta e estável', desc: 'Acordo com vontade de encarar o dia', value: 0, tags: [], color: '#00D4A0' },
      { label: 'Oscila muito', desc: 'Tem dias bons e dias que mal saio da cama', value: 50, tags: ['estresse', 'ansiedade'], color: '#FFB800' },
      { label: 'Sempre cansada', desc: 'Faço o necessário, mas sem energia real', value: 70, tags: ['depressao', 'burnout'], color: '#FF8C00' },
      { label: 'Esgotada', desc: 'O cansaço não passa nem dormindo', value: 85, tags: ['burnout', 'depressao'], color: '#FF4466' },
      { label: 'Sem vontade de nada', desc: 'Coisas que amava não me animam mais', value: 95, tags: ['depressao'], color: '#FF2255' },
    ],
  },
  {
    id: 'focus',
    category: 'FOCO',
    text: 'Manter foco em uma tarefa por mais de 20 minutos é...',
    sub: 'Sem distrações externas — só você e a tarefa.',
    type: 'single',
    options: [
      { label: 'Fácil pra mim', desc: 'Entro em estado de fluxo naturalmente', value: 0, tags: [], color: '#00D4A0' },
      { label: 'Possível com esforço', desc: 'Consigo, mas preciso me forçar', value: 30, tags: ['estresse'], color: '#7BF8C4' },
      { label: 'Difícil mas faço', desc: 'Me distraio mas volto', value: 55, tags: ['tdah', 'ansiedade'], color: '#FFB800' },
      { label: 'Muito difícil', desc: 'Começo dez coisas e termino zero', value: 80, tags: ['tdah', 'ansiedade'], color: '#FF8C00' },
      { label: 'Quase impossível', desc: 'Minha mente recusa tarefas longas', value: 92, tags: ['tdah', 'depressao', 'ansiedade'], color: '#FF4466' },
    ],
  },
  {
    id: 'work',
    category: 'TRABALHO',
    text: 'Como você se sente em relação às suas responsabilidades?',
    sub: 'Trabalho, estudos, casa — tudo conta.',
    type: 'single',
    options: [
      { label: 'Equilibrada', desc: 'Dou conta e ainda tenho vida além', value: 0, tags: [], color: '#00D4A0' },
      { label: 'Muito ocupada', desc: 'A lista nunca acaba, mas sigo', value: 40, tags: ['estresse'], color: '#FFB800' },
      { label: 'Sobrecarregada', desc: 'Mais do que consigo, menos do que exigem', value: 70, tags: ['burnout', 'estresse'], color: '#FF8C00' },
      { label: 'No limite', desc: 'Já não sei mais o que é meu e o que é exigência', value: 85, tags: ['burnout', 'ansiedade'], color: '#FF4466' },
      { label: 'Esgotei', desc: 'Já passei do limite. O corpo e a mente avisaram', value: 95, tags: ['burnout', 'depressao'], color: '#FF2255' },
    ],
  },
  {
    id: 'body',
    category: 'CORPO',
    text: 'Você sente esses sintomas físicos com frequência?',
    sub: 'Selecione os que reconhece. Podem ser vários.',
    type: 'multi',
    options: [
      { label: 'Coração acelerado', desc: 'Sem motivo aparente', value: 1, tags: ['ansiedade'] },
      { label: 'Tensão muscular', desc: 'Pescoço, ombros, mandíbula', value: 1, tags: ['estresse', 'ansiedade'] },
      { label: 'Enxaqueca / dor de cabeça', desc: 'Frequente ou crônica — piora com estresse', value: 1, tags: ['estresse', 'ansiedade', 'burnout'] },
      { label: 'Falta de ar', desc: 'Aperto no peito, respiração curta', value: 1, tags: ['ansiedade'] },
      { label: 'Problemas digestivos', desc: 'Estômago, intestino, náusea', value: 1, tags: ['ansiedade', 'estresse'] },
      { label: 'Nenhum desses', desc: '', value: 0, tags: [] },
    ],
  },
]

const MOODS: MoodLevel[] = ['otimo', 'bem', 'ok', 'mal', 'crise']
const moodDesc: Record<MoodLevel, string> = {
  otimo: 'Energia alta, mente clara',
  bem: 'Estável, no ritmo',
  ok: 'Indo, mas algo pesa',
  mal: 'Cansada, pesada',
  crise: 'Precisando de apoio agora',
}

// ─── Calcula perfil psicológico ───────────────────────────────────────────────
function buildProfile(answers: Answer[]): PsychProfile {
  const tagCounts: Record<string, number> = {}

  // Separa respostas de diagnóstico existente das demais
  const diagAnswers = answers.filter(a => a.questionId === 'diagnosis')
  const otherAnswers = answers.filter(a => a.questionId !== 'diagnosis')

  // Diagnóstico existente: peso direto e alto (85 por tag confirmada)
  diagAnswers.forEach(a => {
    a.tags.forEach(t => { tagCounts[t] = Math.max(tagCounts[t] || 0, 85) })
  })

  // Respostas das perguntas comportamentais: acumulam sobre a base (ignora tags de controle)
  const CONTROL_TAGS = ['med_acompanhamento', 'med_sem_acompanhamento', 'med_automedicacao', 'med_nenhuma']
  otherAnswers.forEach(a => {
    a.tags.filter(t => !CONTROL_TAGS.includes(t)).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + a.value })
  })

  // Normaliza com caps mais baixos (mais sensível)
  // Max possível por categoria SEM diagnóstico existente:
  // ansiedade: sleep(90)+thoughts(90)+energy(50)+focus(92)+work(85)+body(60) ≈ 350 → cap 180
  // tdah: sleep(70)+thoughts(80)+focus(92) ≈ 242 → cap 120
  // depressao: sleep(90)+energy(95)+focus(92) ≈ 277 → cap 140
  // burnout: energy(85)+work(95) ≈ 180 → cap 110
  // estresse: sleep(40)+energy(50)+work(70)+body(60) ≈ 220 → cap 130
  const norm = (tag: string, cap: number) =>
    Math.min(100, Math.round((tagCounts[tag] || 0) / cap * 100))

  const anxietyScore   = norm('ansiedade', 180)
  const depressionScore = norm('depressao', 140)
  const tdahScore      = norm('tdah', 120)
  const burnoutScore   = norm('burnout', 110)
  const stressScore    = norm('estresse', 130)

  // Threshold baixo — detecta mesmo padrão moderado
  const detectedPatterns: string[] = []
  if (anxietyScore >= 30)   detectedPatterns.push('Ansiedade')
  if (depressionScore >= 30) detectedPatterns.push('Sinais depressivos')
  if (tdahScore >= 30)       detectedPatterns.push('Padrões de TDAH')
  if (burnoutScore >= 30)    detectedPatterns.push('Risco de burnout')
  if (stressScore >= 30)     detectedPatterns.push('Estresse elevado')
  if (detectedPatterns.length === 0) detectedPatterns.push('Estado estável')

  // Enxaqueca crônica
  const hasMigraine = diagAnswers.some(a => a.tags.includes('ansiedade') && a.tags.includes('estresse'))
    || otherAnswers.some(a => a.questionId === 'body' && a.tags.includes('estresse') && a.tags.includes('ansiedade'))

  // Medicação — usa tag única para distinguir cada opção
  const medAnswer = answers.find(a => a.questionId === 'medication')
  type MedStatus = 'acompanhamento' | 'sem_acompanhamento' | 'automedicacao' | 'nenhuma' | null
  let medicationStatus: MedStatus = null
  if (medAnswer) {
    if (medAnswer.tags.includes('med_acompanhamento'))       medicationStatus = 'acompanhamento'
    else if (medAnswer.tags.includes('med_sem_acompanhamento')) medicationStatus = 'sem_acompanhamento'
    else if (medAnswer.tags.includes('med_automedicacao'))   medicationStatus = 'automedicacao'
    else                                                      medicationStatus = 'nenhuma'
  }

  return { anxietyScore, depressionScore, tdahScore, burnoutScore, stressScore, detectedPatterns, hasMigraine, medicationStatus }
}

// ─── Barra de progresso ───────────────────────────────────────────────────────
function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          animate={{
            width: i === current ? 20 : 4,
            background: i < current ? '#fff' : i === current ? '#fff' : 'rgba(255,255,255,0.15)',
            opacity: i <= current ? 1 : 0.4,
          }}
          transition={{ duration: 0.3 }}
          style={{ height: 4 }}
        />
      ))}
    </div>
  )
}

// ─── Componente de questão ────────────────────────────────────────────────────
function QuestionScreen({
  q, qIndex, total, onAnswer, onBack,
}: { q: Question; qIndex: number; total: number; onAnswer: (v: number, tags: string[]) => void; onBack: () => void }) {
  const [selected, setSelected] = useState<number[]>([])
  const isMulti = q.type === 'multi'

  const EXCLUSIVE = ['Nenhum desses', 'Nenhum diagnóstico', 'Outro / Não sei']

  const toggle = (i: number) => {
    const opt = q.options[i]
    if (EXCLUSIVE.includes(opt.label)) { setSelected([i]); return }
    setSelected(prev => {
      const withoutExclusive = prev.filter(x => !EXCLUSIVE.includes(q.options[x]?.label ?? ''))
      return withoutExclusive.includes(i) ? withoutExclusive.filter(x => x !== i) : [...withoutExclusive, i]
    })
  }

  const canContinue = selected.length > 0

  const confirm = () => {
    if (!canContinue) return
    const opts = selected.map(i => q.options[i])
    const value = isMulti
      ? opts.reduce((s, o) => s + o.value * 15, 0)
      : opts[0].value
    const tags = isMulti
      ? [...new Set(opts.flatMap(o => o.tags))]
      : opts[0].tags
    onAnswer(value, tags)
    setSelected([])
  }

  // Cor de fundo baseada na seleção (questão single)
  const bgColor = !isMulti && selected.length > 0
    ? q.options[selected[0]]?.color || 'rgba(255,255,255,0.04)'
    : 'rgba(255,255,255,0.04)'

  return (
    <motion.div
      key={q.id}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col min-h-screen px-7 pt-14 pb-10"
    >
      {/* Glow dinâmico */}
      <motion.div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        animate={{ background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${bgColor}22 0%, transparent 100%)` }}
        transition={{ duration: 0.6 }}
        style={{ height: 300 }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Topo */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <ProgressDots total={total} current={qIndex} />
            <span className="text-white/25 text-[11px] font-medium tabular-nums" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {qIndex + 1}/{total}
            </span>
          </div>
          <span className="text-white/20 text-[10px] tracking-[3px] uppercase" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {q.category}
          </span>
        </div>

        {/* Pergunta */}
        <motion.h2
          className="font-bold text-white mb-2"
          style={{ fontSize: 30, letterSpacing: -0.8, lineHeight: 1.2, fontFamily: 'Poppins, sans-serif' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          {q.text}
        </motion.h2>
        {q.sub && (
          <motion.p
            className="text-white/30 text-sm font-light mb-8"
            style={{ fontFamily: 'Poppins, sans-serif' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            {q.sub}
          </motion.p>
        )}

        {/* Opções */}
        <div className="flex flex-col gap-2.5 flex-1">
          {q.options.map((opt, i) => {
            const on = selected.includes(i)
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => isMulti ? toggle(i) : setSelected([i])}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-start gap-4 px-5 py-4 rounded-2xl text-left relative overflow-hidden transition-all"
                style={{
                  background: on ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.025)',
                  border: on
                    ? `0.5px solid ${opt.color || 'rgba(255,255,255,0.3)'}55`
                    : '0.5px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Linha lateral colorida quando selecionado */}
                {on && opt.color && (
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full"
                    style={{ background: opt.color }}
                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                    transition={{ duration: 0.25 }}
                  />
                )}

                {/* Indicador */}
                <div className={`flex-shrink-0 mt-0.5 rounded-full transition-all ${isMulti ? 'w-4 h-4 border' : 'w-2.5 h-2.5'}`}
                  style={isMulti
                    ? { borderColor: on ? '#fff' : 'rgba(255,255,255,0.2)', background: on ? '#fff' : 'transparent' }
                    : { background: on ? (opt.color || '#fff') : 'rgba(255,255,255,0.12)' }
                  }
                />

                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="font-semibold text-sm" style={{ color: on ? '#fff' : '#555', fontFamily: 'Poppins, sans-serif' }}>
                    {opt.label}
                  </span>
                  {opt.desc && (
                    <span className="text-[11px] font-light leading-relaxed" style={{ color: on ? 'rgba(255,255,255,0.35)' : '#303030', fontFamily: 'Poppins, sans-serif' }}>
                      {opt.desc}
                    </span>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Botão continuar */}
        <div className="mt-5">
          <motion.button
            onClick={confirm}
            disabled={!canContinue}
            whileHover={canContinue ? { scale: 1.01 } : {}}
            whileTap={canContinue ? { scale: 0.98 } : {}}
            className="w-full py-4 rounded-full font-semibold text-sm tracking-wider uppercase relative overflow-hidden transition-all"
            style={{
              background: canContinue ? 'linear-gradient(135deg,#FFFFFF 0%,#D0D0D0 100%)' : 'rgba(255,255,255,0.05)',
              color: canContinue ? '#080808' : '#303030',
              boxShadow: canContinue ? '0 0 50px rgba(255,255,255,0.15)' : 'none',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {canContinue && (
              <motion.div className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }} whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }} />
            )}
            <span className="relative">Continuar</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Tela de análise ──────────────────────────────────────────────────────────
const PATTERN_META: Record<string, { color: string; icon: string; desc: string }> = {
  'Ansiedade':         { color: '#FF8C00', icon: '◎', desc: 'Pensamentos acelerados, antecipação de riscos, tensão constante' },
  'Sinais depressivos':{ color: '#FF4466', icon: '◌', desc: 'Baixa energia, perda de prazer, peso emocional persistente' },
  'Padrões de TDAH':   { color: '#7B8BFF', icon: '⌁', desc: 'Dificuldade de foco, impulsividade, mente dispersa' },
  'Risco de burnout':  { color: '#FF6B35', icon: '◈', desc: 'Esgotamento por sobrecarga, limites ultrapassados' },
  'Estresse elevado':  { color: '#FFB800', icon: '◉', desc: 'Acúmulo de pressão que impacta corpo e mente' },
  'Estado estável':    { color: '#00D4A0', icon: '○', desc: 'Nenhum padrão crítico detectado no momento' },
}

// Enxaqueca crônica ativa no perfil quando selecionada no diagnóstico
// → os tags 'ansiedade' e 'estresse' já sobem o score; o CARE vai monitorar gatilhos

function AnalysisScreen({ profile, name, onDone }: { profile: PsychProfile; name: string; onDone: () => void }) {
  const [phase, setPhase] = useState(0)
  const [scanPct, setScanPct] = useState(0)

  useEffect(() => {
    // Animação de scan
    let pct = 0
    const iv = setInterval(() => {
      pct += Math.random() * 6 + 2
      if (pct >= 100) { pct = 100; clearInterval(iv); setTimeout(() => setPhase(1), 300) }
      setScanPct(Math.round(pct))
    }, 60)
    const t2 = setTimeout(() => setPhase(2), 3000)
    const t3 = setTimeout(() => setPhase(3), 4500)
    return () => { clearInterval(iv); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const detected = profile.detectedPatterns
  const allBars = [
    { label: 'Ansiedade',  value: profile.anxietyScore,    color: '#FF8C00' },
    { label: 'Depressão',  value: profile.depressionScore, color: '#FF4466' },
    { label: 'TDAH',       value: profile.tdahScore,       color: '#7B8BFF' },
    { label: 'Burnout',    value: profile.burnoutScore,    color: '#FF6B35' },
    { label: 'Estresse',   value: profile.stressScore,     color: '#FFB800' },
  ].filter(b => b.value >= 20) // mostra só o que tem relevância

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="flex flex-col min-h-screen px-7 pt-16 pb-10"
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(255,255,255,0.04) 0%, transparent 70%)',
      }} />

      <div className="relative z-10 flex flex-col flex-1">

        {/* ─ FASE 0: Scanner ─ */}
        <AnimatePresence>
          {phase === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center flex-1 gap-8"
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              {/* Orb scanner */}
              <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
                <motion.div className="absolute rounded-full" style={{ width: 140, height: 140, border: '0.5px solid rgba(255,255,255,0.08)' }}
                  animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
                  <div className="absolute w-2 h-2 rounded-full bg-white/50" style={{ top: -4, left: '50%', transform: 'translateX(-50%)' }} />
                </motion.div>
                <motion.div className="absolute rounded-full" style={{ width: 90, height: 90, border: '0.5px solid rgba(255,255,255,0.14)' }}
                  animate={{ rotate: -360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}>
                  <div className="absolute w-1.5 h-1.5 rounded-full bg-white/35" style={{ bottom: -3, left: '50%', transform: 'translateX(-50%)' }} />
                </motion.div>
                <motion.div className="absolute rounded-full bg-white/5" style={{ width: 50, height: 50 }}
                  animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
                <span className="text-white font-bold text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>{scanPct}%</span>
              </div>

              <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                <div className="w-full h-px bg-white/07 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <motion.div className="h-full bg-white/50 rounded-full"
                    animate={{ width: `${scanPct}%` }} transition={{ duration: 0.1 }} />
                </div>
                <p className="text-white/30 text-xs tracking-widest" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Mapeando seu perfil emocional...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─ FASE 1+: Resultado ─ */}
        {phase >= 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="flex flex-col flex-1">

            <p className="text-white/20 text-[10px] tracking-[4px] uppercase mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Mapa emocional
            </p>
            <h2 className="font-bold text-white mb-1" style={{ fontSize: 30, letterSpacing: -1, lineHeight: 1.2, fontFamily: 'Poppins, sans-serif' }}>
              {name.split(' ')[0]}, veja o que<br />encontramos em você.
            </h2>
            <p className="text-white/25 text-xs font-light mb-7 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Baseado nas suas respostas e diagnósticos informados.<br />
              Não é diagnóstico — é ponto de partida.
            </p>

            {/* Padrões detectados — destaque */}
            <div className="flex flex-col gap-2.5 mb-7">
              {detected.map((p, i) => {
                const meta = PATTERN_META[p] || { color: '#888', icon: '○', desc: '' }
                return (
                  <motion.div key={p}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                    className="flex items-start gap-4 px-4 py-4 rounded-2xl relative overflow-hidden"
                    style={{ background: `${meta.color}0D`, border: `0.5px solid ${meta.color}35` }}
                  >
                    <motion.div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full" style={{ background: meta.color }}
                      initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }} />
                    <span className="text-lg mt-0.5" style={{ color: meta.color }}>{meta.icon}</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-sm text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>{p}</span>
                      <span className="text-[11px] font-light text-white/35 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>{meta.desc}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Barras de intensidade — só o relevante */}
            {allBars.length > 0 && (
              <motion.div className="flex flex-col gap-3 mb-6"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                <p className="text-white/20 text-[10px] tracking-[3px] uppercase" style={{ fontFamily: 'Poppins, sans-serif' }}>Intensidade</p>
                {allBars.map((b, i) => (
                  <div key={b.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] text-white/40" style={{ fontFamily: 'Poppins, sans-serif' }}>{b.label}</span>
                      <span className="text-[11px] font-mono" style={{ color: b.value >= 60 ? b.color : 'rgba(255,255,255,0.2)' }}>
                        {b.value >= 70 ? 'Elevado' : b.value >= 45 ? 'Moderado' : 'Presente'}
                      </span>
                    </div>
                    <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <motion.div className="h-full rounded-full" style={{ background: b.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${b.value}%` }}
                        transition={{ delay: 0.4 + i * 0.08, duration: 0.9, ease: 'easeOut' }} />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            <div className="mt-auto">
              {phase >= 3 && (
                <motion.button onClick={onDone}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-full font-semibold text-sm tracking-wider uppercase relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg,#FFFFFF 0%,#D0D0D0 100%)',
                    color: '#080808', boxShadow: '0 0 50px rgba(255,255,255,0.18)',
                    fontFamily: 'Poppins, sans-serif',
                  }}>
                  <motion.div className="absolute inset-0 bg-white/20"
                    initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.6 }} />
                  <span className="relative">Ver meu CARE</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Tela de humor inicial ────────────────────────────────────────────────────
function MoodScreen({ name, onDone }: { name: string; onDone: (m: MoodLevel) => void }) {
  const [mood, setMood] = useState<MoodLevel | null>(null)
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col min-h-screen px-7 pt-14 pb-10"
    >
      <div className="absolute top-0 left-0 right-0 pointer-events-none transition-all duration-700" style={{
        height: 250,
        background: mood
          ? `radial-gradient(ellipse 60% 40% at 50% 0%, ${moodColor[mood]}18 0%, transparent 100%)`
          : 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 100%)',
      }} />
      <div className="relative z-10 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-10">
          <ProgressDots total={QUESTIONS.length + 2} current={QUESTIONS.length + 1} />
          <span className="text-white/20 text-[10px] tracking-[3px] uppercase" style={{ fontFamily: 'Poppins, sans-serif' }}>AGORA</span>
        </div>
        <h2 className="font-bold text-white mb-1" style={{ fontSize: 30, letterSpacing: -0.8, lineHeight: 1.2, fontFamily: 'Poppins, sans-serif' }}>
          {name.split(' ')[0]}, e agora,<br />como você está?
        </h2>
        <p className="text-white/30 text-sm font-light mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Calibração final. O CARE começa a partir daqui.
        </p>
        <div className="flex flex-col gap-2.5 flex-1">
          {MOODS.map((m, i) => {
            const sel = mood === m
            return (
              <motion.button
                key={m}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.07, duration: 0.4 }}
                onClick={() => setMood(m)}
                whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left relative overflow-hidden transition-all"
                style={{
                  background: sel ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)',
                  border: sel ? '0.5px solid rgba(255,255,255,0.18)' : '0.5px solid rgba(255,255,255,0.05)',
                }}
              >
                {sel && <motion.div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full"
                  style={{ background: moodColor[m] }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.25 }} />}
                <motion.div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: moodColor[m] }}
                  animate={sel ? { scale: [1, 1.5, 1] } : { scale: 1 }} transition={{ duration: 0.4 }} />
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="font-semibold text-sm" style={{ color: sel ? '#fff' : '#555', fontFamily: 'Poppins, sans-serif' }}>{moodLabel[m]}</span>
                  <span className="text-[11px] font-light" style={{ color: sel ? 'rgba(255,255,255,0.35)' : '#333', fontFamily: 'Poppins, sans-serif' }}>{moodDesc[m]}</span>
                </div>
                {sel && <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-[#080808] flex-shrink-0"
                  style={{ background: '#fff' }}>✓</motion.div>}
              </motion.button>
            )
          })}
        </div>
        <div className="mt-5">
          <motion.button onClick={() => mood && onDone(mood)} disabled={!mood}
            whileHover={mood ? { scale: 1.01 } : {}} whileTap={mood ? { scale: 0.98 } : {}}
            className="w-full py-4 rounded-full font-semibold text-sm tracking-wider uppercase transition-all"
            style={{
              background: mood ? 'linear-gradient(135deg,#FFFFFF 0%,#D0D0D0 100%)' : 'rgba(255,255,255,0.05)',
              color: mood ? '#080808' : '#303030',
              boxShadow: mood ? '0 0 50px rgba(255,255,255,0.15)' : 'none',
              fontFamily: 'Poppins, sans-serif',
            }}>
            Entrar no CARE
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Tela de boas-vindas + nome ───────────────────────────────────────────────
function WelcomeScreen({ onDone }: { onDone: (name: string) => void }) {
  const [name, setName] = useState('')
  const [phase, setPhase] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 1500)
    const t3 = setTimeout(() => setPhase(3), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)
    const pts = Array.from({ length: 50 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, r: Math.random() * 1.0 + 0.3,
    }))
    let raf: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        pts.forEach(p2 => {
          const dx = p.x - p2.x, dy = p.y - p2.y, d = Math.sqrt(dx * dx + dy * dy)
          if (d < 100) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 100) * 0.07})`; ctx.lineWidth = 0.4; ctx.stroke() }
        })
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}
      className="flex flex-col items-center justify-center min-h-screen">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 65%)',
      }} />

      {/* ORB com C A R E dentro */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div className="relative flex items-center justify-center pointer-events-none"
            style={{ width: 340, height: 340 }}
            initial={{ opacity: 0, scale: 0.2 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}>
            <motion.div className="absolute rounded-full" style={{ width: 340, height: 340, border: '0.5px solid rgba(255,255,255,0.05)' }}
              animate={{ scale: [1, 1.07, 1] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.div className="absolute rounded-full" style={{ width: 245, height: 245, border: '0.5px solid rgba(255,255,255,0.1)' }}
              animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
              <div className="absolute w-2 h-2 rounded-full bg-white/55" style={{ top: -4, left: '50%', transform: 'translateX(-50%)' }} />
            </motion.div>
            <motion.div className="absolute rounded-full" style={{ width: 155, height: 155, border: '0.5px solid rgba(255,255,255,0.16)' }}
              animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}>
              <div className="absolute w-1.5 h-1.5 rounded-full bg-white/35" style={{ bottom: -3, right: '18%' }} />
            </motion.div>
            <motion.div className="absolute rounded-full" style={{
              width: 50, height: 50,
              background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 75%)', filter: 'blur(8px)',
            }} animate={{ scale: [1, 1.45, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }} />
            <div className="absolute w-3 h-3 rounded-full bg-white" style={{ filter: 'blur(1.5px)', zIndex: 5 }} />
            <AnimatePresence>
              {phase >= 2 && (
                <motion.div className="absolute z-10 flex items-center" style={{ gap: 4 }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
                  {['C','A','R','E'].map((l, i) => (
                    <motion.span key={l}
                      initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className="font-bold text-white select-none"
                      style={{ fontSize: 42, lineHeight: 1, letterSpacing: 2, fontFamily: 'Poppins, sans-serif', textShadow: '0 0 25px rgba(255,255,255,0.3)' }}>
                      {l}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulário */}
      <AnimatePresence>
        {phase >= 3 && (
          <motion.div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-sm px-8"
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginTop: 20 }}>
            <div className="text-center">
              <p className="text-white/20 text-[10px] tracking-[5px] uppercase mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Olá</p>
              <h2 className="text-white font-bold text-xl mb-1" style={{ fontFamily: 'Poppins, sans-serif', letterSpacing: -0.5 }}>
                Vamos te conhecer
              </h2>
              <p className="text-white/25 text-xs font-light" style={{ fontFamily: 'Poppins, sans-serif' }}>
                O CARE detecta seus padrões e se adapta a você.
              </p>
            </div>
            <div className="w-full flex flex-col gap-1">
              <input autoFocus type="text" placeholder="Como posso te chamar?" value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && name.trim() && onDone(name.trim())}
                maxLength={30}
                className="bg-transparent text-white font-semibold pb-3 text-2xl w-full placeholder-white/15 outline-none"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', caretColor: '#fff', fontFamily: 'Poppins, sans-serif' }} />
              {name.length > 0 && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-white/25 text-[10px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Olá, {name.split(' ')[0]} 🤍
                </motion.span>
              )}
            </div>
            <motion.button onClick={() => name.trim() && onDone(name.trim())} disabled={!name.trim()}
              whileHover={name.trim() ? { scale: 1.01 } : {}} whileTap={name.trim() ? { scale: 0.98 } : {}}
              className="w-full py-4 rounded-full font-semibold text-sm tracking-wider uppercase relative overflow-hidden transition-all"
              style={{
                background: name.trim() ? 'linear-gradient(135deg,#FFFFFF 0%,#D8D8D8 100%)' : 'rgba(255,255,255,0.05)',
                color: name.trim() ? '#080808' : '#303030',
                boxShadow: name.trim() ? '0 0 60px rgba(255,255,255,0.18)' : 'none',
                fontFamily: 'Poppins, sans-serif',
              }}>
              {name.trim() && <motion.div className="absolute inset-0 bg-white/25"
                initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.6 }} />}
              <span className="relative">Começar avaliação</span>
            </motion.button>
            <p className="text-white/12 text-[10px] tracking-widest text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Não substitui psicólogos ou psiquiatras
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────
type Stage = 'welcome' | 'questions' | 'analysis' | 'mood'

export default function OnboardingPage() {
  const router = useRouter()
  const store = useCareStore()
  const [stage, setStage] = useState<Stage>('welcome')
  const [name, setName] = useState('')
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [profile, setProfile] = useState<PsychProfile | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (store.hasOnboarded) router.replace('/home')
  }, [store.hasOnboarded, router])

  if (!mounted) return null

  const handleWelcomeDone = (n: string) => {
    setName(n)
    store.setUserName(n)
    setStage('questions')
  }

  const handleBack = () => {
    if (qIndex > 0) {
      setQIndex(qIndex - 1)
      setAnswers(answers.slice(0, -1))
    } else {
      setStage('welcome')
    }
  }

  const handleAnswer = (value: number, tags: string[]) => {
    const updated = [...answers, { questionId: QUESTIONS[qIndex].id, value, tags }]
    setAnswers(updated)
    if (qIndex + 1 < QUESTIONS.length) {
      setQIndex(qIndex + 1)
    } else {
      const p = buildProfile(updated)
      setProfile(p)
      store.setPsychProfile(p)
      if (p.medicationStatus) store.setMedicationStatus(p.medicationStatus)
      store.setWellnessGoals(p.detectedPatterns
        .map(d => d === 'Ansiedade' ? 'ansiedade' : d === 'Sinais depressivos' ? 'depressao' : d === 'Padrões de TDAH' ? 'foco' : d === 'Risco de burnout' ? 'burnout' : 'estresse')
        .filter(Boolean) as any)
      setStage('analysis')
    }
  }

  const handleMoodDone = (m: MoodLevel) => {
    store.addCheckIn(m, moodToScore[m])
    store.setHasOnboarded(true)
    router.replace('/start')
  }

  return (
    <div className="relative min-h-screen bg-[#080808] overflow-hidden">
      <AnimatePresence mode="wait">
        {stage === 'welcome' && (
          <motion.div key="welcome" className="w-full">
            <WelcomeScreen onDone={handleWelcomeDone} />
          </motion.div>
        )}
        {stage === 'questions' && (
          <motion.div key={`q-${qIndex}`} className="w-full">
            <QuestionScreen
              q={QUESTIONS[qIndex]}
              qIndex={qIndex}
              total={QUESTIONS.length}
              onAnswer={handleAnswer}
              onBack={handleBack}
            />
          </motion.div>
        )}
        {stage === 'analysis' && profile && (
          <motion.div key="analysis" className="w-full">
            <AnalysisScreen profile={profile} name={name} onDone={() => setStage('mood')} />
          </motion.div>
        )}
        {stage === 'mood' && (
          <motion.div key="mood" className="w-full">
            <MoodScreen name={name} onDone={handleMoodDone} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
