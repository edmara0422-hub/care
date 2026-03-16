'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCareStore } from '@/lib/store'
import { useHydrated } from '@/lib/useHydrated'

const LETTERS = ['C', 'A', 'R', 'E']

export default function SplashPage() {
  const router = useRouter()
  const { hasOnboarded } = useCareStore()
  const hydrated = useHydrated()
  const [phase, setPhase] = useState(0)
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -999, y: -999 })

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || !hydrated) return
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 900)
    const t3 = setTimeout(() => setPhase(3), 1800)
    const t4 = setTimeout(() => setPhase(4), 2500)
    const t5 = setTimeout(() => router.replace(hasOnboarded ? '/home' : '/onboarding'), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5) }
  }, [mounted, hydrated, hasOnboarded, router])

  // Neural particle canvas
  useEffect(() => {
    if (!mounted) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    window.addEventListener('mousemove', onMove)
    const pts = Array.from({ length: 45 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.2 + 0.4,
    }))
    const DIST = 130, DIST_SQ = DIST * DIST, FRAME_MS = 1000 / 30
    let raf: number, last = 0
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (now - last < FRAME_MS) return
      last = now
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const mx = mouseRef.current.x, my = mouseRef.current.y
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]
        const dx = p.x - mx, dy = p.y - my, dSq = dx * dx + dy * dy
        if (dSq < DIST_SQ && dSq > 0) { const d = Math.sqrt(dSq); p.vx += (dx / d) * 0.07; p.vy += (dy / d) * 0.07 }
        p.vx *= 0.99; p.vy *= 0.99
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        for (let j = i + 1; j < pts.length; j++) {
          const p2 = pts[j]
          const ddx = p.x - p2.x, ddy = p.y - p2.y, distSq = ddx * ddx + ddy * ddy
          if (distSq < DIST_SQ) {
            const dist = Math.sqrt(distSq)
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(255,255,255,${(1 - dist / DIST) * 0.1})`
            ctx.lineWidth = 0.5; ctx.stroke()
          }
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill()
      }
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', onMove) }
  }, [mounted])

  if (!mounted) return <div className="min-h-screen bg-[#080808]" />

  return (
    <div className="relative min-h-screen bg-[#080808] overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(255,255,255,0.035) 0%, transparent 65%)',
      }} />

      {/* SISTEMA CENTRAL — anéis + letras tudo junto */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div
            className="relative flex items-center justify-center"
            style={{ width: 440, height: 440 }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={phase < 4 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.5 }}
            transition={phase < 4
              ? { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
              : { duration: 0.8, ease: 'easeIn' }}
          >
            {/* Halo externo */}
            <motion.div className="absolute rounded-full" style={{
              width: 440, height: 440,
              border: '0.5px solid rgba(255,255,255,0.05)',
              background: 'radial-gradient(circle, rgba(255,255,255,0.018) 0%, transparent 70%)',
            }} animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />

            {/* Anel 1 */}
            <motion.div className="absolute rounded-full" style={{ width: 320, height: 320, border: '0.5px solid rgba(255,255,255,0.09)' }}
              animate={{ rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}>
              <div className="absolute w-2 h-2 rounded-full bg-white/55" style={{ top: -4, left: '50%', transform: 'translateX(-50%)' }} />
              <div className="absolute w-1 h-1 rounded-full bg-white/20" style={{ bottom: -2, left: '28%' }} />
            </motion.div>

            {/* Anel 2 inverso */}
            <motion.div className="absolute rounded-full" style={{ width: 220, height: 220, border: '0.5px solid rgba(255,255,255,0.13)' }}
              animate={{ rotate: -360 }} transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}>
              <div className="absolute w-1.5 h-1.5 rounded-full bg-white/40" style={{ bottom: -3, left: '50%', transform: 'translateX(-50%)' }} />
            </motion.div>

            {/* Anel 3 */}
            <motion.div className="absolute rounded-full" style={{ width: 140, height: 140, border: '0.5px solid rgba(255,255,255,0.18)' }}
              animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}>
              <div className="absolute w-1 h-1 rounded-full bg-white/50" style={{ top: -2, right: '15%' }} />
            </motion.div>

            {/* Núcleo glow respirante */}
            <motion.div className="absolute rounded-full" style={{
              width: 60, height: 60,
              background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.08) 60%, transparent 80%)',
              filter: 'blur(10px)',
            }} animate={{ scale: [1, 1.4, 1], opacity: [0.45, 1, 0.45] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} />
            <div className="absolute w-3 h-3 rounded-full bg-white" style={{ filter: 'blur(1.5px)', zIndex: 2 }} />

            {/* LETRAS C A R E com stagger — dentro dos anéis */}
            <AnimatePresence>
              {phase >= 2 && phase < 4 && (
                <div className="absolute z-10 flex items-center" style={{ gap: 6 }}>
                  {LETTERS.map((l, i) => (
                    <motion.span
                      key={l}
                      initial={{ opacity: 0, y: 24, filter: 'blur(12px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
                      transition={{ delay: i * 0.11, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                      className="font-bold text-white select-none"
                      style={{
                        fontSize: 68,
                        lineHeight: 1,
                        letterSpacing: 2,
                        fontFamily: 'Poppins, sans-serif',
                        textShadow: '0 0 30px rgba(255,255,255,0.35)',
                      }}
                    >
                      {l}
                    </motion.span>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tagline abaixo */}
      <AnimatePresence>
        {phase >= 3 && phase < 4 && (
          <motion.p
            className="absolute z-10 text-white/22 font-light uppercase tracking-[6px] text-[10px]"
            style={{ top: 'calc(50% + 248px)', fontFamily: 'Poppins, sans-serif' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            Cuidado com você mesmo
          </motion.p>
        )}
      </AnimatePresence>

      {/* Flash saída */}
      <AnimatePresence>
        {phase >= 4 && (
          <motion.div className="absolute inset-0 bg-[#080808] z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} />
        )}
      </AnimatePresence>
    </div>
  )
}
