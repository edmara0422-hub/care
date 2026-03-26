'use client'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useCareStore, scoreColor, moodLabel, moodEmoji, moodColor, MoodLevel, CheckIn } from '@/lib/store'
import BottomNav from '@/components/BottomNav'

type Period = 'dia' | 'semana' | 'mes' | 'ano'

// ─── SVG Area Chart ────────────────────────────────────────────────────────
function AreaChart({ bars, color, period }: { bars: { score: number | null; label: string }[]; color: string; period: Period }) {
  const W = 300, H = 90
  const pad = { top: 6, bottom: 6 }

  const pts = bars.map((b, i) => ({
    x: bars.length > 1 ? (i / (bars.length - 1)) * W : W / 2,
    y: b.score !== null
      ? pad.top + (1 - b.score / 100) * (H - pad.top - pad.bottom)
      : H,
    valid: b.score !== null,
    label: b.label,
    score: b.score,
  }))

  // Smooth bezier path
  const segments: string[] = []
  for (let i = 0; i < pts.length; i++) {
    if (!pts[i].valid) continue
    if (segments.length === 0 || !pts[i - 1]?.valid) {
      segments.push(`M ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`)
      continue
    }
    const prev = pts[i - 1]
    const cpx = ((prev.x + pts[i].x) / 2).toFixed(1)
    segments.push(`C ${cpx} ${prev.y.toFixed(1)} ${cpx} ${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`)
  }
  const linePath = segments.join(' ')

  const firstValid = pts.find(p => p.valid)
  const lastValid = [...pts].reverse().find(p => p.valid)
  const areaPath = firstValid && lastValid && linePath
    ? `${linePath} L ${lastValid.x.toFixed(1)} ${H} L ${firstValid.x.toFixed(1)} ${H} Z`
    : ''

  const step = Math.max(1, Math.ceil(bars.length / 6))
  const labelIdxs = new Set(bars.map((_, i) => i).filter(i => i % step === 0 || i === bars.length - 1))
  const gradId = `ag-${color.replace('#', '')}`
  const validPts = pts.filter(p => p.valid)
  const lastPt = validPts[validPts.length - 1]

  return (
    <div>
      <div className="relative pl-6">
      <div className="absolute left-0 top-0 flex flex-col justify-between pointer-events-none" style={{ height: 90 }}>
        {['100', '50', '0'].map(v => (
          <span key={v} className="text-[8px] leading-none" style={{ color: 'rgba(255,255,255,0.2)' }}>{v}</span>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 90, display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid */}
        {[25, 50, 75].map(v => (
          <line key={v}
            x1="0" y1={pad.top + (1 - v / 100) * (H - pad.top - pad.bottom)}
            x2={W} y2={pad.top + (1 - v / 100) * (H - pad.top - pad.bottom)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="4 4" />
        ))}
        {/* Area */}
        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
        {/* Line */}
        {linePath && (
          <motion.path d={linePath} fill="none" stroke={color} strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
        )}
        {/* Data dots */}
        {validPts.map((p, i) => (
          <motion.circle key={i} cx={p.x} cy={p.y} r={2}
            fill={color} fillOpacity={0.6}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.6 + i * 0.04 }} />
        ))}
        {/* Latest glowing dot */}
        {lastPt && (
          <>
            <motion.circle cx={lastPt.x} cy={lastPt.y} r={4}
              fill={color} style={{ filter: `drop-shadow(0 0 5px ${color})` }}
              initial={{ scale: 0 }} animate={{ scale: [1, 1.2, 1] }}
              transition={{ delay: 0.9, duration: 2, repeat: Infinity }} />
          </>
        )}
      </svg>
      </div>
      {/* X labels */}
      <div className="relative pl-6" style={{ height: 16 }}>
        {pts.map((p, i) => labelIdxs.has(i) ? (
          <span key={i}
            className="absolute text-[9px] capitalize transform -translate-x-1/2"
            style={{ left: `${(p.x / W) * 100}%`, color: '#383838', top: 2 }}>
            {p.label}
          </span>
        ) : null)}
      </div>
    </div>
  )
}

// ─── helpers ───────────────────────────────────────────────────────────────

function avg(arr: number[]) {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null
}

function formatShort(d: Date, period: Period) {
  if (period === 'dia')    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (period === 'semana') return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  if (period === 'mes')    return String(d.getDate())
  return d.toLocaleDateString('pt-BR', { month: 'short' })
}

function buildBars(checkIns: CheckIn[], period: Period) {
  const now = new Date()
  if (period === 'dia') {
    // 24 horas de hoje
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return Array.from({ length: 24 }, (_, h) => {
      const from = new Date(today); from.setHours(h)
      const to   = new Date(today); to.setHours(h + 1)
      const cis  = checkIns.filter((c) => c.timestamp >= from.getTime() && c.timestamp < to.getTime())
      const sc   = avg(cis.map((c) => c.score))
      return { label: `${String(h).padStart(2, '0')}h`, score: sc, count: cis.length }
    })
  }
  if (period === 'semana') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - (6 - i)); d.setHours(0, 0, 0, 0)
      const next = new Date(d); next.setDate(d.getDate() + 1)
      const cis  = checkIns.filter((c) => c.timestamp >= d.getTime() && c.timestamp < next.getTime())
      const sc   = avg(cis.map((c) => c.score))
      return { label: formatShort(d, 'semana'), score: sc, count: cis.length }
    })
  }
  if (period === 'mes') {
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), i + 1)
      const next = new Date(d); next.setDate(d.getDate() + 1)
      const cis  = checkIns.filter((c) => c.timestamp >= d.getTime() && c.timestamp < next.getTime())
      const sc   = avg(cis.map((c) => c.score))
      return { label: String(i + 1), score: sc, count: cis.length }
    })
  }
  // ano — 12 meses
  return Array.from({ length: 12 }, (_, i) => {
    const from = new Date(now.getFullYear(), i, 1)
    const to   = new Date(now.getFullYear(), i + 1, 1)
    const cis  = checkIns.filter((c) => c.timestamp >= from.getTime() && c.timestamp < to.getTime())
    const sc   = avg(cis.map((c) => c.score))
    return { label: from.toLocaleDateString('pt-BR', { month: 'short' }), score: sc, count: cis.length }
  })
}

function buildTriggerFreq(checkIns: CheckIn[]) {
  const freq: Record<string, number> = {}
  checkIns.forEach((c) => c.triggers?.forEach((t) => { freq[t] = (freq[t] ?? 0) + 1 }))
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8)
}

function buildMoodDist(checkIns: CheckIn[]) {
  const dist: Record<string, number> = { otimo: 0, bem: 0, ok: 0, mal: 0, crise: 0 }
  checkIns.forEach((c) => { dist[c.mood] = (dist[c.mood] ?? 0) + 1 })
  const total = checkIns.length || 1
  return Object.entries(dist).map(([mood, count]) => ({
    mood: mood as MoodLevel,
    count,
    pct: Math.round((count / total) * 100),
  }))
}

function filterByPeriod(checkIns: CheckIn[], period: Period) {
  const now = new Date()
  const from = new Date()
  if (period === 'dia')    { from.setHours(0, 0, 0, 0) }
  if (period === 'semana') { from.setDate(now.getDate() - 6); from.setHours(0, 0, 0, 0) }
  if (period === 'mes')    { from.setDate(1); from.setHours(0, 0, 0, 0) }
  if (period === 'ano')    { from.setMonth(0, 1); from.setHours(0, 0, 0, 0) }
  return checkIns.filter((c) => c.timestamp >= from.getTime())
}

function filterPrevPeriod(checkIns: CheckIn[], period: Period) {
  const now = new Date()
  const from = new Date(), to = new Date()
  if (period === 'dia') {
    to.setHours(0, 0, 0, 0)
    from.setTime(to.getTime() - 24 * 60 * 60 * 1000)
  } else if (period === 'semana') {
    to.setDate(now.getDate() - 6); to.setHours(0, 0, 0, 0)
    from.setTime(to.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (period === 'mes') {
    to.setDate(1); to.setHours(0, 0, 0, 0)
    from.setFullYear(to.getFullYear(), to.getMonth() - 1, 1); from.setHours(0, 0, 0, 0)
  } else {
    to.setMonth(0, 1); to.setHours(0, 0, 0, 0)
    from.setFullYear(to.getFullYear() - 1, 0, 1); from.setHours(0, 0, 0, 0)
  }
  return checkIns.filter((c) => c.timestamp >= from.getTime() && c.timestamp < to.getTime())
}

function trendLabel(bars: { score: number | null }[]) {
  const scored = bars.filter((b) => b.score !== null).map((b) => b.score as number)
  if (scored.length < 2) return null
  const first = scored.slice(0, Math.ceil(scored.length / 2))
  const last  = scored.slice(Math.floor(scored.length / 2))
  const diff  = (avg(last) ?? 0) - (avg(first) ?? 0)
  if (diff > 5)  return { label: '↑ Em melhora', color: '#00D4A0' }
  if (diff < -5) return { label: '↓ Em queda', color: '#FF4466' }
  return { label: '→ Estável', color: '#C8C8C8' }
}

const PERIOD_LABELS: Record<Period, string> = { dia: 'Hoje', semana: 'Semana', mes: 'Mês', ano: 'Ano' }

const BOOK_INSIGHTS = [
  { quote: 'Você não pode controlar o vento, mas pode ajustar as velas.', book: 'Enquiridion', author: 'Epicteto', color: '#7B8FF8' },
  { quote: 'O corpo guarda o placar muito antes de a mente perceber.', book: 'O Corpo Guarda o Placar', author: 'Van der Kolk', color: '#00D4A0' },
  { quote: 'Aceitar não é desistir — é parar de lutar contra a realidade.', book: 'A Armadilha da Felicidade', author: 'Russ Harris', color: '#FFB800' },
  { quote: 'Presença é a única coisa que o medo não consegue habitar.', book: 'O Poder do Agora', author: 'Eckhart Tolle', color: '#3A86FF' },
  { quote: 'Quem tem um porquê suporta quase qualquer como.', book: 'Em Busca de Sentido', author: 'Viktor Frankl', color: '#FF8C00' },
  { quote: 'Vergonha precisa de segredo para sobreviver. Nomeá-la a dissipa.', book: 'A Coragem de Ser Imperfeito', author: 'Brené Brown', color: '#FF6482' },
  { quote: 'Talento é ponto de partida. Esforço é o que conta duas vezes.', book: 'Mindset', author: 'Carol Dweck', color: '#00D4A0' },
  { quote: 'Trauma não está no evento — está no sistema nervoso que não conseguiu processar.', book: 'O Despertar do Tigre', author: 'Peter Levine', color: '#7B8FF8' },
]

// ─── component ─────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const { checkIns, psychProfile } = useCareStore()
  const [period, setPeriod] = useState<Period>('semana')

  const filtered     = useMemo(() => filterByPeriod(checkIns, period), [checkIns, period])
  const prevFiltered = useMemo(() => filterPrevPeriod(checkIns, period), [checkIns, period])
  const bars         = useMemo(() => buildBars(checkIns, period), [checkIns, period])
  const triggers     = useMemo(() => buildTriggerFreq(filtered), [filtered])
  const moodDist     = useMemo(() => buildMoodDist(filtered), [filtered])
  const avgScore     = useMemo(() => avg(filtered.map((c) => c.score)) ?? 50, [filtered])
  const prevAvgScore = useMemo(() => avg(prevFiltered.map((c) => c.score)), [prevFiltered])
  const delta        = useMemo(() => prevAvgScore !== null ? avgScore - prevAvgScore : null, [avgScore, prevAvgScore])
  const trend        = useMemo(() => trendLabel(bars), [bars])
  const total        = checkIns.length

  // Day-of-week breakdown
  const dowData = useMemo(() => {
    const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const totals = Array(7).fill(0), counts = Array(7).fill(0)
    filtered.forEach(c => { const d = new Date(c.timestamp).getDay(); totals[d] += c.score; counts[d]++ })
    return DOW.map((label, i) => ({ label, score: counts[i] ? Math.round(totals[i]/counts[i]) : null, count: counts[i] }))
  }, [filtered])

  if (checkIns.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-8 pb-28">
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,212,160,0.05) 0%, transparent 70%)' }}
        />
        <span className="text-5xl relative z-10">📊</span>
        <h2 className="font-bold text-2xl text-white tracking-tight relative z-10">Sem dados ainda</h2>
        <p className="text-center text-sm font-light leading-relaxed relative z-10" style={{ color: '#606060' }}>
          Faça seu primeiro check-in para ver seus padrões emocionais aqui.
        </p>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-28 overflow-x-hidden">
      {/* Ambient */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-all duration-700"
        style={{ background: `radial-gradient(ellipse 60% 35% at 50% 0%, ${scoreColor(avgScore)}07 0%, transparent 65%)` }}
      />

      <div className="relative z-10 px-5 pt-14">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-[11px] tracking-[3px] uppercase mb-1" style={{ color: '#505050' }}>Análise</p>
          <h1 className="font-bold text-white mb-6" style={{ fontSize: 28, letterSpacing: -0.5 }}>Seus padrões</h1>
        </motion.div>

        {/* Period selector */}
        <div className="flex gap-2 mb-6">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="flex-1 py-2 rounded-full text-xs font-semibold tracking-wide transition-all"
              style={{
                background: period === p ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                border: period === p ? '0.5px solid rgba(255,255,255,0.25)' : '0.5px solid rgba(255,255,255,0.07)',
                color: period === p ? '#fff' : '#505050',
              }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {/* Média com comparativo */}
              <div className="rounded-2xl p-4 flex flex-col gap-1 col-span-1"
                style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-end gap-1.5">
                  <span className="font-bold text-2xl" style={{ color: scoreColor(avgScore) }}>{avgScore}</span>
                  {delta !== null && (
                    <span className="text-[11px] font-semibold mb-0.5"
                      style={{ color: delta > 0 ? '#00D4A0' : delta < 0 ? '#FF4466' : '#555' }}>
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  )}
                </div>
                <span className="text-[11px]" style={{ color: '#505050' }}>
                  Média{delta !== null ? ` vs anterior` : ''}
                </span>
              </div>
              {[
                { label: 'Registros', value: String(filtered.length), color: '#C8C8C8' },
                { label: 'Total geral', value: String(total), color: '#505050' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-2xl p-4 flex flex-col gap-1"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
                  <span className="font-bold text-2xl" style={{ color }}>{value}</span>
                  <span className="text-[11px]" style={{ color: '#505050' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Trend badge */}
            {trend && (
              <div className="flex items-center gap-2 mb-5">
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: `${trend.color}15`, color: trend.color, border: `0.5px solid ${trend.color}30` }}
                >
                  {trend.label}
                </div>
                <span className="text-[11px]" style={{ color: '#404040' }}>
                  {period === 'dia' ? 'nas últimas horas' : period === 'semana' ? 'nesta semana' : period === 'mes' ? 'neste mês' : 'neste ano'}
                </span>
              </div>
            )}

            {/* Area chart */}
            <div className="rounded-2xl px-4 pt-4 pb-2 mb-5"
              style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] tracking-[2px] uppercase mb-3" style={{ color: '#404040' }}>
                {PERIOD_LABELS[period]}
              </p>
              <AreaChart bars={bars} color={scoreColor(avgScore)} period={period} />
            </div>

            {/* Mood distribution */}
            {filtered.length > 0 && (
              <div
                className="rounded-2xl p-5 mb-5"
                style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-[10px] tracking-[2px] uppercase mb-4" style={{ color: '#404040' }}>Distribuição de humor</p>
                <div className="flex flex-col gap-2.5">
                  {moodDist.filter((m) => m.count > 0).map((m) => (
                    <div key={m.mood} className="flex items-center gap-3">
                      <span className="text-base w-6 text-center">{moodEmoji[m.mood]}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-white">{moodLabel[m.mood]}</span>
                          <span className="text-[11px]" style={{ color: moodColor[m.mood] }}>{m.pct}%</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${m.pct}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                            className="h-full rounded-full"
                            style={{ background: moodColor[m.mood], boxShadow: `0 0 8px ${moodColor[m.mood]}60` }}
                          />
                        </div>
                      </div>
                      <span className="text-[11px] w-5 text-right" style={{ color: '#404040' }}>{m.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trigger frequency */}
            {triggers.length > 0 && (
              <div
                className="rounded-2xl p-5 mb-5"
                style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-[10px] tracking-[2px] uppercase mb-4" style={{ color: '#404040' }}>Gatilhos frequentes</p>
                <div className="flex flex-col gap-2">
                  {triggers.map(([t, count], i) => {
                    const maxCount = triggers[0][1]
                    const pct = Math.round((count / maxCount) * 100)
                    return (
                      <div key={t} className="flex items-center gap-3">
                        <span className="text-[11px] w-4 text-right" style={{ color: '#404040' }}>{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-white">{t}</span>
                            <span className="text-[11px]" style={{ color: '#505050' }}>{count}x</span>
                          </div>
                          <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 * i }}
                              className="h-full rounded-full"
                              style={{ background: 'rgba(255,140,0,0.7)' }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Psychprofile scores */}
            {psychProfile && (
              <div
                className="rounded-2xl p-5 mb-5"
                style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-[10px] tracking-[2px] uppercase mb-4" style={{ color: '#404040' }}>Perfil neuroemocional</p>
                {[
                  { label: 'Ansiedade',  score: psychProfile.anxietyScore,    color: '#7B8FF8', tip: psychProfile.anxietyScore > 55 ? 'Tente a respiração 4-7-8 ao sentir tensão' : psychProfile.anxietyScore > 35 ? 'Observe seus gatilhos de preocupação' : 'Nível saudável' },
                  { label: 'Estresse',   score: psychProfile.stressScore,     color: '#FFB800', tip: psychProfile.stressScore > 55 ? 'Considere pausas regulares e limites claros' : psychProfile.stressScore > 35 ? 'Monitore sua carga — sinais leves' : 'Sob controle' },
                  { label: 'Depressão',  score: psychProfile.depressionScore, color: '#FF4466', tip: psychProfile.depressionScore > 55 ? 'Busque apoio profissional — você merece cuidado' : psychProfile.depressionScore > 35 ? 'Ativação comportamental pode ajudar' : 'Humor estável' },
                  { label: 'Burnout',    score: psychProfile.burnoutScore,    color: '#FF8C00', tip: psychProfile.burnoutScore > 55 ? 'Alerta: priorize descanso e recuperação' : psychProfile.burnoutScore > 35 ? 'Cuide do equilíbrio trabalho-descanso' : 'Energia preservada' },
                  { label: 'TDAH',       score: psychProfile.tdahScore,       color: '#00D4A0', tip: psychProfile.tdahScore > 55 ? 'Oscilação alta — técnicas de foco podem ajudar' : psychProfile.tdahScore > 35 ? 'Alguma variação no foco' : 'Foco consistente' },
                ].map(({ label, score, color, tip }) => (
                  <div key={label} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs w-20 flex-shrink-0" style={{ color: '#606060' }}>{label}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full"
                          style={{ background: color, boxShadow: `0 0 6px ${color}50` }}
                        />
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{score}</span>
                    </div>
                    <p className="text-[11px] ml-[calc(80px+12px)]" style={{ color: `${color}90` }}>{tip}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Detected patterns with context */}
            {psychProfile && psychProfile.detectedPatterns.length > 0 && (
              <div className="rounded-2xl p-5 mb-5"
                style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] tracking-[2px] uppercase mb-4" style={{ color: '#404040' }}>O que seus dados mostram</p>
                <div className="flex flex-col gap-2.5">
                  {psychProfile.detectedPatterns.map((pattern, i) => {
                    const isPositive = pattern.includes('melhora') || pattern.includes('equilibrado')
                    const isWarning = pattern.includes('elevad') || pattern.includes('significativ') || pattern.includes('alto') || pattern.includes('crônico')
                    return (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl"
                        style={{
                          background: isPositive ? 'rgba(0,212,160,0.06)' : isWarning ? 'rgba(255,68,102,0.06)' : 'rgba(255,255,255,0.03)',
                          border: isPositive ? '0.5px solid rgba(0,212,160,0.15)' : isWarning ? '0.5px solid rgba(255,68,102,0.15)' : '0.5px solid rgba(255,255,255,0.06)',
                        }}>
                        <span className="text-sm mt-0.5">{isPositive ? '✦' : isWarning ? '⚠' : '•'}</span>
                        <p className="text-sm font-medium" style={{
                          color: isPositive ? '#00D4A0' : isWarning ? '#FF4466' : '#909090'
                        }}>{pattern}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Day-of-week breakdown */}
            {filtered.length >= 3 && (
              <div className="rounded-2xl p-5 mb-5"
                style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] tracking-[2px] uppercase mb-4" style={{ color: '#404040' }}>Score por dia da semana</p>
                <div className="flex items-end gap-1 h-16">
                  {dowData.map((d, i) => {
                    const h = d.score ? Math.max(12, (d.score/100)*100) : 8
                    const c = d.score ? scoreColor(d.score) : '#1a1a1a'
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <motion.div className="w-full rounded-sm"
                          style={{ background: c, opacity: d.score ? 0.85 : 0.2 }}
                          initial={{ height: 0 }} animate={{ height: `${h}%` }}
                          transition={{ delay: i*0.05, duration: 0.5 }} />
                        <span className="text-[9px]" style={{ color: d.score ? '#555' : '#2a2a2a' }}>{d.label}</span>
                      </div>
                    )
                  })}
                </div>
                {(() => {
                  const valid = dowData.filter(d => d.score !== null)
                  if (valid.length < 2) return null
                  const best = valid.reduce((a, b) => (b.score! > a.score! ? b : a))
                  const worst = valid.reduce((a, b) => (b.score! < a.score! ? b : a))
                  if (best.label === worst.label) return null
                  return (
                    <p className="text-xs mt-3" style={{ color: '#444' }}>
                      Melhor dia: <span style={{ color: '#00D4A0' }}>{best.label} ({best.score})</span>
                      {' · '}Pior dia: <span style={{ color: '#FF4466' }}>{worst.label} ({worst.score})</span>
                    </p>
                  )
                })()}
              </div>
            )}

            {/* Weekly insight note */}
            {period === 'semana' && filtered.length > 0 && (
              <div className="rounded-2xl p-4 mb-5"
                style={{ background: 'rgba(0,212,160,0.04)', border: '0.5px solid rgba(0,212,160,0.15)' }}>
                <p className="text-[11px] tracking-wide mb-1.5" style={{ color: '#00D4A0' }}>💬 Para sua próxima sessão</p>
                <p className="text-sm font-light leading-relaxed" style={{ color: '#707070' }}>
                  Mostre esses dados para seu psicólogo ou terapeuta. O CARE registra o que o cérebro sob estresse esquece.
                </p>
              </div>
            )}

            {/* Book insights */}
            <div className="mb-5">
              <p className="text-[10px] tracking-[2px] uppercase mb-3" style={{ color: '#404040' }}>Aprendizados de grandes livros</p>
              <div className="space-y-2">
                {BOOK_INSIGHTS.slice(0, 4).map((b, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="rounded-2xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${b.color}18` }}>
                    <p className="text-xs font-light leading-relaxed italic mb-1" style={{ color: '#888' }}>"{b.quote}"</p>
                    <p className="text-[10px]" style={{ color: b.color }}>— {b.author} · {b.book}</p>
                  </motion.div>
                ))}
                <Link href="/practices?tab=sabedoria"
                  className="block text-center py-2 rounded-xl text-xs"
                  style={{ color: '#444' }}>
                  ver todos os livros na aba Práticas →
                </Link>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  )
}
