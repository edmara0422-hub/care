'use client'
import { useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCareStore, moodLabel, moodColor, MoodLevel } from '@/lib/store'


function usePeriod(days: number) {
  const { checkIns, sleepLogs, achievements, wellnessGoals, psychProfile } = useCareStore()
  const cutoff = Date.now() - days * 86_400_000

  return useMemo(() => {
    const filtered = checkIns.filter(c => c.timestamp >= cutoff)
    const total = filtered.length
    if (total === 0) return null

    const avgScore = Math.round(filtered.reduce((s, c) => s + c.score, 0) / total)

    // Mood distribution
    const moodCount: Partial<Record<MoodLevel, number>> = {}
    filtered.forEach(c => { moodCount[c.mood] = (moodCount[c.mood] ?? 0) + 1 })

    // Score trend (split in half)
    const half = Math.floor(filtered.length / 2)
    const recent = filtered.slice(0, half)
    const older = filtered.slice(half)
    const recentAvg = recent.length ? Math.round(recent.reduce((s,c)=>s+c.score,0)/recent.length) : avgScore
    const olderAvg = older.length ? Math.round(older.reduce((s,c)=>s+c.score,0)/older.length) : avgScore
    const trend: 'improving' | 'declining' | 'stable' =
      recentAvg - olderAvg > 5 ? 'improving' : olderAvg - recentAvg > 5 ? 'declining' : 'stable'

    // Day of week analysis
    const dowTotals: number[] = Array(7).fill(0)
    const dowCounts: number[] = Array(7).fill(0)
    filtered.forEach(c => {
      const d = new Date(c.timestamp).getDay()
      dowTotals[d] += c.score
      dowCounts[d]++
    })
    const dowAvg = dowTotals.map((t, i) => dowCounts[i] ? Math.round(t / dowCounts[i]) : null)

    // Worst/best day
    const validDow = dowAvg.map((v, i) => ({ v, i })).filter(x => x.v !== null)
    const bestDow = validDow.reduce((a, b) => (b.v! > a.v! ? b : a), validDow[0])
    const worstDow = validDow.reduce((a, b) => (b.v! < a.v! ? b : a), validDow[0])

    // Top triggers
    const triggerCount: Record<string, number> = {}
    filtered.forEach(c => c.triggers?.forEach(t => { triggerCount[t] = (triggerCount[t] ?? 0) + 1 }))
    const topTriggers = Object.entries(triggerCount).sort((a,b)=>b[1]-a[1]).slice(0,5)

    // Sleep stats
    const periodSleep = sleepLogs.filter(l => new Date(l.date).getTime() >= cutoff)
    const avgSleepHours = periodSleep.length
      ? (periodSleep.reduce((s,l)=>s+l.hours,0)/periodSleep.length).toFixed(1)
      : null
    const avgSleepQuality = periodSleep.length
      ? (periodSleep.reduce((s,l)=>s+l.quality,0)/periodSleep.length).toFixed(1)
      : null

    // Streak
    const days2 = new Set(filtered.map(c => new Date(c.timestamp).toDateString()))
    let streak = 0
    const d = new Date()
    while (days2.has(d.toDateString())) { streak++; d.setDate(d.getDate()-1) }

    // Low days (score < 30)
    const lowDays = filtered.filter(c => c.score < 30).length
    const crisisDays = filtered.filter(c => c.mood === 'crise').length

    return {
      total, avgScore, moodCount, trend, recentAvg, olderAvg,
      dowAvg, bestDow, worstDow, topTriggers,
      avgSleepHours, avgSleepQuality, streak, lowDays, crisisDays,
      wellnessGoals, psychProfile, achievements: achievements.length,
    }
  }, [checkIns, sleepLogs, achievements, wellnessGoals, psychProfile, cutoff])
}

const DOW_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function ReportPage() {
  const router = useRouter()
  const store = useCareStore()
  const reportRef = useRef<HTMLDivElement>(null)

  const data7 = usePeriod(7)
  const data30 = usePeriod(30)

  const generated = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen pb-32" style={{ color: '#fff' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 no-print">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold">Relatório</h1>
            <p className="text-xs" style={{ color: '#666' }}>Para compartilhar com seu terapeuta</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => window.print()}
          className="no-print px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
          style={{ background: 'rgba(123,143,248,0.15)', color: '#7B8FF8' }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" /></svg>
          Salvar PDF
        </motion.button>
      </div>

      <div ref={reportRef} className="px-5 space-y-5">

        {/* Report header card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6"
          style={{ background: 'linear-gradient(135deg, rgba(123,143,248,0.12), rgba(0,212,160,0.06))', border: '1px solid rgba(123,143,248,0.2)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(123,143,248,0.2)' }}>📋</div>
            <div>
              <p className="font-semibold">Relatório de Bem-estar</p>
              <p className="text-xs" style={{ color: '#666' }}>CARE • {generated}</p>
            </div>
          </div>
          {store.userName && (
            <p className="text-sm" style={{ color: '#888' }}>Paciente: <span style={{ color: '#fff' }}>{store.userName}</span></p>
          )}
          <p className="text-xs mt-2" style={{ color: '#555' }}>
            Dados coletados via auto-registro diário. Score de 0–100 baseado em check-ins emocionais.
          </p>
        </motion.div>

        {/* 7-day summary */}
        {data7 ? (
          <ReportSection title="Últimos 7 dias" color="#00D4A0" data={data7} period={7} />
        ) : (
          <EmptySection label="Últimos 7 dias — sem dados" />
        )}

        {/* 30-day summary */}
        {data30 ? (
          <ReportSection title="Últimos 30 dias" color="#7B8FF8" data={data30} period={30} />
        ) : (
          <EmptySection label="Últimos 30 dias — sem dados" />
        )}

        {/* Profile */}
        {store.psychProfile && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#aaa' }}>Perfil neuroemocional</h2>
            <div className="space-y-3">
              {[
                { label: 'Ansiedade', value: store.psychProfile.anxietyScore,    color: '#FF8C00' },
                { label: 'Depressão', value: store.psychProfile.depressionScore, color: '#FF4466' },
                { label: 'TDAH',      value: store.psychProfile.tdahScore,       color: '#7B8FF8' },
                { label: 'Burnout',   value: store.psychProfile.burnoutScore,    color: '#FF6B35' },
                { label: 'Estresse',  value: store.psychProfile.stressScore,     color: '#FFB800' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: '#888' }}>{item.label}</span>
                    <span style={{ color: item.color }}>{item.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: item.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
              {store.psychProfile.hasMigraine && (
                <p className="text-xs mt-2" style={{ color: '#FF4466' }}>⚡ Relatou enxaqueca</p>
              )}
              {store.psychProfile.medicationStatus && (
                <p className="text-xs" style={{ color: '#888' }}>
                  Medicação: {store.psychProfile.medicationStatus.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Achievements */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-5"
          style={{ background: 'rgba(255,184,0,0.04)', border: '1px solid rgba(255,184,0,0.12)' }}
        >
          <h2 className="text-sm font-semibold mb-2" style={{ color: '#aaa' }}>Engajamento</h2>
          <p className="text-sm" style={{ color: '#FFB800' }}>
            🏆 {store.achievements.length} conquistas desbloqueadas
          </p>
          <p className="text-xs mt-1" style={{ color: '#555' }}>
            Total de {store.checkIns.length} check-ins realizados desde o início
          </p>
        </motion.div>

        {/* Notes for therapist */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <h2 className="text-sm font-semibold mb-2" style={{ color: '#aaa' }}>Nota metodológica</h2>
          <p className="text-xs leading-relaxed" style={{ color: '#555' }}>
            Este relatório foi gerado automaticamente pelo aplicativo CARE com base em auto-registros do usuário.
            Os dados são armazenados localmente no dispositivo e não passam por servidores externos.
            As pontuações refletem percepções subjetivas e devem ser interpretadas em conjunto com avaliação clínica.
          </p>
        </motion.div>

      </div>
    </div>
  )
}

function ReportSection({ title, color, data, period }: {
  title: string
  color: string
  data: NonNullable<ReturnType<typeof usePeriod>>
  period: number
}) {
  const trendLabel = data.trend === 'improving' ? '↑ melhorando' : data.trend === 'declining' ? '↓ em queda' : '→ estável'
  const trendColor = data.trend === 'improving' ? '#00D4A0' : data.trend === 'declining' ? '#FF4466' : '#FFB800'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-5 space-y-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}20` }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color }}>{title}</h2>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${trendColor}18`, color: trendColor }}>
          {trendLabel}
        </span>
      </div>

      {/* Key stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCell label="Score médio" value={data.avgScore.toString()} unit="/100" color={color} />
        <StatCell label="Check-ins" value={data.total.toString()} unit={`/${period}d`} color={color} />
        <StatCell label="Streak atual" value={data.streak.toString()} unit=" dias" color={color} />
      </div>

      {/* Score chart (simple bars by day of week) */}
      <div>
        <p className="text-xs mb-2" style={{ color: '#555' }}>Score por dia da semana</p>
        <div className="flex items-end gap-1 h-14">
          {data.dowAvg.map((v, i) => {
            const h = v ? Math.round((v / 100) * 100) : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className="w-full rounded-sm"
                  style={{ background: v ? color : 'rgba(255,255,255,0.05)', opacity: v ? 0.8 : 1 }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(h, 3)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.04 }}
                />
                <span className="text-[9px]" style={{ color: '#444' }}>{DOW_LABELS[i]}</span>
              </div>
            )
          })}
        </div>
        {data.bestDow && data.worstDow && data.bestDow.i !== data.worstDow.i && (
          <p className="text-xs mt-2" style={{ color: '#555' }}>
            Melhor: <span style={{ color: '#00D4A0' }}>{DOW_LABELS[data.bestDow.i]} ({data.bestDow.v})</span>
            {' · '}
            Pior: <span style={{ color: '#FF4466' }}>{DOW_LABELS[data.worstDow.i]} ({data.worstDow.v})</span>
          </p>
        )}
      </div>

      {/* Mood distribution */}
      <div>
        <p className="text-xs mb-2" style={{ color: '#555' }}>Distribuição de humor</p>
        <div className="flex gap-1 h-2 rounded-full overflow-hidden">
          {(Object.entries(data.moodCount) as [MoodLevel, number][])
            .sort((a, b) => b[1] - a[1])
            .map(([mood, count]) => (
              <motion.div
                key={mood}
                style={{ background: moodColor[mood] }}
                initial={{ flex: 0 }}
                animate={{ flex: count }}
                transition={{ duration: 0.8 }}
                title={`${moodLabel[mood]}: ${count}`}
              />
            ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {(Object.entries(data.moodCount) as [MoodLevel, number][]).map(([mood, count]) => (
            <span key={mood} className="text-[11px]" style={{ color: moodColor[mood] }}>
              {moodLabel[mood]}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Sleep */}
      {data.avgSleepHours && (
        <div className="flex gap-4 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div>
            <p className="text-xs" style={{ color: '#555' }}>Sono médio</p>
            <p className="text-lg font-light" style={{ color: '#3A86FF' }}>{data.avgSleepHours}h</p>
          </div>
          {data.avgSleepQuality && (
            <div>
              <p className="text-xs" style={{ color: '#555' }}>Qualidade</p>
              <p className="text-lg font-light" style={{ color: '#3A86FF' }}>{data.avgSleepQuality}/5</p>
            </div>
          )}
        </div>
      )}

      {/* Alerts */}
      {(data.lowDays > 0 || data.crisisDays > 0) && (
        <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.2)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#FF4466' }}>Pontos de atenção</p>
          {data.lowDays > 0 && <p className="text-xs" style={{ color: '#888' }}>• {data.lowDays} dia(s) com score abaixo de 30</p>}
          {data.crisisDays > 0 && <p className="text-xs" style={{ color: '#888' }}>• {data.crisisDays} registro(s) em estado de crise</p>}
        </div>
      )}

      {/* Top triggers */}
      {data.topTriggers.length > 0 && (
        <div>
          <p className="text-xs mb-2" style={{ color: '#555' }}>Principais gatilhos relatados</p>
          <div className="flex flex-wrap gap-2">
            {data.topTriggers.map(([trigger, count]) => (
              <span key={trigger} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,140,0,0.12)', color: '#FF8C00' }}>
                {trigger} ({count}×)
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function StatCell({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="text-center py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <p className="text-xl font-light" style={{ color }}>{value}<span className="text-xs">{unit}</span></p>
      <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>{label}</p>
    </div>
  )
}

function EmptySection({ label }: { label: string }) {
  return (
    <div className="rounded-3xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <p className="text-sm" style={{ color: '#444' }}>{label}</p>
    </div>
  )
}

