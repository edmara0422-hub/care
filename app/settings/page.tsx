'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCareStore, CheckInSchedule, DetectionMethod, WellnessGoal } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { subscribePush, unsubscribePush } from '@/lib/push'

export default function SettingsPage() {
  const router = useRouter()
  const store = useCareStore()
  const [name, setName] = useState(store.userName)
  const [email, setEmail] = useState(store.userEmail)
  const [saved, setSaved] = useState(false)
  const [showClear, setShowClear] = useState(false)
  const [showClearChat, setShowClearChat] = useState(false)
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle')

  useEffect(() => {
    if (typeof Notification === 'undefined') { setNotifStatus('unsupported'); return }
    if (Notification.permission === 'granted') setNotifStatus('granted')
    else if (Notification.permission === 'denied') setNotifStatus('denied')
  }, [])

  function save() {
    store.setUserName(name.trim())
    store.setUserEmail(email.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleSchedule(s: CheckInSchedule) {
    const cur = store.checkInSchedule
    const next = cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]
    if (next.length > 0) store.setCheckInSchedule(next)
  }

  function toggleMethod(m: DetectionMethod) {
    const cur = store.detectionMethods
    const next = cur.includes(m) ? cur.filter(x => x !== m) : [...cur, m]
    store.setDetectionMethods(next)
  }

  function toggleGoal(g: WellnessGoal) {
    const cur = store.wellnessGoals
    const next = cur.includes(g) ? cur.filter(x => x !== g) : [...cur, g]
    store.setWellnessGoals(next)
  }

  async function handleNotificationToggle() {
    if (typeof Notification === 'undefined') return
    if (store.notificationsEnabled) {
      store.setNotificationsEnabled(false)
      await unsubscribePush()
      return
    }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setNotifStatus('granted')
      store.setNotificationsEnabled(true)
      // Registra push subscription para notificações em background
      if (store.userId) await subscribePush(store.userId)
      new Notification('CARE', {
        body: 'Lembretes ativados! Vou te avisar nos horários configurados.',
        silent: false,
      })
    } else {
      setNotifStatus('denied')
    }
  }

  const scheduleOptions: { key: CheckInSchedule; label: string; time: string; icon: string }[] = [
    { key: 'manha', label: 'Manhã', time: '08:00', icon: '🌅' },
    { key: 'tarde', label: 'Tarde', time: '14:00', icon: '☀️' },
    { key: 'noite', label: 'Noite', time: '21:00', icon: '🌙' },
  ]

  const methodOptions: { key: DetectionMethod; label: string; desc: string; icon: string; where: string }[] = [
    { key: 'microfone', label: 'Microfone', desc: 'Nível e padrão de voz', icon: '🎙️', where: 'Padrões' },
    { key: 'acelerometro', label: 'Movimento', desc: 'Agitação e padrão motor', icon: '📱', where: 'Padrões' },
    { key: 'digitacao', label: 'Digitação', desc: 'Ritmo e pressão do toque', icon: '⌨️', where: 'Padrões' },
    { key: 'camera_frontal', label: 'Câmera frontal', desc: 'Frequência cardíaca (rPPG)', icon: '🫀', where: 'Padrões' },
    { key: 'camera_traseira', label: 'Câmera traseira', desc: 'Pulso via flash LED', icon: '📷', where: 'Padrões' },
  ]

  const goalOptions: { key: WellnessGoal; label: string; icon: string }[] = [
    { key: 'ansiedade', label: 'Ansiedade', icon: '🌊' },
    { key: 'estresse', label: 'Estresse', icon: '🔥' },
    { key: 'sono', label: 'Sono', icon: '🌙' },
    { key: 'foco', label: 'Foco', icon: '🎯' },
    { key: 'burnout', label: 'Burnout', icon: '⚡' },
    { key: 'depressao', label: 'Depressão', icon: '🌧' },
  ]

  return (
    <div className="min-h-screen pb-32" style={{ color: '#fff' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-6 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-semibold">Configurações</h1>
          <p className="text-xs" style={{ color: '#555' }}>Personalize sua experiência</p>
        </div>
      </div>

      <div className="px-5 space-y-4">

        {/* ── Perfil ── */}
        <Section title="Seu perfil" icon="👤">
          <div className="space-y-3">
            <Field label="Nome">
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Como você quer ser chamado?"
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
            </Field>
            <Field label="E-mail">
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" type="email"
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
            </Field>
            <motion.button whileTap={{ scale: 0.96 }} onClick={save}
              className="w-full py-3 rounded-2xl text-sm font-medium"
              style={{ background: saved ? '#00D4A0' : 'rgba(0,212,160,0.12)', color: saved ? '#000' : '#00D4A0', transition: 'all 0.25s' }}>
              {saved ? '✓ Salvo!' : 'Salvar'}
            </motion.button>
          </div>
        </Section>

        {/* ── Focos ── */}
        <Section title="Focos de bem-estar" icon="🎯">
          <p className="text-xs mb-4 text-center" style={{ color: '#555' }}>Selecione as áreas que quer trabalhar</p>
          <div className="grid grid-cols-3 gap-2">
            {goalOptions.map(({ key, label, icon }) => {
              const active = store.wellnessGoals.includes(key)
              return (
                <motion.button key={key} whileTap={{ scale: 0.92 }} onClick={() => toggleGoal(key)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-medium"
                  style={{
                    background: active ? 'rgba(0,212,160,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(0,212,160,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    color: active ? '#00D4A0' : '#555',
                  }}>
                  <span className="text-xl">{icon}</span>
                  <span>{label}</span>
                </motion.button>
              )
            })}
          </div>
        </Section>

        {/* ── Horários ── */}
        <Section title="Horários de check-in" icon="🔔">
          <p className="text-xs mb-3" style={{ color: '#555' }}>Quando quer ser lembrado de fazer check-in</p>
          <div className="space-y-2">
            {scheduleOptions.map(({ key, label, time, icon }) => {
              const active = store.checkInSchedule.includes(key)
              return (
                <motion.button key={key} whileTap={{ scale: 0.98 }} onClick={() => toggleSchedule(key)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl"
                  style={{
                    background: active ? 'rgba(0,212,160,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active ? 'rgba(0,212,160,0.25)' : 'rgba(255,255,255,0.05)'}`,
                  }}>
                  <div className="flex items-center gap-3">
                    <span className="text-base">{icon}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium" style={{ color: active ? '#00D4A0' : '#aaa' }}>{label}</p>
                      <p className="text-xs" style={{ color: '#444' }}>{time}</p>
                    </div>
                  </div>
                  <Toggle active={active} />
                </motion.button>
              )
            })}
          </div>
        </Section>

        {/* ── Sensores ── */}
        <Section title="Sensores de detecção" icon="📡">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs" style={{ color: '#555' }}>Ativos na aba <span style={{ color: '#7B8FF8' }}>Padrões</span> — dados processados localmente</p>
            <Link href="/sensors"
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: 'rgba(123,143,248,0.12)', color: '#7B8FF8' }}>
              Abrir →
            </Link>
          </div>
          <div className="space-y-2">
            {methodOptions.map(({ key, label, desc, icon }) => {
              const active = store.detectionMethods.includes(key)
              return (
                <motion.button key={key} whileTap={{ scale: 0.98 }} onClick={() => toggleMethod(key)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl"
                  style={{
                    background: active ? 'rgba(123,143,248,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active ? 'rgba(123,143,248,0.25)' : 'rgba(255,255,255,0.05)'}`,
                  }}>
                  <div className="flex items-center gap-3">
                    <span className="text-base">{icon}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium" style={{ color: active ? '#7B8FF8' : '#aaa' }}>{label}</p>
                      <p className="text-xs" style={{ color: '#444' }}>{desc}</p>
                    </div>
                  </div>
                  <Toggle active={active} color="#7B8FF8" />
                </motion.button>
              )
            })}
          </div>
          <p className="text-[11px] mt-3 text-center" style={{ color: '#333' }}>
            Permissões pedidas ao abrir cada sensor na aba Padrões
          </p>
        </Section>

        {/* ── Notificações ── */}
        <Section title="Notificações" icon="📳">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 mr-4">
              <p className="text-sm font-medium">Lembretes de check-in</p>
              <p className="text-xs mt-0.5" style={{ color: '#444' }}>
                {notifStatus === 'denied'
                  ? '🔴 Bloqueado nas configurações do browser'
                  : notifStatus === 'unsupported'
                  ? 'Não suportado neste browser'
                  : store.notificationsEnabled
                  ? '🟢 Ativo — notificações nos horários configurados'
                  : 'Notificações do browser nos horários acima'}
              </p>
            </div>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={handleNotificationToggle}
              disabled={notifStatus === 'denied' || notifStatus === 'unsupported'}
              className="relative w-12 h-6 rounded-full flex-shrink-0"
              style={{
                background: store.notificationsEnabled ? '#00D4A0' : 'rgba(255,255,255,0.1)',
                opacity: (notifStatus === 'denied' || notifStatus === 'unsupported') ? 0.4 : 1,
              }}>
              <motion.div
                animate={{ x: store.notificationsEnabled ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 600, damping: 35 }}
                className="absolute top-0.5 w-5 h-5 rounded-full"
                style={{ background: '#fff' }} />
            </motion.button>
          </div>
          {notifStatus === 'denied' && (
            <p className="text-xs p-3 rounded-xl" style={{ background: 'rgba(255,68,102,0.08)', color: '#FF6B6B' }}>
              Para ativar: abra as configurações do seu browser → Permissões → Notificações → Permitir para este site.
            </p>
          )}
        </Section>

        {/* ── Seus dados ── */}
        <Section title="Seus dados" icon="📊">
          <div className="space-y-2">
            {[
              { label: 'Ver conquistas', href: '/achievements', color: '#FFB800', icon: '🏆' },
              { label: 'Relatório para terapeuta', href: '/report', color: '#7B8FF8', icon: '📋' },
              { label: 'Histórico de sono', href: '/sleep', color: '#3A86FF', icon: '🌙' },
              { label: 'Seu perfil emocional', href: '/profile', color: '#00D4A0', icon: '🧠' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center justify-between px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span className="text-sm" style={{ color: item.color }}>{item.label}</span>
                </div>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
              </Link>
            ))}
          </div>
        </Section>

        {/* ── Zona de risco ── */}
        <Section title="Zona de risco" icon="⚠️">
          <div className="space-y-2">
            {showClearChat ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
                style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.15)' }}>
                <span className="flex-1 text-sm" style={{ color: '#FFB800' }}>Limpar histórico do Tutor?</span>
                <button onClick={() => { store.clearChat(); setShowClearChat(false) }}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(255,184,0,0.15)', color: '#FFB800' }}>Sim</button>
                <button onClick={() => setShowClearChat(false)}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#666' }}>Não</button>
              </div>
            ) : (
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => setShowClearChat(true)}
                className="w-full py-3 rounded-2xl text-sm"
                style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.15)', color: '#FFB800' }}>
                Limpar histórico do Tutor
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => setShowClear(true)}
              className="w-full py-3 rounded-2xl text-sm font-medium"
              style={{ background: 'rgba(255,68,102,0.06)', border: '1px solid rgba(255,68,102,0.18)', color: '#FF4466' }}>
              Apagar todos os dados
            </motion.button>
            {supabase && (
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={async () => { await supabase!.auth.signOut(); router.replace('/auth') }}
                className="w-full py-3 rounded-2xl text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#666' }}>
                Sair da conta
              </motion.button>
            )}
          </div>
        </Section>

      </div>

      {/* Confirm dialog */}
      <AnimatePresence>
        {showClear && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-end justify-center z-50 px-5 pb-8"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
            onClick={() => setShowClear(false)}>
            <motion.div
              initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 48, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6"
              style={{ background: '#111', border: '1px solid rgba(255,68,102,0.25)' }}>
              <div className="text-3xl mb-3 text-center">🗑️</div>
              <h3 className="text-lg font-semibold text-center mb-2">Apagar tudo?</h3>
              <p className="text-sm text-center mb-6" style={{ color: '#666' }}>
                Check-ins, sono, conquistas e chat serão removidos permanentemente.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowClear(false)}
                  className="flex-1 py-3 rounded-2xl text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#888' }}>
                  Cancelar
                </button>
                <button onClick={() => { store.clearData(); setShowClear(false) }}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                  style={{ background: 'rgba(255,68,102,0.18)', color: '#FF4466' }}>
                  Apagar tudo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.055)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span>{icon}</span>
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#444' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs mb-1.5" style={{ color: '#555' }}>{label}</p>
      {children}
    </div>
  )
}

function Toggle({ active, color = '#00D4A0' }: { active: boolean; color?: string }) {
  return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: active ? color : 'rgba(255,255,255,0.06)', transition: 'background 0.15s' }}>
      {active && (
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={3.5} strokeLinecap="round">
          <polyline points="20,6 9,17 4,12" />
        </svg>
      )}
    </div>
  )
}
