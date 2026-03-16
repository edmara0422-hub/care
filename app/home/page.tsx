'use client'
import { useEffect, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  useCareStore, scoreColor, scoreLabel, moodLabel, moodColor, moodEmoji, CheckIn, WellnessGoal,
} from '@/lib/store'
import { useHydrated } from '@/lib/useHydrated'
import { useTypingRhythm } from '@/lib/useSensors'
import ScoreRing from '@/components/ScoreRing'
import BottomNav from '@/components/BottomNav'

// ── helpers ────────────────────────────────────────────────────────────────

function greeting(name: string) {
  const h = new Date().getHours()
  return (name ? (h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite') + ', ' + name.split(' ')[0] : (h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'))
}

function useStreak(checkIns: { timestamp: number }[]) {
  const days = new Set(checkIns.map(c => new Date(c.timestamp).toDateString()))
  let streak = 0; const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    if (days.has(d.toDateString())) streak++; else if (i > 0) break
  }
  return streak
}

function dayAvg(checkIns: CheckIn[], offset: number): number | null {
  const d = new Date(); d.setDate(d.getDate() - offset); d.setHours(0, 0, 0, 0)
  const n = new Date(d); n.setDate(d.getDate() + 1)
  const c = checkIns.filter(x => x.timestamp >= d.getTime() && x.timestamp < n.getTime())
  return c.length ? Math.round(c.reduce((s, x) => s + x.score, 0) / c.length) : null
}

type CheckInSchedule = 'manha' | 'tarde' | 'noite'

function timeOfDayAvg(checkIns: CheckIn[]) {
  const buckets: Record<string, number[]> = { manhã: [], tarde: [], noite: [] }
  checkIns.forEach(ci => {
    const h = new Date(ci.timestamp).getHours()
    if (h >= 6 && h < 12) buckets['manhã'].push(ci.score)
    else if (h >= 12 && h < 18) buckets['tarde'].push(ci.score)
    else buckets['noite'].push(ci.score)
  })
  return Object.entries(buckets)
    .map(([label, scores]) => ({
      label,
      avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      count: scores.length,
    }))
    .filter(p => p.avg !== null && p.count >= 2)
}

function nextCheckIn(schedule: CheckInSchedule[], checkIns: CheckIn[]): string | null {
  const now = new Date()
  const h = now.getHours()
  const todayStr = now.toDateString()
  const todayHours = checkIns
    .filter(c => new Date(c.timestamp).toDateString() === todayStr)
    .map(c => new Date(c.timestamp).getHours())
  const slots: Record<CheckInSchedule, { h: number; label: string }> = {
    manha: { h: 8, label: '08:00' },
    tarde: { h: 14, label: '14:00' },
    noite: { h: 20, label: '20:00' },
  }
  for (const s of schedule) {
    const slot = slots[s]
    if (slot.h > h && !todayHours.some(th => Math.abs(th - slot.h) < 3)) return slot.label
  }
  return null
}

const goalLabel: Record<WellnessGoal, string> = {
  ansiedade: 'Ansiedade', estresse: 'Estresse', sono: 'Sono',
  foco: 'Foco', burnout: 'Burnout', depressao: 'Depressão',
}
const goalColor: Record<WellnessGoal, string> = {
  ansiedade: '#FF8C00', estresse: '#FFB800', sono: '#7B8BFF',
  foco: '#00D4A0', burnout: '#FF6B35', depressao: '#FF4466',
}

// Real check-in chart: individual data points + trend line + day labels + y-axis
function CheckInChart({ checkIns, color, width = 350 }: {
  checkIns: CheckIn[]; color: string; width?: number
}) {
  const H = 88
  const PAD_L = 28  // space for y-axis labels
  const PAD_B = 20  // space for x-axis labels
  const W = width - PAD_L
  const chartH = H - PAD_B

  // Last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0)
    const next = new Date(d); next.setDate(d.getDate() + 1)
    return { date: d, next, label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '') }
  })
  const isToday = (d: Date) => d.toDateString() === new Date().toDateString()

  // Map each check-in to x,y
  const pts: { x: number; y: number; score: number; color: string; id: string }[] = []
  checkIns.forEach(ci => {
    const ts = ci.timestamp
    const dayIdx = days.findIndex(d => ts >= d.date.getTime() && ts < d.next.getTime())
    if (dayIdx === -1) return
    // Within-day x offset for multiple check-ins
    const sameDayPts = pts.filter(p => {
      const cx = (dayIdx / 6) * W + PAD_L
      return Math.abs(p.x - cx) < 10
    })
    const xBase = (dayIdx / 6) * W + PAD_L
    const xJitter = sameDayPts.length * 6 - (sameDayPts.length > 0 ? 3 : 0)
    const y = chartH - (ci.score / 100) * (chartH - 8) - 4
    pts.push({ x: xBase + xJitter, y, score: ci.score, color: moodColor[ci.mood], id: ci.id })
  })

  // Trend line through daily averages
  const dailyAvgs = days.map((d, i) => {
    const cis = checkIns.filter(c => c.timestamp >= d.date.getTime() && c.timestamp < d.next.getTime())
    if (!cis.length) return null
    const avg = cis.reduce((s, c) => s + c.score, 0) / cis.length
    return { x: (i / 6) * W + PAD_L, y: chartH - (avg / 100) * (chartH - 8) - 4 }
  })
  const trendPts = dailyAvgs.filter(Boolean) as { x: number; y: number }[]
  const trendLine = trendPts.length >= 2 ? trendPts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = trendPts[i - 1], cx = (prev.x + pt.x) / 2
    return `${acc} C ${cx} ${prev.y} ${cx} ${pt.y} ${pt.x} ${pt.y}`
  }, '') : null

  const gid = `cg${color.replace('#', '')}`

  if (pts.length === 0) return (
    <div style={{ height: H }} className="flex items-center justify-center">
      <p className="text-[10px] tracking-widest" style={{ color: '#252525' }}>faca seu primeiro check-in</p>
    </div>
  )

  return (
    <svg width={width} height={H} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y-axis reference lines + labels */}
      {[25, 50, 75, 100].map(v => {
        const y = chartH - (v / 100) * (chartH - 8) - 4
        return (
          <g key={v}>
            <line x1={PAD_L} y1={y} x2={PAD_L + W} y2={y}
              stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} strokeDasharray="3 5" />
            <text x={PAD_L - 4} y={y + 3.5} textAnchor="end" fontSize={7}
              fill="rgba(255,255,255,0.15)" fontFamily="monospace">{v}</text>
          </g>
        )
      })}

      {/* Today column highlight */}
      {(() => {
        const todayIdx = days.findIndex(d => isToday(d.date))
        if (todayIdx === -1) return null
        const x = (todayIdx / 6) * W + PAD_L
        return <rect x={x - 14} y={0} width={28} height={chartH}
          fill={`${color}07`} rx={4} />
      })()}

      {/* X-axis day labels */}
      {days.map((d, i) => {
        const x = (i / 6) * W + PAD_L
        const today = isToday(d.date)
        return (
          <text key={i} x={x} y={H - 2} textAnchor="middle" fontSize={8}
            fill={today ? color : 'rgba(255,255,255,0.18)'}
            fontWeight={today ? 600 : 400} fontFamily="system-ui">
            {today ? 'hoje' : d.label}
          </text>
        )
      })}

      {/* Trend line (daily averages) */}
      {trendLine && (
        <motion.path d={trendLine} fill="none" stroke={color} strokeWidth={1} strokeLinecap="round"
          strokeOpacity={0.35} strokeDasharray="3 3"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }} />
      )}

      {/* Area fill under trend */}
      {trendLine && trendPts.length >= 2 && (
        <path
          d={`${trendLine} L ${trendPts[trendPts.length - 1].x} ${chartH} L ${trendPts[0].x} ${chartH} Z`}
          fill={`url(#${gid})`} />
      )}

      {/* Individual check-in dots */}
      {pts.map((pt, i) => (
        <motion.circle key={pt.id} cx={pt.x} cy={pt.y} r={3.5}
          fill={pt.color}
          style={{ filter: `drop-shadow(0 0 3px ${pt.color}90)` }}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.06, type: 'spring', stiffness: 400, damping: 20 }} />
      ))}

      {/* Glowing latest dot */}
      {pts.length > 0 && (() => {
        const last = pts[pts.length - 1]
        return (
          <motion.circle cx={last.x} cy={last.y} r={5} fill="none"
            stroke={last.color} strokeWidth={1}
            animate={{ r: [5, 7, 5], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity }} />
        )
      })()}
    </svg>
  )
}

// Live typing rhythm waveform — 8 bars animated by burstScore
const TypingWave = memo(function TypingWave({ score }: { score: number | null }) {
  const bars = 8
  return (
    <div className="flex items-center gap-[2px]" style={{ height: 18 }}>
      {Array.from({ length: bars }, (_, i) => {
        const active = score !== null
        const targetH = active ? Math.max(3, Math.round((score / 100) * 14 * (0.5 + Math.abs(Math.sin(i * 0.9)) * 0.5))) : 3
        return (
          <motion.div key={i}
            className="w-[2px] rounded-full"
            style={{ background: active ? '#00D4A0' : 'rgba(255,255,255,0.1)' }}
            animate={{ height: targetH }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
          />
        )
      })}
    </div>
  )
})

// (removed — inline sensor panels used instead)

const PRACTICE_RECO: Record<string, { title: string; sub: string; href: string; emoji: string; color: string }> = {
  'Ansiedade':          { title: 'Respiracao 4-7-8',        sub: 'Regula sistema nervoso em 90s', href: '/breathe',   emoji: '🫁', color: '#FF8C00' },
  'Padrões de TDAH':    { title: 'Foco — Timer Pomodoro',   sub: 'Blocos de 25min focados',       href: '/practices', emoji: '⏱', color: '#7B8BFF' },
  'Sinais depressivos': { title: 'Ativacao comportamental', sub: 'A menor acao muda o estado',    href: '/practices', emoji: '🌱', color: '#FF4466' },
  'Risco de burnout':   { title: 'Respiracao Box',          sub: 'Desativa modo alerta cronico',  href: '/breathe',   emoji: '🧘', color: '#FF6B35' },
  'Estresse elevado':   { title: 'Coerencia cardiaca',      sub: '5 minutos para equilibrio',     href: '/breathe',   emoji: '💙', color: '#FFB800' },
}

const DAILY_QUOTES = [
  { text: 'A acao precede a motivacao — nao o contrario.', source: 'Russ Harris' },
  { text: 'O corpo guarda o placar. A cura comeca por sentir.', source: 'Bessel van der Kolk' },
  { text: 'Nomear uma emocao com precisao reduz sua intensidade.', source: 'Neurociencia' },
  { text: 'Presenca e a unica coisa que o medo nao consegue habitar.', source: 'Eckhart Tolle' },
  { text: 'Respiracao lenta e o interruptor mais acessivel do sistema nervoso.', source: 'A. Huberman' },
  { text: 'Quem tem um porque para viver suporta quase qualquer como.', source: 'Viktor Frankl' },
]

// ── component ──────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const {
    userName, currentScore, currentMood, checkIns, hasOnboarded,
    psychProfile, completedPractices, achievements, sleepLogs, chatMessages,
    wellnessGoals, checkInSchedule, detectionMethods,
  } = useCareStore()
  const hydrated = useHydrated()
  const streak = useStreak(checkIns)
  const color = scoreColor(currentScore)

  // Live passive sensor — no permission needed
  const typingMetrics = useTypingRhythm()

  useEffect(() => {
    if (!hydrated) return
    if (!hasOnboarded) router.replace('/onboarding')
  }, [hydrated, hasOnboarded, router])

  const today = new Date().toDateString()
  const hasCheckedToday = checkIns.some(c => new Date(c.timestamp).toDateString() === today)
  const todayCheckIns = checkIns.filter(c => new Date(c.timestamp).toDateString() === today)

  const { yesterday, delta, weekAvg } = useMemo(() => {
    const yd = dayAvg(checkIns, 1)
    const scores = Array.from({ length: 7 }, (_, i) => dayAvg(checkIns, i)).filter(Boolean) as number[]
    return {
      yesterday: yd,
      delta: yd !== null ? currentScore - yd : null,
      weekAvg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    }
  }, [checkIns, currentScore])

  const lastSleep = sleepLogs[0] ?? null

  const { patterns, practice } = useMemo(() => {
    const ps = psychProfile?.detectedPatterns.filter(p => p !== 'Estado estavel') ?? []
    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
    const primary = ps.length > 0 ? ps[weekNumber % ps.length] : null
    return { patterns: ps, practice: primary ? PRACTICE_RECO[primary] : null }
  }, [psychProfile])

  const quote = DAILY_QUOTES[new Date().getDate() % DAILY_QUOTES.length]

  const recentMoods = useMemo(() => checkIns.slice(0, 7), [checkIns])

  const profileScores = useMemo(() => psychProfile ? [
    { label: 'Ansiedade', value: psychProfile.anxietyScore,    color: '#FF8C00' },
    { label: 'Estresse',  value: psychProfile.stressScore,     color: '#FFB800' },
    { label: 'Depressao', value: psychProfile.depressionScore, color: '#FF4466' },
    { label: 'Burnout',   value: psychProfile.burnoutScore,    color: '#FF6B35' },
    { label: 'TDAH',      value: psychProfile.tdahScore,       color: '#7B8BFF' },
  ] : [], [psychProfile])

  const timePatterns = useMemo(() => timeOfDayAvg(checkIns), [checkIns])
  const nextCITime = useMemo(() => nextCheckIn(checkInSchedule as CheckInSchedule[], checkIns), [checkInSchedule, checkIns])
  const otherSensors = useMemo(() => (detectionMethods as string[]).filter(m => m !== 'digitacao'), [detectionMethods])

  // Typing rhythm label
  const typingLabel = typingMetrics === null ? 'aguardando...' :
    typingMetrics.burstScore > 70 ? 'rapido e intenso' :
    typingMetrics.burstScore > 40 ? 'ritmo normal' : 'lento / pausado'

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* The global CareBackground neural canvas + aurora is already rendered by layout */}

      {/* Score-tinted breathing glow — complements the neural canvas */}
      <motion.div className="fixed inset-0 z-0 pointer-events-none"
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: `radial-gradient(ellipse 75% 55% at 50% -5%, ${color}14 0%, transparent 60%)` }}
      />

      <div className="relative z-10 flex justify-center">
        <div className="w-full max-w-[430px] px-4 pt-12 pb-32 flex flex-col gap-3">

          {/* ── Header ── */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-1 mb-1">
            <div>
              <p className="text-white font-semibold text-[17px]">{greeting(userName)}</p>
              <p className="text-white/20 text-[11px] mt-0.5 capitalize">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {streak > 0 && (
                <motion.div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,184,0,0.08)', border: '0.5px solid rgba(255,184,0,0.2)' }}
                  animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>
                  <span className="text-sm">🔥</span>
                  <span className="text-[12px] font-bold tabular-nums" style={{ color: '#FFB800' }}>{streak}</span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,184,0,0.45)' }}>dias</span>
                </motion.div>
              )}
              <Link href="/settings" className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.09)' }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.8}>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </Link>
            </div>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* EMPTY STATE — zero check-ins */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {checkIns.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl px-6 py-8 flex flex-col items-center gap-4 text-center"
              style={{
                background: 'rgba(10,10,10,0.6)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: `0.5px solid ${color}22`,
              }}>
              <motion.div
                animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3.5, repeat: Infinity }}
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{ background: `${color}12`, border: `0.5px solid ${color}30` }}>
                🌱
              </motion.div>
              <div>
                <p className="text-white font-semibold text-base">Tudo pronto para começar</p>
                <p className="text-[13px] font-light mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Seu primeiro check-in vai ativar o monitoramento emocional, o gráfico de evolução e insights personalizados.
                </p>
              </div>
              <Link href="/checkin"
                className="px-6 py-3 rounded-2xl text-sm font-semibold"
                style={{ background: color, color: '#0A0A0A' }}>
                Fazer primeiro check-in
              </Link>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CARD 1 — Score ring + live sensor signals + sparkline */}
          {/* Glass card intentionally semi-transparent: neural canvas shows through */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {checkIns.length > 0 && <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(10,10,10,0.65)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: `0.5px solid ${color}22`,
              boxShadow: `0 0 40px ${color}08, inset 0 0.5px 0 rgba(255,255,255,0.05)`,
            }}>

            {/* Score ring + context — number only inside ScoreRing, no duplicate */}
            <div className="flex items-center gap-4 px-5 pt-5 pb-3">
              <ScoreRing score={currentScore} size={120} strokeWidth={7} showLabel={false} />
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                {/* Delta badge */}
                {delta !== null && delta !== 0 && (
                  <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-1.5 w-fit">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ color: delta > 0 ? '#00D4A0' : '#FF4466', background: delta > 0 ? 'rgba(0,212,160,0.1)' : 'rgba(255,68,102,0.1)' }}>
                      {delta > 0 ? `+${delta}` : delta} vs ontem
                    </span>
                  </motion.div>
                )}
                <p className="text-sm font-medium leading-tight" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {scoreLabel(currentScore)}
                </p>
                {currentMood && (
                  <div className="flex items-center gap-1.5">
                    <span>{moodEmoji[currentMood]}</span>
                    <span className="text-xs font-light" style={{ color: moodColor[currentMood] }}>{moodLabel[currentMood]}</span>
                  </div>
                )}
                {weekAvg !== null && (
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
                    media 7d: <span className="font-semibold tabular-nums" style={{ color: 'rgba(255,255,255,0.32)' }}>{weekAvg}</span>
                  </p>
                )}
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
                  {checkIns.length} registros totais
                </p>
              </div>
            </div>

            {/* Live sensor signals */}
            <div className="px-5 pb-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <motion.div className="w-1 h-1 rounded-full" style={{ background: '#00D4A0' }}
                  animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
                <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: '#2a2a2a' }}>
                  sinais em monitoramento
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {/* Typing — LIVE, full-width */}
                <div className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: typingMetrics ? 'rgba(0,212,160,0.06)' : 'rgba(255,255,255,0.03)', border: `0.5px solid ${typingMetrics ? 'rgba(0,212,160,0.18)' : 'rgba(255,255,255,0.06)'}` }}>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider" style={{ color: '#444' }}>⌨ digitação</span>
                      <AnimatePresence>
                        {typingMetrics && (
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-[8px] font-bold" style={{ color: '#00D4A0' }}>ATIVO</motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <p className="text-[9px]" style={{ color: typingMetrics ? 'rgba(255,255,255,0.4)' : '#333' }}>
                      {typingLabel}
                    </p>
                  </div>
                  <TypingWave score={typingMetrics?.burstScore ?? null} />
                </div>

                {/* Other sensors — single compact row */}
                <Link href="/sensors"
                  className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2">
                    {otherSensors.length > 0 ? (
                      <>
                        <span className="text-[9px]" style={{ color: '#444' }}>
                          {[
                            otherSensors.includes('camera_frontal') && '📷',
                            otherSensors.includes('microfone') && '🎤',
                            otherSensors.includes('acelerometro') && '📱',
                            otherSensors.includes('camera_traseira') && '🔦',
                          ].filter(Boolean).join(' ')}
                        </span>
                        <span className="text-[9px]" style={{ color: '#383838' }}>
                          {otherSensors.length} sensor{otherSensors.length > 1 ? 'es' : ''} configurado{otherSensors.length > 1 ? 's' : ''} — ativar
                        </span>
                      </>
                    ) : (
                      <span className="text-[9px]" style={{ color: '#383838' }}>📷 🎤 📱 · ativar sensores biométricos</span>
                    )}
                  </div>
                  <span className="text-[9px]" style={{ color: '#333' }}>→</span>
                </Link>
              </div>
            </div>

            {/* Real check-in chart */}
            <div className="px-4 pb-4 pt-1">
              <div className="flex justify-between mb-2">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: '#2a2a2a' }}>
                  check-ins — 7 dias · cada ponto = 1 registro
                </span>
                <Link href="/insights" className="text-[9px] uppercase tracking-widest" style={{ color: '#333' }}>insights →</Link>
              </div>
              <CheckInChart checkIns={checkIns} color={color} width={358} />
            </div>

            {/* Time-of-day pattern — only when 2+ periods have enough data */}
            {timePatterns.length >= 2 && (
              <div className="px-4 pb-4 flex gap-2">
                {timePatterns.map(p => (
                  <div key={p.label} className="flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-[8px] capitalize" style={{ color: '#444' }}>{p.label}</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(p.avg!) }}>{p.avg}</span>
                    <span className="text-[7px]" style={{ color: '#303030' }}>{p.count} reg.</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CARD 2 — Activity grid */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {checkIns.length > 0 && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
            className="grid grid-cols-2 gap-2">
            {[
              { href: '/checkin', label: 'check-ins hoje', value: todayCheckIns.length, sub: hasCheckedToday ? 'registrado' : 'pendente', color: hasCheckedToday ? '#00D4A0' : color, dot: !hasCheckedToday },
              { href: '/practices', label: 'praticas', value: completedPractices.length, sub: 'concluidas', color: 'rgba(255,255,255,0.55)' },
              { href: '/achievements', label: 'conquistas', value: achievements.length, sub: 'desbloqueadas', color: 'rgba(255,184,0,0.8)' },
              lastSleep
                ? { href: '/sleep', label: 'ultimo sono', value: `${lastSleep.hours}h`, sub: `qualidade ${lastSleep.quality}/5`, color: 'rgba(123,139,255,0.85)' }
                : { href: '/chat', label: 'tutor CARE', value: chatMessages.filter(m => m.role === 'user').length, sub: 'mensagens', color: 'rgba(0,212,160,0.75)' },
            ].map((item, i) => (
              <motion.div key={item.href} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.14 + i * 0.04 }}>
                <Link href={item.href}
                  className="flex flex-col justify-between p-4 rounded-2xl h-24"
                  style={{
                    background: 'rgba(10,10,10,0.55)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '0.5px solid rgba(255,255,255,0.07)',
                    boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.04)',
                  }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: '#3a3a3a' }}>{item.label}</span>
                    {item.dot && (
                      <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: color }}
                        animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    )}
                  </div>
                  <div>
                    <span className="text-3xl font-bold tabular-nums leading-none" style={{ color: item.color }}>
                      {item.value}
                    </span>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.18)' }}>{item.sub}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CARD 3 — Check-in CTA */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}>
            <Link href="/checkin"
              className="flex items-center justify-between px-5 py-4 rounded-2xl"
              style={{
                background: hasCheckedToday ? 'rgba(0,212,160,0.06)' : `${color}10`,
                backdropFilter: 'blur(16px)',
                border: `0.5px solid ${hasCheckedToday ? 'rgba(0,212,160,0.25)' : `${color}38`}`,
              }}>
              <div className="flex items-center gap-3">
                {!hasCheckedToday && (
                  <motion.div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }}
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }} />
                )}
                <div>
                  <p className="text-sm font-semibold" style={{ color: hasCheckedToday ? '#00D4A0' : '#fff' }}>
                    {hasCheckedToday ? '✓ Check-in registrado hoje' : 'Como voce esta agora?'}
                  </p>
                  <p className="text-[11px] mt-0.5 font-light" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {hasCheckedToday
                      ? 'Toque para novo registro'
                      : nextCITime
                      ? `Próximo agendado: ${nextCITime}`
                      : 'Registre seu estado emocional'}
                  </p>
                </div>
              </div>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                stroke={hasCheckedToday ? 'rgba(0,212,160,0.45)' : `${color}70`} strokeWidth={2.5} strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CARD 3b — Wellness goals */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {wellnessGoals.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}
              className="rounded-2xl px-4 py-3.5"
              style={{
                background: 'rgba(10,10,10,0.5)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '0.5px solid rgba(255,255,255,0.06)',
              }}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: '#3a3a3a' }}>Seus objetivos</span>
                <Link href="/profile" className="text-[9px]" style={{ color: '#333' }}>editar →</Link>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(wellnessGoals as WellnessGoal[]).map(g => (
                  <motion.span key={g}
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{ color: goalColor[g], background: `${goalColor[g]}14`, border: `0.5px solid ${goalColor[g]}28` }}>
                    {goalLabel[g]}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CARD 4 — Psych profile scores */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {profileScores.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }}
              className="rounded-2xl px-4 py-4"
              style={{
                background: 'rgba(10,10,10,0.55)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '0.5px solid rgba(255,255,255,0.07)',
              }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: '#444' }}>Perfil psicologico</span>
                <Link href="/profile" className="text-[10px]" style={{ color: '#333' }}>detalhes →</Link>
              </div>
              <div className="flex flex-col gap-2.5">
                {profileScores.map((ps, i) => (
                  <div key={ps.label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: ps.value > 60 ? ps.color : 'rgba(255,255,255,0.3)' }}>{ps.label}</span>
                      <span className="text-[10px] tabular-nums" style={{ color: ps.value > 60 ? ps.color : 'rgba(255,255,255,0.2)' }}>{ps.value}%</span>
                    </div>
                    <div className="h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div className="h-full rounded-full"
                        style={{
                          background: ps.value > 60 ? `linear-gradient(90deg, ${ps.color}, ${ps.color}60)` : 'rgba(255,255,255,0.1)',
                          boxShadow: ps.value > 60 ? `0 0 6px ${ps.color}50` : 'none',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${ps.value}%` }}
                        transition={{ delay: 0.3 + i * 0.07, duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CARD 5 — Humor recente */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {recentMoods.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: '#3a3a3a' }}>Humor recente</span>
                <Link href="/insights" className="text-[10px]" style={{ color: '#333' }}>grafico →</Link>
              </div>
              <div className="flex gap-2"
                style={{ overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                {recentMoods.map((ci, i) => {
                  const d = new Date(ci.timestamp)
                  const isToday = today === d.toDateString()
                  const c = moodColor[ci.mood]
                  return (
                    <motion.div key={ci.id}
                      initial={{ opacity: 0, scale: 0.8, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.28 + i * 0.05, type: 'spring', stiffness: 300, damping: 22 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex flex-col items-center justify-center gap-1.5 flex-shrink-0 rounded-2xl"
                      style={{
                        width: 70, height: 82,
                        background: `rgba(10,10,10,0.6)`,
                        backdropFilter: 'blur(12px)',
                        border: `0.5px solid ${c}25`,
                        scrollSnapAlign: 'start',
                        boxShadow: `0 0 12px ${c}0a`,
                      }}>
                      <span style={{ fontSize: 24, lineHeight: 1 }}>{moodEmoji[ci.mood]}</span>
                      <span className="text-[9px] font-bold tabular-nums" style={{ color: `${c}BB` }}>{ci.score}</span>
                      <span className="text-[8px] text-center px-1 leading-tight" style={{ color: 'rgba(255,255,255,0.16)' }}>
                        {isToday
                          ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : d.toLocaleDateString('pt-BR', { weekday: 'short' })}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CARD 6 — Practice recommendation */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {practice && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.31 }}>
              <Link href={practice.href}
                className="flex items-center gap-4 px-4 py-4 rounded-2xl"
                style={{
                  background: `rgba(10,10,10,0.55)`,
                  backdropFilter: 'blur(20px)',
                  border: `0.5px solid ${practice.color}20`,
                  boxShadow: `0 0 20px ${practice.color}06`,
                }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${practice.color}14`, border: `0.5px solid ${practice.color}28` }}>
                  <span style={{ fontSize: 24 }}>{practice.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: `${practice.color}70` }}>recomendado para voce</span>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: '#fff' }}>{practice.title}</p>
                  <p className="text-[11px] mt-0.5 font-light" style={{ color: 'rgba(255,255,255,0.25)' }}>{practice.sub}</p>
                </div>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                  stroke={`${practice.color}45`} strokeWidth={2.5} strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CARD 7 — Quote */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
            className="rounded-2xl px-5 py-5"
            style={{
              background: 'rgba(10,10,10,0.45)',
              backdropFilter: 'blur(16px)',
              border: '0.5px solid rgba(255,255,255,0.05)',
            }}>
            <p className="text-[9px] uppercase tracking-widest mb-3" style={{ color: '#303030' }}>Insight do dia</p>
            <p className="text-[15px] font-light leading-relaxed italic" style={{ color: 'rgba(255,255,255,0.48)' }}>
              "{quote.text}"
            </p>
            <p className="text-[11px] mt-3 font-medium" style={{ color: '#383838' }}>— {quote.source}</p>
          </motion.div>

        </div>
      </div>

      <BottomNav />
    </div>
  )
}
