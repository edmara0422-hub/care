'use client'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCareStore, ACHIEVEMENTS, AchievementDef } from '@/lib/store'

export default function AchievementsPage() {
  const router = useRouter()
  const { achievements, checkIns } = useCareStore()

  const earnedIds = useMemo(() => new Set(achievements.map(a => a.id)), [achievements])
  const earnedCount = earnedIds.size
  const totalCount = ACHIEVEMENTS.length
  const pct = Math.round((earnedCount / totalCount) * 100)

  // Group by category
  const groups = [
    {
      title: 'Consistência',
      icon: '🔥',
      items: ACHIEVEMENTS.filter(a => ['first_checkin', 'streak_3', 'streak_7', 'streak_30', 'consistency'].includes(a.id)),
    },
    {
      title: 'Volume',
      icon: '📊',
      items: ACHIEVEMENTS.filter(a => ['checkins_10', 'checkins_50'].includes(a.id)),
    },
    {
      title: 'Práticas',
      icon: '🌱',
      items: ACHIEVEMENTS.filter(a => ['used_breathing', 'used_sos', 'all_practices'].includes(a.id)),
    },
    {
      title: 'Saúde',
      icon: '💎',
      items: ACHIEVEMENTS.filter(a => ['first_sleep', 'high_score'].includes(a.id)),
    },
  ]

  return (
    <div className="min-h-screen pb-32" style={{ color: '#fff' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-semibold">Conquistas</h1>
          <p className="text-xs" style={{ color: '#666' }}>{earnedCount} de {totalCount} desbloqueadas</p>
        </div>
      </div>

      <div className="px-5 space-y-6">

        {/* Progress ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl p-6 text-center"
          style={{ background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.15)' }}
        >
          <div className="relative w-28 h-28 mx-auto mb-4">
            <svg width={112} height={112} viewBox="0 0 112 112" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={56} cy={56} r={48} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
              <motion.circle
                cx={56} cy={56} r={48}
                fill="none" stroke="#FFB800" strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 48}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - pct / 100) }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{pct}%</span>
              <span className="text-xs" style={{ color: '#666' }}>completo</span>
            </div>
          </div>

          <div className="flex justify-center gap-6">
            <div>
              <p className="text-2xl font-light" style={{ color: '#FFB800' }}>{earnedCount}</p>
              <p className="text-xs" style={{ color: '#555' }}>conquistadas</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div>
              <p className="text-2xl font-light">{totalCount - earnedCount}</p>
              <p className="text-xs" style={{ color: '#555' }}>restantes</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div>
              <p className="text-2xl font-light" style={{ color: '#7B8FF8' }}>{checkIns.length}</p>
              <p className="text-xs" style={{ color: '#555' }}>check-ins</p>
            </div>
          </div>
        </motion.div>

        {/* Achievement groups */}
        {groups.map((group, gi) => (
          <div key={group.title}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{group.icon}</span>
              <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#444' }}>{group.title}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {group.items.map((ach, i) => (
                <AchievementCard
                  key={ach.id}
                  ach={ach}
                  earned={earnedIds.has(ach.id)}
                  unlockedAt={achievements.find(a => a.id === ach.id)?.unlockedAt}
                  index={gi * 10 + i}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Motivation */}
        {earnedCount < totalCount && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-3xl p-5 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className="text-sm" style={{ color: '#555' }}>
              Continue fazendo check-ins diários para desbloquear mais conquistas 🌱
            </p>
          </motion.div>
        )}

      </div>
    </div>
  )
}

function AchievementCard({
  ach,
  earned,
  unlockedAt,
  index,
}: {
  ach: AchievementDef
  earned: boolean
  unlockedAt?: number
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: earned ? 1 : 0.4, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: earned ? `${ach.color}12` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${earned ? `${ach.color}40` : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      {/* Shimmer for earned */}
      {earned && (
        <motion.div
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 160, opacity: [0, 0.3, 0] }}
          transition={{ delay: index * 0.06 + 0.5, duration: 0.7 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
            transform: 'skewX(-20deg)',
          }}
        />
      )}

      <div className="text-2xl mb-2"
        style={{ filter: earned ? 'none' : 'grayscale(1) brightness(0.3)' }}>
        {ach.icon}
      </div>

      <p className="text-sm font-semibold leading-tight mb-1"
        style={{ color: earned ? '#fff' : '#333' }}>
        {ach.title}
      </p>
      <p className="text-[11px] leading-snug"
        style={{ color: earned ? '#666' : '#2a2a2a' }}>
        {ach.desc}
      </p>

      {earned && unlockedAt && (
        <p className="text-[10px] mt-2" style={{ color: ach.color }}>
          {new Date(unlockedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
        </p>
      )}

      {!earned && (
        <>
          <div className="absolute top-3 right-3">
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <p className="text-[10px] mt-2 leading-snug" style={{ color: '#2a2a2a' }}>
            → {ach.hint}
          </p>
        </>
      )}
    </motion.div>
  )
}
