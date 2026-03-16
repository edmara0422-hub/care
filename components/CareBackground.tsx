'use client'
import { useEffect, useRef } from 'react'
import { useCareStore } from '@/lib/store'
import { scoreColor } from '@/lib/store'

export default function CareBackground() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const colorRef   = useRef<string>('#00D4A0')
  const { currentScore } = useCareStore()

  // Store color in ref so animation loop always reads latest without restarting
  colorRef.current = scoreColor(currentScore)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Fewer dots — 16 instead of 28 → 120 pairs instead of 378
    const dots = Array.from({ length: 16 }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r:  Math.random() * 1.2 + 0.3,
    }))

    const MAX_DIST    = 130
    const MAX_DIST_SQ = MAX_DIST * MAX_DIST   // avoid sqrt when possible
    let animId: number
    let lastTime = 0
    const FRAME_MS = 1000 / 30  // cap at 30fps — imperceptible for background

    const draw = (now: number) => {
      animId = requestAnimationFrame(draw)
      if (now - lastTime < FRAME_MS) return
      lastTime = now

      // Parse color once per frame (cheap since colorRef rarely changes)
      const hex = colorRef.current
      const r   = parseInt(hex.slice(1, 3), 16)
      const g   = parseInt(hex.slice(3, 5), 16)
      const b   = parseInt(hex.slice(5, 7), 16)
      const rgb = `${r},${g},${b}`

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update positions
      for (const p of dots) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
        if (p.y < 0 || p.y > canvas.height)  p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb},0.35)`
        ctx.fill()
      }

      // Draw connections — only i < j to avoid duplicate pairs
      ctx.lineWidth = 0.5
      for (let i = 0; i < dots.length - 1; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x
          const dy = dots[i].y - dots[j].y
          const distSq = dx * dx + dy * dy
          if (distSq < MAX_DIST_SQ) {
            const a = (1 - Math.sqrt(distSq) / MAX_DIST) * 0.10
            ctx.beginPath()
            ctx.moveTo(dots[i].x, dots[i].y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.strokeStyle = `rgba(${rgb},${a.toFixed(3)})`
            ctx.stroke()
          }
        }
      }
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, []) // single mount — color read via ref, no restarts

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0, opacity: 0.6 }}
      />

      {/* Aurora CSS blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="care-orb care-orb-1"
          style={{ width: 500, height: 500, top: -160, left: -120,
            background: `radial-gradient(circle, ${colorRef.current}18 0%, transparent 70%)` }} />
        <div className="care-orb care-orb-2"
          style={{ width: 400, height: 400, top: -80, right: -140,
            background: 'radial-gradient(circle, rgba(123,143,248,0.10) 0%, transparent 70%)' }} />
        <div className="care-orb care-orb-3"
          style={{ width: 600, height: 300, top: '35%', left: '50%', transform: 'translateX(-50%)',
            background: `radial-gradient(ellipse, ${colorRef.current}07 0%, transparent 70%)` }} />
        <div className="care-orb care-orb-4"
          style={{ width: 360, height: 360, bottom: -100, right: -80,
            background: 'radial-gradient(circle, rgba(255,140,0,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* Noise overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        opacity: 0.4 }} />
    </>
  )
}
