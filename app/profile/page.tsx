'use client'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCareStore, CheckIn, scoreColor, moodColor, moodEmoji } from '@/lib/store'
import BottomNav from '@/components/BottomNav'

const PATTERN_NAMES: Record<string, string> = {
  ansiedade: 'Ansiedade',
  tdah: 'TDAH',
  depressao: 'Depressão',
  burnout: 'Burnout',
  estresse: 'Estresse elevado',
}

const PATTERN_COLORS: Record<string, string> = {
  ansiedade: '#7B8FF8',
  tdah: '#00D4A0',
  depressao: '#FF4466',
  burnout: '#FF8C00',
  estresse: '#FFB800',
}

const MED_LABELS: Record<string, string> = {
  acompanhamento: 'Acompanhamento médico',
  sem_acompanhamento: 'Sem acompanhamento',
  automedicacao: 'Automedicação',
  nenhuma: 'Sem medicação',
}

function useStreakAndStats(checkIns: CheckIn[]) {
  return useMemo(() => {
    if (!checkIns.length) return { streak: 0, bestStreak: 0, avgScore: 50, totalDays: 0 }

    const days = new Set(checkIns.map((c) => new Date(c.timestamp).toDateString()))
    let streak = 0
    const d = new Date()
    while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1) }

    // best streak (simple approximation)
    const sorted = [...checkIns].sort((a, b) => a.timestamp - b.timestamp)
    let best = 0, cur = 0
    let prev: string | null = null
    sorted.forEach((c) => {
      const day = new Date(c.timestamp).toDateString()
      if (day === prev) return
      const prevDate = prev ? new Date(prev) : null
      const curDate = new Date(day)
      if (prevDate) {
        const diff = (curDate.getTime() - prevDate.getTime()) / 86400000
        if (diff === 1) cur++
        else cur = 1
      } else cur = 1
      if (cur > best) best = cur
      prev = day
    })

    const avgScore = Math.round(checkIns.reduce((a: number, c: CheckIn) => a + c.score, 0) / checkIns.length)
    return { streak, bestStreak: best, avgScore, totalDays: days.size }
  }, [checkIns])
}

function exportData(data: Record<string, unknown>) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `care-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ProfilePage() {
  const router = useRouter()
  const { userName, userEmail, psychProfile, checkIns, wellnessGoals, clearData, sleepLogs, achievements } = useCareStore()
  const { streak, bestStreak, avgScore, totalDays } = useStreakAndStats(checkIns)

  const firstName = userName ? userName.split(' ')[0] : 'você'

  // Score distribution
  const scoreDist = useMemo(() => {
    if (!checkIns.length) return null
    const last30 = checkIns.slice(0, Math.min(30, checkIns.length))
    const zones = { bem: 0, atencao: 0, crise: 0 }
    last30.forEach((c) => {
      if (c.score >= 60) zones.bem++
      else if (c.score >= 30) zones.atencao++
      else zones.crise++
    })
    const total = last30.length
    return {
      bem: Math.round((zones.bem / total) * 100),
      atencao: Math.round((zones.atencao / total) * 100),
      crise: Math.round((zones.crise / total) * 100),
    }
  }, [checkIns])

  // Most common mood
  const topMood = useMemo(() => {
    if (!checkIns.length) return null
    const freq: Record<string, number> = {}
    checkIns.slice(0, 30).forEach((c) => { freq[c.mood] = (freq[c.mood] ?? 0) + 1 })
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] as keyof typeof moodEmoji | null
  }, [checkIns])

  return (
    <div className="min-h-screen pb-28">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 60%)' }}
      />

      <div className="relative z-10 px-5 pt-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <p className="text-[11px] tracking-[3px] uppercase mb-1" style={{ color: '#505050' }}>Perfil</p>
            <h1 className="font-bold text-white" style={{ fontSize: 28, letterSpacing: -0.5 }}>
              {userName || 'Seu perfil'}
            </h1>
            {userEmail && (
              <p className="text-sm font-light mt-0.5" style={{ color: '#404040' }}>{userEmail}</p>
            )}
          </div>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)' }}
          >
            {firstName[0]?.toUpperCase() ?? '?'}
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { label: 'Streak', value: `${streak}d`, icon: '🔥', color: streak > 0 ? '#FFB800' : '#404040' },
            { label: 'Recorde', value: `${bestStreak}d`, icon: '🏆', color: '#C8C8C8' },
            { label: 'Média', value: String(avgScore), icon: '📊', color: scoreColor(avgScore) },
            { label: 'Dias', value: String(totalDays), icon: '📅', color: '#C8C8C8' },
          ].map(({ label, value, icon, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl p-3 flex flex-col items-center gap-1"
              style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-base">{icon}</span>
              <span className="font-bold text-lg leading-none" style={{ color }}>{value}</span>
              <span className="text-[9px] tracking-wide uppercase" style={{ color: '#404040' }}>{label}</span>
            </motion.div>
          ))}
        </div>

        {/* Score distribution */}
        {scoreDist && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-5 mb-5"
            style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-[10px] tracking-[2px] uppercase mb-4" style={{ color: '#404040' }}>Últimos 30 registros</p>
            <div className="flex gap-0 rounded-full overflow-hidden h-3 mb-3">
              {[
                { pct: scoreDist.bem, color: '#00D4A0' },
                { pct: scoreDist.atencao, color: '#FFB800' },
                { pct: scoreDist.crise, color: '#FF4466' },
              ].map(({ pct, color }, i) => (
                <motion.div
                  key={i}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 + i * 0.1 }}
                  style={{ background: color, height: '100%' }}
                />
              ))}
            </div>
            <div className="flex gap-4">
              {[
                { label: 'Bem', pct: scoreDist.bem, color: '#00D4A0' },
                { label: 'Atenção', pct: scoreDist.atencao, color: '#FFB800' },
                { label: 'Difícil', pct: scoreDist.crise, color: '#FF4466' },
              ].map(({ label, pct, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-[11px]" style={{ color: '#606060' }}>{label}</span>
                  <span className="text-[11px] font-semibold" style={{ color }}>{pct}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top mood */}
        {topMood && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl mb-5"
            style={{
              background: `${moodColor[topMood]}08`,
              border: `0.5px solid ${moodColor[topMood]}25`,
            }}
          >
            <span className="text-3xl">{moodEmoji[topMood]}</span>
            <div>
              <p className="text-[10px] tracking-[2px] uppercase mb-0.5" style={{ color: '#505050' }}>Humor mais frequente</p>
              <p className="font-semibold text-white text-base">
                {topMood === 'otimo' ? 'Ótimo' : topMood === 'bem' ? 'Bem' : topMood === 'ok' ? 'Ok' : topMood === 'mal' ? 'Mal' : 'Em crise'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Neuroemotional profile */}
        {psychProfile && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-5 mb-5"
            style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-[10px] tracking-[2px] uppercase mb-1" style={{ color: '#404040' }}>Perfil neuroemocional</p>
            <p className="text-xs font-light mb-4" style={{ color: '#404040' }}>Detectado no onboarding</p>

            {psychProfile.detectedPatterns.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {psychProfile.detectedPatterns.map((p) => (
                  <span
                    key={p}
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: `${PATTERN_COLORS[p] ?? '#808080'}15`,
                      color: PATTERN_COLORS[p] ?? '#808080',
                      border: `0.5px solid ${PATTERN_COLORS[p] ?? '#808080'}35`,
                    }}
                  >
                    {PATTERN_NAMES[p] ?? p}
                  </span>
                ))}
              </div>
            )}

            {[
              { label: 'Ansiedade',  score: psychProfile.anxietyScore,    color: '#7B8FF8' },
              { label: 'Estresse',   score: psychProfile.stressScore,     color: '#FFB800' },
              { label: 'Depressão',  score: psychProfile.depressionScore, color: '#FF4466' },
              { label: 'Burnout',    score: psychProfile.burnoutScore,    color: '#FF8C00' },
              { label: 'TDAH',       score: psychProfile.tdahScore,       color: '#00D4A0' },
            ].map(({ label, score, color }) => (
              <div key={label} className="flex items-center gap-3 mb-2.5 last:mb-0">
                <span className="text-xs w-20 flex-shrink-0" style={{ color: '#505050' }}>{label}</span>
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                    className="h-full rounded-full"
                    style={{ background: color, boxShadow: `0 0 6px ${color}40` }}
                  />
                </div>
                <span className="text-xs font-bold w-7 text-right" style={{ color }}>{score}</span>
              </div>
            ))}

            <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
              {psychProfile.hasMigraine && (
                <span className="text-[11px] px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,140,0,0.1)', color: '#FF8C00', border: '0.5px solid rgba(255,140,0,0.25)' }}>
                  ⚡ Enxaqueca
                </span>
              )}
              {psychProfile.medicationStatus && (
                <span className="text-[11px] px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#808080', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                  💊 {MED_LABELS[psychProfile.medicationStatus]}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Goals */}
        {wellnessGoals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl p-5 mb-5"
            style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-[10px] tracking-[2px] uppercase mb-3" style={{ color: '#404040' }}>Objetivos</p>
            <div className="flex flex-wrap gap-2">
              {wellnessGoals.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1.5 rounded-full text-xs"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#707070', border: '0.5px solid rgba(255,255,255,0.08)' }}
                >
                  {g}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-2.5"
        >
          <button
            onClick={() => router.push('/insights')}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left"
            style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)' }}
          >
            <span className="text-xl">📊</span>
            <div className="flex-1">
              <p className="font-medium text-sm text-white">Ver análise completa</p>
              <p className="text-[11px]" style={{ color: '#404040' }}>Padrões, tendências e período</p>
            </div>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#404040" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button
            onClick={() => router.push('/practices')}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left"
            style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)' }}
          >
            <span className="text-xl">🗺️</span>
            <div className="flex-1">
              <p className="font-medium text-sm text-white">Ver plano personalizado</p>
              <p className="text-[11px]" style={{ color: '#404040' }}>Práticas e direcionamento do perfil</p>
            </div>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#404040" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button
            onClick={() => exportData({ userName, userEmail, checkIns, sleepLogs, achievements, psychProfile, wellnessGoals, exportedAt: new Date().toISOString() })}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left"
            style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)' }}
          >
            <span className="text-xl">📤</span>
            <div className="flex-1">
              <p className="font-medium text-sm text-white">Exportar meus dados</p>
              <p className="text-[11px]" style={{ color: '#404040' }}>Baixar JSON com todos os registros</p>
            </div>
          </button>

          <button
            onClick={() => {
              if (confirm('Apagar todos os check-ins e histórico de chat?')) clearData()
            }}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left"
            style={{ background: 'rgba(255,68,102,0.05)', border: '0.5px solid rgba(255,68,102,0.15)' }}
          >
            <span className="text-xl">🗑️</span>
            <div className="flex-1">
              <p className="font-medium text-sm" style={{ color: '#FF4466' }}>Apagar histórico</p>
              <p className="text-[11px]" style={{ color: '#404040' }}>Check-ins e conversas</p>
            </div>
          </button>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  )
}
