'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BottomNav from '@/components/BottomNav'
import { useRouter } from 'next/navigation'
import { useCareStore } from '@/lib/store'

interface Technique {
  id: string
  name: string
  subtitle: string
  description: string
  indication: string
  cycles: number
  color: string
  icon: string
  phases: { label: string; duration: number; action: 'expand' | 'hold' | 'contract' }[]
}

const TECHNIQUES: Technique[] = [
  {
    id: '478', name: '4 · 7 · 8', subtitle: 'Ansiedade', icon: '🌊',
    description: 'Ativa o sistema parassimpático em menos de 90 segundos. Técnica do Dr. Andrew Weil.',
    indication: 'Ansiedade · Insônia · Ataques de pânico', color: '#00D4A0', cycles: 4,
    phases: [
      { label: 'Inspire', duration: 4, action: 'expand' },
      { label: 'Segure', duration: 7, action: 'hold' },
      { label: 'Expire', duration: 8, action: 'contract' },
    ],
  },
  {
    id: 'box', name: 'Box Breathing', subtitle: 'Foco', icon: '🎯',
    description: 'Usada por militares e atletas para controle de estresse agudo e clareza mental.',
    indication: 'Estresse · Foco · Antes de reuniões', color: '#7B8FF8', cycles: 4,
    phases: [
      { label: 'Inspire', duration: 4, action: 'expand' },
      { label: 'Segure', duration: 4, action: 'hold' },
      { label: 'Expire', duration: 4, action: 'contract' },
      { label: 'Segure', duration: 4, action: 'hold' },
    ],
  },
  {
    id: 'coherent', name: 'Coerência Cardíaca', subtitle: 'Equilíbrio', icon: '💚',
    description: 'Sincroniza o ritmo cardíaco com a respiração. Estudos mostram redução de 23% no cortisol.',
    indication: 'Burnout · Regulação emocional · Manhã', color: '#FFB800', cycles: 5,
    phases: [
      { label: 'Inspire', duration: 5, action: 'expand' },
      { label: 'Expire', duration: 5, action: 'contract' },
    ],
  },
  {
    id: 'diaphragm', name: 'Diafragmática', subtitle: 'Base', icon: '🌿',
    description: 'A base de toda meditação. Alivia tensão muscular e enxaqueca por sobrecarga.',
    indication: 'Iniciantes · Enxaqueca · Tensão', color: '#FF8C6B', cycles: 6,
    phases: [
      { label: 'Inspire', duration: 4, action: 'expand' },
      { label: 'Pausa', duration: 2, action: 'hold' },
      { label: 'Expire lento', duration: 6, action: 'contract' },
    ],
  },
  {
    id: 'tdah', name: 'Reset Neural', subtitle: 'TDAH', icon: '⚡',
    description: 'Curta e repetida. Reinicia o circuito atencional e reduz a inquietação mental.',
    indication: 'TDAH · Inquietação · Impulsividade', color: '#E040FB', cycles: 8,
    phases: [
      { label: 'Inspire', duration: 3, action: 'expand' },
      { label: 'Expire', duration: 3, action: 'contract' },
    ],
  },
]

export default function BreathePage() {
  const router = useRouter()
  const { completePractice, unlockAchievement, addBreatheSession, breatheSessions } = useCareStore()
  const [tech, setTech] = useState<Technique>(TECHNIQUES[0])
  const [running, setRunning] = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const trackedRef = useRef(false)

  useEffect(() => {
    if (completed && !trackedRef.current) {
      trackedRef.current = true
      completePractice('breathe')
      unlockAchievement('used_breathing')
      addBreatheSession({
        techniqueId: tech.id,
        techniqueName: tech.name,
        durationMin: Math.ceil(tech.phases.reduce((a, p) => a + p.duration, 0) * tech.cycles / 60),
      })
    }
    if (!completed) trackedRef.current = false
  }, [completed, completePractice, unlockAchievement, addBreatheSession, tech])

  const phase = tech.phases[phaseIdx]
  const circleTarget = phase?.action === 'expand' ? 1 : phase?.action === 'contract' ? 0.55 : undefined

  const start = () => {
    setRunning(true); setPhaseIdx(0); setCycle(0); setCompleted(false)
    setTimeLeft(tech.phases[0].duration)
  }
  const stop = () => {
    setRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)
    setPhaseIdx(0); setCycle(0); setTimeLeft(0); setCompleted(false)
  }

  useEffect(() => {
    if (!running) return
    setTimeLeft(phase.duration)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          const nextIdx = (phaseIdx + 1) % tech.phases.length
          const newCycle = nextIdx === 0 ? cycle + 1 : cycle
          if (nextIdx === 0 && newCycle >= tech.cycles) {
            setRunning(false); setCompleted(true); return 0
          }
          if (nextIdx === 0) setCycle(newCycle)
          setPhaseIdx(nextIdx)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running, phaseIdx, cycle, tech])

  const totalTime = tech.phases.reduce((a, p) => a + p.duration, 0) * tech.cycles
  const totalMin  = Math.ceil(totalTime / 60)
  const progress  = cycle / tech.cycles

  return (
    <div className="min-h-screen pb-28 overflow-hidden">
      {/* Ambient radial glow */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        animate={{ opacity: running ? 1 : 0.5 }}
        transition={{ duration: 2 }}
        style={{ background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${tech.color}08 0%, transparent 70%)` }}
      />
      {/* Secondary outer ring glow */}
      {running && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-0"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: phase?.duration ?? 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: `radial-gradient(ellipse 40% 40% at 50% 45%, ${tech.color}12 0%, transparent 60%)` }}
        />
      )}

      <div className="relative z-10 flex flex-col min-h-screen px-5 pt-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[11px] tracking-[3px] uppercase mb-1" style={{ color: '#505050' }}>Respiração guiada</p>
            <AnimatePresence mode="wait">
              <motion.h1
                key={tech.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="font-bold text-white"
                style={{ fontSize: 26, letterSpacing: -0.5 }}
              >
                {tech.name}
              </motion.h1>
            </AnimatePresence>
          </div>
          {!running && (
            <button
              onClick={() => setShowDetail(!showDetail)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#606060' }}
            >
              {showDetail ? '×' : 'i'}
            </button>
          )}
        </div>

        {/* Technique selector */}
        {!running && !completed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-5 px-5"
            style={{ scrollbarWidth: 'none' }}
          >
            {TECHNIQUES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTech(t); setCompleted(false) }}
                className="flex-shrink-0 text-left px-4 py-3 rounded-2xl transition-all"
                style={{
                  background: tech.id === t.id ? `${t.color}12` : 'rgba(255,255,255,0.03)',
                  border: tech.id === t.id ? `0.5px solid ${t.color}50` : '0.5px solid rgba(255,255,255,0.07)',
                  minWidth: 110,
                }}
              >
                <p className="text-lg mb-1">{t.icon}</p>
                <p className="font-semibold text-xs text-white mb-0.5 leading-tight">{t.name}</p>
                <p className="text-[10px]" style={{ color: t.id === tech.id ? t.color : '#505050' }}>{t.subtitle}</p>
              </button>
            ))}
          </motion.div>
        )}

        {/* Detail panel */}
        <AnimatePresence>
          {showDetail && !running && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl p-4 mb-5 overflow-hidden"
              style={{ background: `${tech.color}08`, border: `0.5px solid ${tech.color}25` }}
            >
              <p className="text-sm font-light leading-relaxed mb-3" style={{ color: '#909090' }}>
                {tech.description}
              </p>
              <p className="text-[11px] tracking-wide" style={{ color: tech.color, opacity: 0.8 }}>
                {tech.indication}
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {tech.phases.map((p, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.07)' }}
                  >
                    <span className="text-[11px]" style={{ color: '#606060' }}>{p.label}</span>
                    <span className="font-bold text-sm text-white">{p.duration}s</span>
                  </div>
                ))}
                <div
                  className="flex flex-col items-center px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.07)' }}
                >
                  <span className="text-[11px]" style={{ color: '#606060' }}>Ciclos</span>
                  <span className="font-bold text-sm text-white">{tech.cycles}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Central orb */}
        <div className="flex flex-col items-center flex-1 justify-center my-4">
          <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>

            {/* Outer pulse rings */}
            {running && (
              <>
                {[1.4, 1.65, 1.9].map((scale, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    animate={{
                      scale: [scale, scale + 0.15, scale],
                      opacity: [0.07, 0.13, 0.07],
                    }}
                    transition={{ duration: phase.duration, ease: 'easeInOut', repeat: Infinity, delay: i * 0.2 }}
                    style={{
                      width: 130, height: 130,
                      border: `0.5px solid ${tech.color}`,
                    }}
                  />
                ))}
              </>
            )}

            {/* Progress arc SVG */}
            {running && (
              <svg
                className="absolute inset-0"
                width="260" height="260"
                style={{ transform: 'rotate(-90deg)' }}
              >
                <circle cx="130" cy="130" r="120" fill="none" stroke={`${tech.color}15`} strokeWidth="1" />
                <motion.circle
                  cx="130" cy="130" r="120" fill="none"
                  stroke={tech.color}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  animate={{ strokeDashoffset: 2 * Math.PI * 120 * (1 - progress) }}
                  transition={{ duration: 0.5 }}
                  style={{ opacity: 0.6 }}
                />
              </svg>
            )}

            {/* Main breathing orb */}
            <motion.div
              className="rounded-full flex flex-col items-center justify-center"
              animate={
                running && circleTarget !== undefined
                  ? { scale: circleTarget }
                  : running
                  ? { scale: [0.75, 0.78, 0.75] }
                  : completed
                  ? { scale: 1 }
                  : { scale: 0.72 }
              }
              transition={
                running && circleTarget !== undefined
                  ? { duration: phase.duration, ease: 'easeInOut' }
                  : running
                  ? { duration: 2, ease: 'easeInOut', repeat: Infinity }
                  : { duration: 0.6, ease: 'easeOut' }
              }
              style={{
                width: 200, height: 200,
                background: running
                  ? `radial-gradient(circle at 40% 35%, ${tech.color}30, ${tech.color}08)`
                  : completed
                  ? `${tech.color}15`
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${running || completed ? tech.color + '50' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: running ? `0 0 60px ${tech.color}20, 0 0 100px ${tech.color}10` : 'none',
              }}
            >
              <AnimatePresence mode="wait">
                {running && (
                  <motion.div
                    key={`${phaseIdx}-running`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      className="font-light text-[12px] uppercase tracking-[3px]"
                      style={{ color: tech.color }}
                    >
                      {phase.label}
                    </span>
                    <span
                      className="font-bold text-white"
                      style={{ fontSize: 62, lineHeight: 1, letterSpacing: -3 }}
                    >
                      {timeLeft}
                    </span>
                    <span className="text-[11px]" style={{ color: `${tech.color}90` }}>
                      ciclo {cycle + 1} / {tech.cycles}
                    </span>
                  </motion.div>
                )}
                {!running && !completed && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <span style={{ fontSize: 44 }}>{tech.icon}</span>
                    <span className="text-[11px] tracking-widest uppercase" style={{ color: '#404040' }}>
                      {totalMin} min
                    </span>
                  </motion.div>
                )}
                {completed && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <span style={{ fontSize: 44 }}>✨</span>
                    <span className="font-semibold text-sm" style={{ color: tech.color }}>Completo</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Phase indicator dots */}
          {running && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2 mt-5"
            >
              {tech.phases.map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: i === phaseIdx ? 20 : 6,
                    background: i === phaseIdx ? tech.color : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 pb-2">
          {!running && !completed && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={start}
              className="w-full py-4 rounded-full font-semibold text-base tracking-wide transition-all"
              style={{
                background: `linear-gradient(135deg, ${tech.color} 0%, ${tech.color}BB 100%)`,
                color: '#080808',
              }}
            >
              Iniciar — {totalMin} min
            </motion.button>
          )}
          {running && (
            <button
              onClick={stop}
              className="w-full py-4 rounded-full font-semibold text-base tracking-wide transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '0.5px solid rgba(255,255,255,0.12)',
                color: '#707070',
              }}
            >
              Encerrar sessão
            </button>
          )}
          {completed && (
            <div className="flex flex-col gap-3">
              <p
                className="text-center text-sm font-light"
                style={{ color: '#606060' }}
              >
                {tech.cycles} ciclos completos. Como está seu corpo agora?
              </p>
              <button
                onClick={() => router.push('/checkin')}
                className="w-full py-4 rounded-full font-semibold text-base tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #CCCCCC 100%)',
                  color: '#0A0A0A',
                }}
              >
                Registrar como estou
              </button>
              <button
                onClick={stop}
                className="w-full py-3 rounded-full text-sm"
                style={{ color: '#505050' }}
              >
                Fazer outra técnica
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Session history */}
      {breatheSessions.length > 0 && !running && (
        <div className="relative z-10 px-5 pt-2 pb-4">
          <p className="text-[10px] tracking-[2px] uppercase mb-3" style={{ color: '#404040' }}>Sessões anteriores</p>
          <div className="flex flex-col gap-2">
            {breatheSessions.slice(0, 5).map((s) => {
              const t = TECHNIQUES.find(x => x.id === s.techniqueId)
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 18 }}>{t?.icon ?? '🌬️'}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{s.techniqueName}</p>
                      <p className="text-[11px]" style={{ color: '#404040' }}>{s.durationMin} min</p>
                    </div>
                  </div>
                  <p className="text-[11px]" style={{ color: '#404040' }}>
                    {new Date(s.timestamp).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
