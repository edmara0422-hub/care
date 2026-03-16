'use client'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCareStore, ACHIEVEMENTS } from '@/lib/store'

export default function AchievementToast() {
  const lastUnlockedAchievement = useCareStore(s => s.lastUnlockedAchievement)
  const clearLastUnlockedAchievement = useCareStore(s => s.clearLastUnlockedAchievement)

  useEffect(() => {
    if (!lastUnlockedAchievement) return
    const t = setTimeout(clearLastUnlockedAchievement, 4000)
    return () => clearTimeout(t)
  }, [lastUnlockedAchievement, clearLastUnlockedAchievement])

  const def = lastUnlockedAchievement ? ACHIEVEMENTS.find(a => a.id === lastUnlockedAchievement) : null

  return (
    <AnimatePresence>
      {def && (
        <motion.div
          key={def.id}
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-24 left-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            transform: 'translateX(-50%)',
            background: `${def.color}15`,
            border: `0.5px solid ${def.color}40`,
            backdropFilter: 'blur(12px)',
            minWidth: 240,
          }}
          onClick={clearLastUnlockedAchievement}
        >
          <span className="text-2xl">{def.icon}</span>
          <div>
            <p className="text-[10px] tracking-[2px] uppercase" style={{ color: def.color }}>Conquista desbloqueada</p>
            <p className="font-semibold text-sm text-white">{def.title}</p>
            <p className="text-[11px] font-light" style={{ color: '#707070' }}>{def.desc}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
