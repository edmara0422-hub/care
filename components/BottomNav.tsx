'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/home',      label: 'Início',   icon: HomeIcon,   glow: '#00D4A0' },
  { href: '/checkin',   label: 'Check-in', icon: HeartIcon,  glow: '#FF6482' },
  { href: '/practices', label: 'Práticas', icon: StarIcon,   glow: '#00D4A0' },
  { href: '/insights',  label: 'Padrões',  icon: ChartIcon,  glow: '#FFB800' },
  { href: '/chat',      label: 'Tutor',    icon: TutorIcon,  glow: '#7B8FF8' },
]

export default function BottomNav() {
  const path = usePathname()

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 pointer-events-none"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))', padding: '0 16px max(16px, env(safe-area-inset-bottom))' }}>

      {/* Floating pill container */}
      <div
        className="pointer-events-auto relative flex items-center justify-around rounded-[28px] px-2 py-2"
        style={{
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 0.5px 0 rgba(255,255,255,0.07)',
        }}
      >
        {tabs.map(({ href, label, icon: Icon, glow }) => {
          const active = path === href
            || (href === '/practices' && (path === '/breathe' || path === '/sos'))
            || (href === '/insights' && path === '/sensors')

          return (
            <Link key={href} href={href}
              className="relative flex flex-col items-center justify-center gap-1 px-3 py-1.5"
              style={{ minWidth: 56 }}
            >
              {/* Glow pill behind active icon */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: `${glow}15`,
                  border: `0.5px solid ${glow}30`,
                  opacity: active ? 1 : 0,
                  transition: 'opacity 0.1s',
                }}
              />

              {/* Active top dot */}
              <div
                className="absolute -top-0.5 w-4 h-0.5 rounded-full"
                style={{
                  background: glow,
                  boxShadow: `0 0 8px ${glow}`,
                  opacity: active ? 1 : 0,
                  transform: `scaleX(${active ? 1 : 0})`,
                  transition: 'opacity 0.12s, transform 0.12s',
                }}
              />

              {/* Icon */}
              <div className="relative z-10" style={{ transform: `scale(${active ? 1.08 : 1})`, transition: 'transform 0.12s' }}>
                <Icon active={active} glow={glow} />
              </div>

              {/* Label */}
              <span
                className="relative z-10 text-[9px] font-medium tracking-wide leading-none"
                style={{ color: active ? '#ffffff' : '#3a3a3a', transition: 'color 0.12s' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function HomeIcon({ active, glow }: { active?: boolean; glow: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24"
      fill={active ? `${glow}25` : 'none'}
      stroke={active ? glow : '#3a3a3a'}
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      style={{ filter: active ? `drop-shadow(0 0 6px ${glow}80)` : 'none' }}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  )
}

function HeartIcon({ active, glow }: { active?: boolean; glow: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24"
      fill={active ? `${glow}30` : 'none'}
      stroke={active ? glow : '#3a3a3a'}
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      style={{ filter: active ? `drop-shadow(0 0 6px ${glow}80)` : 'none' }}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )
}

function StarIcon({ active, glow }: { active?: boolean; glow: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24"
      fill={active ? `${glow}25` : 'none'}
      stroke={active ? glow : '#3a3a3a'}
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      style={{ filter: active ? `drop-shadow(0 0 6px ${glow}80)` : 'none' }}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function ChartIcon({ active, glow }: { active?: boolean; glow: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
      stroke={active ? glow : '#3a3a3a'}
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      style={{ filter: active ? `drop-shadow(0 0 6px ${glow}80)` : 'none' }}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function TutorIcon({ active, glow }: { active?: boolean; glow: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24"
      fill={active ? `${glow}20` : 'none'}
      stroke={active ? glow : '#3a3a3a'}
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      style={{ filter: active ? `drop-shadow(0 0 6px ${glow}80)` : 'none' }}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}
