'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Mode = 'login' | 'signup' | 'reset'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const submit = async () => {
    setLoading(true)
    setError(null)

    if (!supabase) { setError('Supabase não configurado.'); setLoading(false); return }
    const sb = supabase

    if (mode === 'reset') {
      if (!email.trim()) { setError('Digite seu email.'); setLoading(false); return }
      const { error: err } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      })
      if (err) { setError(err.message); setLoading(false); return }
      setSent(true)
      setLoading(false)
      return
    }

    if (!email.trim() || !password.trim()) { setLoading(false); return }

    if (mode === 'signup') {
      const { error: err } = await sb.auth.signUp({ email, password })
      if (err) { setError(err.message); setLoading(false); return }
      setSent(true)
      setLoading(false)
      return
    }

    // login
    const { error: err } = await sb.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : err.message); setLoading(false); return }
    router.replace('/home')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 35% at 50% 0%, rgba(0,212,160,0.07) 0%, transparent 60%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[360px] flex flex-col gap-6"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <motion.div
            animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3.5, repeat: Infinity }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{ background: 'rgba(0,212,160,0.1)', border: '0.5px solid rgba(0,212,160,0.25)', color: '#00D4A0' }}>
            C
          </motion.div>
          <p className="text-[11px] uppercase tracking-[3px]" style={{ color: '#404040' }}>CARE</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl px-6 py-8 flex flex-col gap-5"
          style={{
            background: 'rgba(10,10,10,0.7)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '0.5px solid rgba(255,255,255,0.07)',
          }}>

          {/* Mode toggle */}
          {mode !== 'reset' && (
            <div className="flex rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
              {(['login', 'signup'] as Mode[]).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(null); setSent(false) }}
                  className="flex-1 py-2.5 text-sm font-medium transition-all"
                  style={{
                    background: mode === m ? 'rgba(255,255,255,0.09)' : 'transparent',
                    color: mode === m ? '#fff' : '#505050',
                  }}>
                  {m === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              ))}
            </div>
          )}
          {mode === 'reset' && (
            <div className="flex items-center gap-2">
              <button onClick={() => { setMode('login'); setError(null); setSent(false) }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth={2} strokeLinecap="round">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
              </button>
              <p className="text-sm font-medium text-white">Redefinir senha</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3 py-4 text-center">
                <span className="text-3xl">📬</span>
                <p className="text-white font-medium">
                  {mode === 'reset' ? 'Link enviado!' : 'Verifique seu email'}
                </p>
                <p className="text-[13px] font-light" style={{ color: '#606060' }}>
                  {mode === 'reset'
                    ? <>Enviamos um link para redefinir sua senha em <span style={{ color: '#fff' }}>{email}</span>.</>
                    : <>Enviamos um link de confirmação para <span style={{ color: '#fff' }}>{email}</span>. Clique no link para ativar sua conta.</>
                  }
                </p>
                <button onClick={() => { setSent(false); setMode('login') }}
                  className="text-[12px] mt-2" style={{ color: '#00D4A0' }}>
                  {mode === 'reset' ? 'Voltar ao login' : 'Já confirmei → Entrar'}
                </button>
              </motion.div>
            ) : (
              <motion.div key="form"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-widest" style={{ color: '#505050' }}>Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.09)', caretColor: '#fff' }}
                  />
                </div>
                {mode !== 'reset' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest" style={{ color: '#505050' }}>Senha</label>
                    <input
                      type="password" value={password} onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submit()}
                      placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.09)', caretColor: '#fff' }}
                    />
                  </div>
                )}

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-[12px] px-3 py-2 rounded-xl"
                    style={{ color: '#FF4466', background: 'rgba(255,68,102,0.08)' }}>
                    {error}
                  </motion.p>
                )}

                <button onClick={submit}
                  disabled={loading || !email.trim() || (mode !== 'reset' && !password.trim())}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold mt-1 transition-all"
                  style={{
                    background: !loading && email.trim() && (mode === 'reset' || password.trim()) ? '#FFFFFF' : 'rgba(255,255,255,0.07)',
                    color: !loading && email.trim() && (mode === 'reset' || password.trim()) ? '#0A0A0A' : '#404040',
                  }}>
                  {loading ? '...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}
                </button>

                {mode === 'login' && (
                  <button onClick={() => { setMode('reset'); setError(null) }}
                    className="text-[11px] text-center mt-1"
                    style={{ color: '#404040' }}>
                    Esqueceu a senha?
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px]" style={{ color: '#303030' }}>
          CARE não compartilha seus dados · Criptografado via Supabase
        </p>
      </motion.div>
    </div>
  )
}
