'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCareStore } from '@/lib/store'

type Phase = 'entry' | 'breathe' | 'ground' | 'affirm' | 'done'

const GROUND_STEPS = [
  { emoji: '👁️', sense: 'VEJA', count: 5, instruction: 'Nomeie 5 coisas que você consegue VER agora. Olhe ao redor devagar.' },
  { emoji: '✋', sense: 'TOQUE', count: 4, instruction: 'Sinta 4 coisas que você consegue TOCAR. A textura, temperatura, superfície.' },
  { emoji: '👂', sense: 'OUÇA', count: 3, instruction: 'Identifique 3 sons que você consegue OUVIR neste momento.' },
  { emoji: '👃', sense: 'CHEIRE', count: 2, instruction: 'Perceba 2 cheiros no ambiente. Pode ser sutil.' },
  { emoji: '👅', sense: 'SABOREIE', count: 1, instruction: 'Identifique 1 sabor ou sensação na sua boca agora.' },
]

const AFFIRMATIONS = [
  'Estou seguro agora.',
  'Isso vai passar.',
  'Não estou sozinho.',
  'Meu corpo está me protegendo.',
  'Já passei por isso antes.',
  'Eu consigo atravessar esse momento.',
]

export default function SOSPage() {
  const router = useRouter()
  const { completePractice, unlockAchievement, logSosActivation } = useCareStore()
  const [phase, setPhase] = useState<Phase>('entry')
  const [breathCount, setBreathCount] = useState(0)
  const [groundStep, setGroundStep] = useState(0)
  const [affirm, setAffirm] = useState(0)

  useEffect(() => {
    if (phase === 'done') {
      completePractice('sos')
      unlockAchievement('used_sos')
      logSosActivation()
    }
  }, [phase, completePractice, unlockAchievement, logSosActivation])

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col overflow-hidden">
      {/* Pulsing dark red ambient for entry, transitions to calm */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        animate={{
          background:
            phase === 'entry'
              ? 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,68,102,0.08) 0%, transparent 70%)'
              : phase === 'breathe'
              ? 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,212,160,0.07) 0%, transparent 70%)'
              : phase === 'ground'
              ? 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(123,143,248,0.07) 0%, transparent 70%)'
              : 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,212,160,0.08) 0%, transparent 70%)',
        }}
        transition={{ duration: 1.5 }}
      />

      <AnimatePresence mode="wait">

        {/* ── ENTRY ─────────────────────────────────────────────────────── */}
        {phase === 'entry' && (
          <motion.div
            key="entry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col min-h-screen px-6 justify-between pt-20 pb-16"
          >
            <div>
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-8"
                style={{ background: 'rgba(255,68,102,0.1)', border: '0.5px solid rgba(255,68,102,0.3)' }}
              >
                🆘
              </motion.div>

              <h1 className="font-bold text-white mb-4" style={{ fontSize: 32, letterSpacing: -0.8, lineHeight: 1.2 }}>
                Estou aqui.{'\n'}Você não está sozinho.
              </h1>
              <p className="text-lg font-light leading-relaxed" style={{ color: '#707070' }}>
                Você está passando por um momento difícil. Isso é válido. Vamos atravessar isso juntos, um passo de cada vez.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {/* CVV always visible */}
              <a
                href="tel:188"
                className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                style={{ background: 'rgba(255,68,102,0.08)', border: '0.5px solid rgba(255,68,102,0.3)' }}
              >
                <span className="text-2xl">📞</span>
                <div>
                  <p className="font-semibold text-white text-sm">CVV — Ligue 188</p>
                  <p className="text-xs" style={{ color: '#FF4466', opacity: 0.8 }}>24 horas · gratuito · sigiloso</p>
                </div>
              </a>

              <button
                onClick={() => setPhase('breathe')}
                className="w-full py-4 rounded-full font-semibold text-base tracking-wide"
                style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #DDDDDD 100%)', color: '#0A0A0A' }}
              >
                Me ajuda a respirar →
              </button>

              <button
                onClick={() => router.back()}
                className="text-sm py-2"
                style={{ color: '#404040' }}
              >
                Voltar
              </button>
            </div>
          </motion.div>
        )}

        {/* ── BREATHE ───────────────────────────────────────────────────── */}
        {phase === 'breathe' && (
          <motion.div
            key="breathe"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col min-h-screen items-center justify-center px-6 gap-8"
          >
            <div className="text-center">
              <p className="text-[11px] tracking-[3px] uppercase mb-2" style={{ color: '#00D4A0', opacity: 0.7 }}>
                Passo 1
              </p>
              <h2 className="font-bold text-white text-2xl mb-2">Respira comigo</h2>
              <p className="text-sm font-light" style={{ color: '#606060' }}>
                4 segundos para dentro, 6 para fora
              </p>
            </div>

            {/* Breathing orb */}
            <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
              {[1.3, 1.55].map((s, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  animate={{ scale: [s, s + 0.12, s], opacity: [0.05, 0.12, 0.05] }}
                  transition={{ duration: 10, repeat: Infinity, delay: i * 0.5 }}
                  style={{ width: 140, height: 140, border: '0.5px solid #00D4A0' }}
                />
              ))}
              <motion.div
                className="rounded-full flex flex-col items-center justify-center"
                animate={{ scale: [0.6, 1, 0.6] }}
                transition={{ duration: 10, ease: 'easeInOut', repeat: Infinity }}
                style={{
                  width: 180, height: 180,
                  background: 'radial-gradient(circle at 40% 35%, rgba(0,212,160,0.25), rgba(0,212,160,0.05))',
                  border: '1px solid rgba(0,212,160,0.4)',
                  boxShadow: '0 0 60px rgba(0,212,160,0.15)',
                }}
              >
                <motion.span
                  className="font-light text-[12px] uppercase tracking-[3px]"
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 10, times: [0, 0.1, 0.45, 0.55], repeat: Infinity }}
                  style={{ color: '#00D4A0' }}
                >
                  inspire
                </motion.span>
                <motion.span
                  className="font-light text-[12px] uppercase tracking-[3px]"
                  animate={{ opacity: [0, 0, 1, 1, 0] }}
                  transition={{ duration: 10, times: [0, 0.45, 0.55, 0.9, 1], repeat: Infinity }}
                  style={{ color: '#00D4A080', position: 'absolute' }}
                >
                  expire
                </motion.span>
              </motion.div>
            </div>

            <div className="flex items-center gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  onClick={() => {
                    const next = breathCount + 1
                    setBreathCount(next)
                    if (next >= 5) { setPhase('ground'); setBreathCount(0) }
                  }}
                  className="w-10 h-10 rounded-full transition-all"
                  style={{
                    background: i < breathCount ? '#00D4A0' : 'rgba(255,255,255,0.05)',
                    border: i < breathCount ? 'none' : '0.5px solid rgba(255,255,255,0.1)',
                    boxShadow: i < breathCount ? '0 0 12px rgba(0,212,160,0.4)' : 'none',
                  }}
                />
              ))}
            </div>

            <p className="text-sm text-center" style={{ color: '#404040' }}>
              Toque cada bolinha ao completar uma respiração
            </p>

            <button
              onClick={() => setPhase('ground')}
              className="text-sm py-2"
              style={{ color: '#404040' }}
            >
              Pular →
            </button>
          </motion.div>
        )}

        {/* ── GROUND ────────────────────────────────────────────────────── */}
        {phase === 'ground' && (
          <motion.div
            key="ground"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col min-h-screen px-6 justify-between pt-20 pb-16"
          >
            <div>
              <p className="text-[11px] tracking-[3px] uppercase mb-2" style={{ color: '#7B8FF8', opacity: 0.7 }}>
                Passo 2 — Ancoragem
              </p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={groundStep}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6">
                    <span className="text-5xl">{GROUND_STEPS[groundStep].emoji}</span>
                  </div>
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                    style={{ background: 'rgba(123,143,248,0.1)', border: '0.5px solid rgba(123,143,248,0.3)' }}
                  >
                    <span className="font-bold text-2xl" style={{ color: '#7B8FF8' }}>
                      {GROUND_STEPS[groundStep].count}
                    </span>
                    <span className="font-semibold text-sm" style={{ color: '#7B8FF8' }}>
                      {GROUND_STEPS[groundStep].sense}
                    </span>
                  </div>
                  <h2 className="font-bold text-white text-2xl mb-4" style={{ lineHeight: 1.3 }}>
                    {GROUND_STEPS[groundStep].instruction}
                  </h2>
                </motion.div>
              </AnimatePresence>

              {/* Step dots */}
              <div className="flex gap-2 mt-8">
                {GROUND_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 rounded-full transition-all duration-300"
                    style={{
                      width: i === groundStep ? 24 : 8,
                      background: i <= groundStep ? '#7B8FF8' : 'rgba(255,255,255,0.1)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  if (groundStep < GROUND_STEPS.length - 1) {
                    setGroundStep((s) => s + 1)
                  } else {
                    setPhase('affirm')
                  }
                }}
                className="w-full py-4 rounded-full font-semibold text-base"
                style={{ background: '#7B8FF8', color: '#080808' }}
              >
                {groundStep < GROUND_STEPS.length - 1 ? 'Próximo sentido →' : 'Concluir ancoragem →'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── AFFIRM ────────────────────────────────────────────────────── */}
        {phase === 'affirm' && (
          <motion.div
            key="affirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col min-h-screen px-6 justify-between pt-20 pb-16"
          >
            <div>
              <p className="text-[11px] tracking-[3px] uppercase mb-2" style={{ color: '#00D4A0', opacity: 0.7 }}>
                Passo 3 — Afirmação
              </p>
              <h2 className="font-bold text-white text-2xl mb-3">
                Você chegou até aqui.
              </h2>
              <p className="text-sm font-light mb-8" style={{ color: '#606060' }}>
                Escolha uma frase e repita mentalmente 3 vezes.
              </p>

              <div className="flex flex-col gap-2.5">
                {AFFIRMATIONS.map((a, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => setAffirm(i)}
                    className="text-left px-5 py-4 rounded-2xl font-medium text-base transition-all"
                    style={{
                      background: affirm === i ? 'rgba(0,212,160,0.1)' : 'rgba(255,255,255,0.03)',
                      border: affirm === i ? '0.5px solid rgba(0,212,160,0.4)' : '0.5px solid rgba(255,255,255,0.07)',
                      color: affirm === i ? '#fff' : '#606060',
                    }}
                  >
                    {a}
                  </motion.button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setPhase('done')}
              className="w-full py-4 rounded-full font-semibold text-base"
              style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #DDDDDD 100%)', color: '#0A0A0A' }}
            >
              Concluir protocolo
            </button>
          </motion.div>
        )}

        {/* ── DONE ──────────────────────────────────────────────────────── */}
        {phase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150 }}
            className="relative z-10 flex flex-col min-h-screen px-6 items-center justify-center gap-6 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl"
            >
              🌿
            </motion.div>
            <div>
              <h2 className="font-bold text-white text-2xl mb-3">Você atravessou.</h2>
              <p className="text-base font-light leading-relaxed" style={{ color: '#707070' }}>
                Isso exigiu coragem. O pico mais difícil já passou. Seu sistema nervoso está se regulando.
              </p>
            </div>

            <div
              className="w-full px-5 py-4 rounded-2xl text-left"
              style={{ background: 'rgba(255,68,102,0.06)', border: '0.5px solid rgba(255,68,102,0.2)' }}
            >
              <p className="text-sm font-medium text-white mb-1">Lembre-se sempre</p>
              <p className="text-xs font-light" style={{ color: '#707070' }}>
                CVV: <strong className="text-white">188</strong> · 24h · gratuito · sigiloso
              </p>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={() => router.push('/checkin')}
                className="w-full py-4 rounded-full font-semibold text-base"
                style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #DDDDDD 100%)', color: '#0A0A0A' }}
              >
                Registrar como estou agora
              </button>
              <button
                onClick={() => router.push('/home')}
                className="text-sm py-2"
                style={{ color: '#404040' }}
              >
                Ir para o início
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
