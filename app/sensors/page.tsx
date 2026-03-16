'use client'
import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { SensorStatus, useTypingRhythm, useAccelerometer, useMicLevel, useCameraRPPG } from '@/lib/useSensors'

// ─── BPM ring ────────────────────────────────────────────────────────────────
function BpmRing({ bpm }: { bpm: number }) {
  const color = bpm < 60 ? '#3A86FF' : bpm < 100 ? '#00D4A0' : bpm < 120 ? '#FFB800' : '#FF4466'
  const label = bpm < 60 ? 'Bradicardia' : bpm < 100 ? 'Normal' : bpm < 120 ? 'Elevado' : 'Alto'
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className="w-20 h-20 rounded-full flex flex-col items-center justify-center"
        animate={{ boxShadow: [`0 0 0px ${color}40`, `0 0 20px ${color}60`, `0 0 0px ${color}40`] }}
        transition={{ duration: 60 / bpm, repeat: Infinity }}
        style={{ border: `2px solid ${color}`, background: `${color}10` }}
      >
        <span className="font-bold text-xl" style={{ color }}>{bpm}</span>
        <span className="text-[9px]" style={{ color: `${color}90` }}>BPM</span>
      </motion.div>
      <span className="text-xs font-medium" style={{ color }}>{label}</span>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function SensorsPage() {
  const router = useRouter()
  const typingMetrics = useTypingRhythm()
  const accel = useAccelerometer()
  const camera = useCameraRPPG()
  const mic = useMicLevel()

  const SENSORS: {
    id: string
    icon: string
    title: string
    subtitle: string
    description: string
    color: string
    status: SensorStatus
    onStart: () => void
    onStop: () => void
    content: React.ReactNode
  }[] = [
    {
      id: 'camera',
      icon: '📷',
      title: 'Câmera frontal',
      subtitle: 'Frequência cardíaca via rPPG',
      description: 'Detecta variações sutis de cor na pele causadas pela circulação sanguínea. Estima BPM sem contato.',
      color: '#00D4A0',
      status: camera.status,
      onStart: camera.start,
      onStop: camera.stop,
      content: camera.status === 'active' ? (
        <div className="flex flex-col items-center gap-4 mt-4">
          <div className="relative rounded-2xl overflow-hidden" style={{ width: 200, height: 150 }}>
            <video ref={camera.videoRef} muted playsInline className="w-full h-full object-cover" />
            <canvas ref={camera.canvasRef} className="hidden" />
            <div className="absolute inset-0 rounded-2xl" style={{ border: '1px solid rgba(0,212,160,0.4)', boxShadow: 'inset 0 0 20px rgba(0,212,160,0.1)' }} />
            <div className="absolute top-2 left-2">
              <motion.div className="flex items-center gap-1.5">
                <motion.div className="w-1.5 h-1.5 rounded-full bg-[#00D4A0]"
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                <span className="text-[10px] text-[#00D4A0] font-medium">Analisando</span>
              </motion.div>
            </div>
          </div>
          {camera.bpm ? <BpmRing bpm={camera.bpm} /> : (
            <div className="flex items-center gap-2">
              <motion.div className="w-2 h-2 rounded-full bg-[#00D4A0]" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} />
              <span className="text-xs" style={{ color: '#606060' }}>Calibrando (~5s)…</span>
            </div>
          )}
        </div>
      ) : null,
    },
    {
      id: 'mic',
      icon: '🎙️',
      title: 'Microfone',
      subtitle: 'Tensão vocal e padrão respiratório',
      description: 'Analisa frequência e intensidade da voz. Stress e ansiedade alteram padrões vocais mensuráveis.',
      color: '#7B8FF8',
      status: mic.status,
      onStart: mic.start,
      onStop: mic.stop,
      content: mic.status === 'active' ? (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <motion.div className="w-2 h-2 rounded-full bg-[#7B8FF8]"
              animate={{ scale: [1, 1 + mic.level / 200, 1] }} transition={{ duration: 0.2 }} />
            <span className="text-[11px]" style={{ color: '#7B8FF8' }}>Nível: {mic.level}</span>
          </div>
          <div className="h-8 rounded-xl overflow-hidden flex items-end gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {Array.from({ length: 32 }, (_, i) => (
              <motion.div key={i} className="flex-1 rounded-t"
                animate={{ height: `${Math.max(4, Math.random() * mic.level * 0.8 + 4)}%` }}
                transition={{ duration: 0.15 }}
                style={{ background: '#7B8FF8', opacity: 0.6 + (i / 64) }} />
            ))}
          </div>
          <p className="text-[11px] mt-2" style={{ color: '#404040' }}>
            {mic.level < 10 ? 'Silêncio detectado' : mic.level < 40 ? 'Voz tranquila' : mic.level < 70 ? 'Tom elevado' : 'Intensidade alta'}
          </p>
        </div>
      ) : null,
    },
    {
      id: 'accel',
      icon: '📱',
      title: 'Acelerômetro',
      subtitle: 'Agitação motora e inquietação',
      description: 'TDAH e ansiedade frequentemente se manifestam em movimentos corporais involuntários. O acelerômetro detecta isso.',
      color: '#FFB800',
      status: accel.status,
      onStart: accel.start,
      onStop: accel.stop,
      content: accel.status === 'active' && accel.data ? (
        <div className="mt-4 flex flex-col gap-2">
          {[
            { label: 'Eixo X', val: accel.data.x },
            { label: 'Eixo Y', val: accel.data.y },
            { label: 'Eixo Z', val: accel.data.z },
          ].map(({ label, val }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-[11px] w-12 flex-shrink-0" style={{ color: '#505050' }}>{label}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div className="h-full rounded-full"
                  animate={{ width: `${Math.min(100, Math.abs(val) * 20)}%` }}
                  transition={{ duration: 0.2 }}
                  style={{ background: '#FFB800' }} />
              </div>
              <span className="text-[11px] w-10 text-right font-mono" style={{ color: '#FFB800' }}>{val}</span>
            </div>
          ))}
          <div className="flex items-center justify-between mt-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,184,0,0.08)', border: '0.5px solid rgba(255,184,0,0.2)' }}>
            <span className="text-xs" style={{ color: '#505050' }}>Agitação</span>
            <span className="font-bold text-sm" style={{ color: '#FFB800' }}>{accel.data.agitation}/100</span>
          </div>
        </div>
      ) : null,
    },
    {
      id: 'typing',
      icon: '⌨️',
      title: 'Padrão de digitação',
      subtitle: 'Velocidade e ritmo revelam estado mental',
      description: 'Estudos mostram que ansiedade acelera e fragmenta a digitação. TDAH cria padrões de burst erráticos.',
      color: '#E040FB',
      status: typingMetrics ? 'active' as SensorStatus : 'idle' as SensorStatus,
      onStart: () => {},
      onStop: () => {},
      content: typingMetrics ? (
        <div className="mt-4 flex flex-col gap-2.5">
          {[
            { label: 'Intervalo médio', val: `${typingMetrics.avgInterval}ms`, hint: typingMetrics.avgInterval < 100 ? 'Digitação rápida' : typingMetrics.avgInterval < 200 ? 'Ritmo normal' : 'Digitação lenta' },
            { label: 'Variância', val: `${typingMetrics.variance}`, hint: typingMetrics.variance > 5000 ? 'Ritmo irregular' : 'Ritmo consistente' },
            { label: 'Burst score', val: `${typingMetrics.burstScore}/100`, hint: typingMetrics.burstScore > 70 ? 'Alta intensidade' : 'Intensidade normal' },
          ].map(({ label, val, hint }) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white">{label}</p>
                <p className="text-[11px]" style={{ color: '#404040' }}>{hint}</p>
              </div>
              <span className="font-bold text-sm font-mono" style={{ color: '#E040FB' }}>{val}</span>
            </div>
          ))}
          <p className="text-[10px] mt-1" style={{ color: '#303030' }}>
            * Baseado nas últimas {20} teclas nesta sessão
          </p>
        </div>
      ) : (
        <p className="text-xs mt-3" style={{ color: '#404040' }}>
          Digite qualquer coisa nesta tela para iniciar a análise automática.
        </p>
      ),
    },
  ]

  return (
    <div className="min-h-screen pb-28">
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 35% at 50% 0%, rgba(0,212,160,0.06) 0%, transparent 65%)' }} />

      <div className="relative z-10 px-5 pt-14">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-[11px] tracking-[3px] uppercase mb-1" style={{ color: '#505050' }}>Biometria</p>
          <h1 className="font-bold text-white mb-1" style={{ fontSize: 28, letterSpacing: -0.5 }}>Detecção</h1>
          <p className="text-sm font-light mb-6" style={{ color: '#505050' }}>
            Sensores passivos para monitoramento em tempo real
          </p>
        </motion.div>

        <div
          className="rounded-2xl px-4 py-3 mb-6 flex items-start gap-3"
          style={{ background: 'rgba(255,184,0,0.06)', border: '0.5px solid rgba(255,184,0,0.2)' }}
        >
          <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
          <p className="text-xs font-light leading-relaxed" style={{ color: '#707070' }}>
            Os dados são processados localmente no dispositivo. Nada é enviado a servidores. CARE não armazena biometria.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {SENSORS.map((s, i) => (
            <motion.div key={s.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl px-5 py-4"
              style={{ background: 'rgba(255,255,255,0.025)', border: `0.5px solid ${s.status === 'active' ? s.color + '35' : 'rgba(255,255,255,0.07)'}` }}>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${s.color}12` }}>
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm text-white">{s.title}</p>
                      {s.status === 'active' && (
                        <motion.div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: s.color }}
                          animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                      )}
                    </div>
                    <p className="text-[11px]" style={{ color: '#505050' }}>{s.subtitle}</p>
                  </div>
                </div>

                {s.id !== 'typing' && (
                  <button
                    onClick={s.status === 'active' ? s.onStop : s.onStart}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                    style={
                      s.status === 'active'
                        ? { background: `${s.color}20`, color: s.color, border: `0.5px solid ${s.color}50` }
                        : s.status === 'denied'
                        ? { background: 'rgba(255,68,102,0.1)', color: '#FF4466', border: '0.5px solid rgba(255,68,102,0.3)' }
                        : { background: 'rgba(255,255,255,0.07)', color: '#C8C8C8', border: '0.5px solid rgba(255,255,255,0.12)' }
                    }
                  >
                    {s.status === 'active' ? 'Parar' : s.status === 'requesting' ? '…' : s.status === 'denied' ? 'Negado' : 'Ativar'}
                  </button>
                )}
              </div>

              {/* Description */}
              <p className="text-xs font-light mt-2.5 leading-relaxed" style={{ color: '#505050' }}>{s.description}</p>

              {/* Live data */}
              {s.content}
            </motion.div>
          ))}
        </div>

        <div className="mt-6 mb-2">
          <p className="text-[10px] text-center leading-relaxed" style={{ color: '#303030' }}>
            Análise de frequência cardíaca por câmera (rPPG) é experimental.{'\n'}
            Para diagnósticos, consulte profissionais de saúde.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
