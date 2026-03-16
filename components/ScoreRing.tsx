'use client'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { scoreColor, scoreLabel } from '@/lib/store'

interface Props {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}

export default function ScoreRing({ score, size = 220, strokeWidth = 10, showLabel = true }: Props) {
  const circleRef = useRef<SVGCircleElement>(null)
  const r = (size - strokeWidth * 2) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const color = scoreColor(score)
  const label = scoreLabel(score)

  useEffect(() => {
    if (!circleRef.current) return
    const offset = circumference - (score / 100) * circumference
    circleRef.current.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)'
    circleRef.current.style.strokeDashoffset = String(offset)
  }, [score, circumference])

  const gradId = `grad-${score}`
  const glowId = `glow-${score}`

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>

      {/* Breathing outer glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size + 32,
          height: size + 32,
          top: -16,
          left: -16,
          background: `radial-gradient(circle at center, ${color}18 0%, transparent 60%)`,
        }}
        animate={{ scale: [1, 1.07, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Secondary soft pulse ring */}
      <motion.div
        className="absolute rounded-full pointer-events-none border"
        style={{
          width: size + 8,
          height: size + 8,
          top: -4,
          left: -4,
          borderColor: `${color}20`,
        }}
        animate={{ scale: [1, 1.04, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />

      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />

        {/* Inner decorative ring */}
        <circle cx={cx} cy={cy} r={r - strokeWidth - 8} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} />

        {/* Animated progress arc */}
        <circle
          ref={circleRef}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          filter={`url(#${glowId})`}
        />
      </svg>

      {/* Center content */}
      <motion.div
        className="flex flex-col items-center gap-0.5 z-10"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.span
          className="font-bold leading-none"
          style={{ fontSize: 52, color, letterSpacing: -2 }}
          key={score}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {score}
        </motion.span>
        <span className="text-[13px] text-muted font-light">/ 100</span>
        {showLabel && (
          <span className="text-[11px] text-silver/70 font-medium mt-2 text-center px-6 leading-tight">
            {label}
          </span>
        )}
      </motion.div>
    </div>
  )
}
