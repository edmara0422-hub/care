'use client'
import { useEffect, useRef } from 'react'

interface Props {
  count?: number
  color?: string
  maxDist?: number
  speed?: number
  className?: string
  mouseInteractive?: boolean
}

export default function ParticleField({
  count = 60,
  color = '255,255,255',
  maxDist = 120,
  speed = 0.4,
  className = '',
  mouseInteractive = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef  = useRef({ x: -999, y: -999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: count }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      r:  Math.random() * 1.5 + 0.5,
    }))

    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      const pos  = 'touches' in e ? e.touches[0] : e
      mouseRef.current = { x: pos.clientX - rect.left, y: pos.clientY - rect.top }
    }
    if (mouseInteractive) {
      canvas.addEventListener('mousemove', onMove)
      canvas.addEventListener('touchmove', onMove as any)
    }

    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        // repulsão suave do mouse
        if (mouseInteractive) {
          const dx = p.x - mouseRef.current.x
          const dy = p.y - mouseRef.current.y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < 100) {
            p.x += (dx / d) * 0.8
            p.y += (dy / d) * 0.8
          }
        }

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
        if (p.y < 0 || p.y > canvas.height)  p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color},0.5)`
        ctx.fill()

        // linhas entre partículas próximas
        particles.forEach((p2) => {
          const dx   = p.x - p2.x
          const dy   = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.18
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(${color},${alpha})`
            ctx.lineWidth   = 0.5
            ctx.stroke()
          }
        })
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      if (mouseInteractive) {
        canvas.removeEventListener('mousemove', onMove)
      }
    }
  }, [count, color, maxDist, speed, mouseInteractive])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ pointerEvents: mouseInteractive ? 'auto' : 'none' }}
    />
  )
}
