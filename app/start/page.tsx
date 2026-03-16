'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCareStore } from '@/lib/store'

// ─── Práticas personalizadas por condição ────────────────────────────────────
const PRACTICES: Record<string, { icon: string; title: string; desc: string; duration: string; href: string }[]> = {
  ansiedade: [
    { icon: '◎', title: 'Respiração 4-7-8', desc: 'Ativa o sistema parassimpático em 90 segundos. Reduz cortisol imediatamente.', duration: '2 min', href: '/breathe' },
    { icon: '⟡', title: 'Grounding 5-4-3-2-1', desc: 'Ancora você no presente quando os pensamentos disparam. Técnica clínica comprovada.', duration: '3 min', href: '/breathe' },
    { icon: '◌', title: 'Diário de gatilhos', desc: 'Registrar o que disparou a ansiedade revela padrões que você não via.', duration: '5 min', href: '/checkin' },
  ],
  tdah: [
    { icon: '⌁', title: 'Bloco de foco 25min', desc: 'Pomodoro adaptado para TDAH — com pausa sensorial obrigatória. Treina o córtex pré-frontal.', duration: '25 min', href: '/breathe' },
    { icon: '◈', title: 'Grounding sensorial', desc: 'Reconectar ao corpo interrompe a dispersão. 3 objetos, 3 texturas, 3 sons.', duration: '3 min', href: '/breathe' },
    { icon: '○', title: 'Check-in de energia', desc: 'TDAH tem ciclos de energia. Mapear quando você foca melhor é estratégico.', duration: '1 min', href: '/checkin' },
  ],
  depressao: [
    { icon: '◉', title: 'Micro-conquista do dia', desc: 'Uma tarefa pequena, completada. O cérebro com depressão precisa de evidências de que consegue.', duration: '10 min', href: '/chat' },
    { icon: '◎', title: 'Nomeação de emoções', desc: 'Nomear o que sente com precisão reduz a intensidade da emoção. Pesquisa de neurociência.', duration: '3 min', href: '/checkin' },
    { icon: '⟡', title: 'Ativação comportamental', desc: 'Movimento gera neurotransmissores. Não espera a vontade — age primeiro.', duration: '5 min', href: '/breathe' },
  ],
  burnout: [
    { icon: '◌', title: 'Auditoria de energia', desc: 'O que drena e o que restaura? Mapear é o primeiro passo para sair do esgotamento.', duration: '5 min', href: '/chat' },
    { icon: '○', title: 'Protocolo de descanso', desc: 'Descanso não é preguiça — é recuperação ativa. 20 minutos sem tela, sem tarefa.', duration: '20 min', href: '/breathe' },
    { icon: '⌁', title: 'Registro de limites', desc: 'O burnout começa quando você não sabe dizer não. Identificar onde está cedendo demais.', duration: '5 min', href: '/chat' },
  ],
  estresse: [
    { icon: '◎', title: 'Respiração Box', desc: '4-4-4-4. Usada por militares e atletas de alta performance para reset rápido.', duration: '3 min', href: '/breathe' },
    { icon: '◈', title: 'Scan corporal', desc: 'O estresse mora no corpo antes da mente. Identificar onde está a tensão.', duration: '5 min', href: '/breathe' },
    { icon: '◌', title: 'Check-in de carga', desc: 'O estresse acumula invisível. Registrar 3x ao dia revela antes de explodir.', duration: '1 min', href: '/checkin' },
  ],
}

// Direcionamento de trabalho por condição
const DIRECTIONS: Record<string, { title: string; items: string[] }> = {
  ansiedade: {
    title: 'Seu foco principal',
    items: ['Regulação do sistema nervoso', 'Identificação de gatilhos', 'Reformulação cognitiva', 'Redução de hipervigilância'],
  },
  tdah: {
    title: 'Seu foco principal',
    items: ['Estratégias de foco e execução', 'Regulação emocional', 'Gestão de energia e tempo', 'Autoconhecimento dos ciclos'],
  },
  depressao: {
    title: 'Seu foco principal',
    items: ['Ativação comportamental gradual', 'Inteligência emocional', 'Construção de micro-evidências', 'Conexão com valores próprios'],
  },
  burnout: {
    title: 'Seu foco principal',
    items: ['Recuperação do sistema nervoso', 'Reconexão com identidade', 'Estabelecimento de limites', 'Prevenção de recaída'],
  },
  estresse: {
    title: 'Seu foco principal',
    items: ['Regulação do estresse crônico', 'Gestão de carga cognitiva', 'Protocolos de recuperação', 'Prevenção de burnout'],
  },
}

// Mapa: padrão detectado → chave de prática
const PATTERN_KEY: Record<string, string> = {
  'Ansiedade': 'ansiedade',
  'Padrões de TDAH': 'tdah',
  'Sinais depressivos': 'depressao',
  'Risco de burnout': 'burnout',
  'Estresse elevado': 'estresse',
}

const PATTERN_COLOR: Record<string, string> = {
  ansiedade: '#FF8C00', tdah: '#7B8BFF', depressao: '#FF4466', burnout: '#FF6B35', estresse: '#FFB800',
}

export default function StartPage() {
  const router = useRouter()
  const { userName, psychProfile, hasOnboarded } = useCareStore()
  const [phase, setPhase] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (!hasOnboarded) { router.replace('/onboarding'); return }
    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 1200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [mounted, hasOnboarded, router])

  if (!mounted || !psychProfile) return null

  // Pega os padrões detectados com práticas disponíveis
  const detectedKeys = psychProfile.detectedPatterns
    .map(p => PATTERN_KEY[p])
    .filter(Boolean)
    .filter((k, i, arr) => arr.indexOf(k) === i) // unique

  const primaryKey = detectedKeys[0] || 'estresse'
  const practices = PRACTICES[primaryKey] || PRACTICES['estresse']
  const direction = DIRECTIONS[primaryKey] || DIRECTIONS['estresse']
  const color = PATTERN_COLOR[primaryKey] || '#FFB800'

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${color}10 0%, transparent 65%)`,
        transition: 'background 1s ease',
      }} />

      <div className="relative z-10 flex justify-center">
        <div className="w-full max-w-[430px] px-6 pt-16 pb-28">

          {/* Header */}
          <AnimatePresence>
            {phase >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="mb-10"
              >
                <p className="text-white/20 text-[10px] tracking-[5px] uppercase mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Seu ponto de partida
                </p>
                <h1 className="font-bold text-white mb-1" style={{ fontSize: 34, letterSpacing: -1, lineHeight: 1.1, fontFamily: 'Poppins, sans-serif' }}>
                  {userName.split(' ')[0]}, o CARE<br />está calibrado pra você.
                </h1>
                <p className="text-white/30 text-sm font-light" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Baseado no seu perfil. Atualiza com o tempo.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Padrões + Score */}
          <AnimatePresence>
            {phase >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="rounded-3xl p-6 mb-5 relative overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)' }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl" style={{ background: `linear-gradient(90deg, ${color}80, transparent)` }} />

                <p className="text-white/20 text-[10px] tracking-[4px] uppercase mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Padrões identificados
                </p>

                <div className="flex flex-wrap gap-2 mb-5">
                  {psychProfile.detectedPatterns.map((p, i) => {
                    const k = PATTERN_KEY[p]
                    const c = k ? PATTERN_COLOR[k] : '#888'
                    return (
                      <motion.span
                        key={p}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.08 }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: `${c}15`, color: c, border: `0.5px solid ${c}40`, fontFamily: 'Poppins, sans-serif' }}
                      >
                        {p}
                      </motion.span>
                    )
                  })}
                  {psychProfile.hasMigraine && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: '#C084FC15', color: '#C084FC', border: '0.5px solid #C084FC40', fontFamily: 'Poppins, sans-serif' }}
                    >
                      Enxaqueca crônica
                    </motion.span>
                  )}
                </div>

                {/* Direcionamento */}
                <div className="border-t border-white/[0.06] pt-4">
                  <p className="text-white/20 text-[10px] tracking-[3px] uppercase mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {direction.title}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {direction.items.map((item, i) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.07 }}
                        className="flex items-center gap-2"
                      >
                        <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="text-[11px] text-white/45 font-light" style={{ fontFamily: 'Poppins, sans-serif' }}>{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Práticas por condição — tabs se tiver mais de uma */}
          <AnimatePresence>
            {phase >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/20 text-[10px] tracking-[4px] uppercase" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Comece por aqui
                  </p>
                  {detectedKeys.length > 1 && (
                    <div className="flex gap-1">
                      {detectedKeys.map((k, i) => (
                        <button
                          key={k}
                          onClick={() => setActiveTab(i)}
                          className="w-6 h-6 rounded-full text-[9px] font-bold transition-all"
                          style={{
                            background: activeTab === i ? PATTERN_COLOR[k] : 'rgba(255,255,255,0.06)',
                            color: activeTab === i ? '#080808' : '#555',
                          }}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-2.5"
                  >
                    {(PRACTICES[detectedKeys[activeTab]] || practices).map((p, i) => (
                      <motion.button
                        key={p.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        onClick={() => router.push(p.href)}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-start gap-4 px-5 py-4 rounded-2xl text-left relative overflow-hidden"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '0.5px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <span className="text-xl font-light mt-0.5 w-5 text-center flex-shrink-0" style={{ color: PATTERN_COLOR[detectedKeys[activeTab]] || color }}>
                          {p.icon}
                        </span>
                        <div className="flex flex-col gap-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{p.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full text-white/30" style={{ background: 'rgba(255,255,255,0.05)', fontFamily: 'Poppins, sans-serif' }}>
                              {p.duration}
                            </span>
                          </div>
                          <span className="text-[11px] text-white/35 font-light leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {p.desc}
                          </span>
                        </div>
                        <span className="text-white/20 mt-1 flex-shrink-0">›</span>
                      </motion.button>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Inteligência neuroemocional */}
          <AnimatePresence>
            {phase >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="rounded-2xl p-5 mb-6"
                style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-white/20 text-[10px] tracking-[4px] uppercase mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  O que você vai desenvolver
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { icon: '◎', label: 'Identidade emocional', desc: 'Conhecer seus padrões de resposta ao longo do tempo' },
                    { icon: '⌁', label: 'Inteligência neuroemocional', desc: 'Reconhecer, nomear e regular emoções com precisão' },
                    { icon: '◈', label: 'Autoconhecimento profundo', desc: 'Entender quem você é e como vai mudando' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                      className="flex items-start gap-3"
                    >
                      <span className="text-white/25 text-base mt-0.5">{item.icon}</span>
                      <div>
                        <p className="text-white/70 text-xs font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>{item.label}</p>
                        <p className="text-white/25 text-[11px] font-light" style={{ fontFamily: 'Poppins, sans-serif' }}>{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <AnimatePresence>
            {phase >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-col gap-3"
              >
                <motion.button
                  onClick={() => router.replace('/home')}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-full font-semibold text-sm tracking-wider uppercase relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg,#FFFFFF 0%,#D0D0D0 100%)',
                    color: '#080808',
                    boxShadow: '0 0 50px rgba(255,255,255,0.15)',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <motion.div className="absolute inset-0 bg-white/20"
                    initial={{ x: '-100%' }} whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }} />
                  <span className="relative">Abrir meu CARE</span>
                </motion.button>

                <button
                  onClick={() => router.push('/checkin')}
                  className="w-full py-3 rounded-full text-sm font-medium text-white/40 transition-all hover:text-white/70"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Fazer primeiro check-in agora →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}
