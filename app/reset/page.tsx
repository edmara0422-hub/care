'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCareStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

export default function ResetPage() {
  const router = useRouter()
  const clearData = useCareStore(s => s.clearData)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!confirmed) return
    clearData()
    supabase?.auth.signOut()
    localStorage.removeItem('care-storage')
    router.replace('/')
  }, [confirmed, router, clearData])

  if (!confirmed) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 w-full max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'rgba(255,68,102,0.1)', border: '0.5px solid rgba(255,68,102,0.3)' }}>
            🗑️
          </div>
          <div className="text-center">
            <h2 className="font-bold text-white text-2xl mb-2">Resetar tudo?</h2>
            <p className="text-sm font-light leading-relaxed" style={{ color: '#606060' }}>
              Todos os dados serão apagados permanentemente. Essa ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button onClick={() => setConfirmed(true)}
              className="w-full py-4 rounded-full font-semibold text-sm"
              style={{ background: 'rgba(255,68,102,0.12)', color: '#FF4466', border: '0.5px solid rgba(255,68,102,0.3)' }}>
              Sim, apagar tudo
            </button>
            <button onClick={() => router.back()}
              className="w-full py-4 rounded-full font-semibold text-sm"
              style={{ color: '#505050' }}>
              Cancelar
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <p className="text-white/30 text-sm tracking-widest">Resetando...</p>
    </div>
  )
}
