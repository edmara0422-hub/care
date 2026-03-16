'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCareStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

export default function ResetPage() {
  const router = useRouter()
  const clearData = useCareStore(s => s.clearData)

  useEffect(() => {
    clearData()
    supabase?.auth.signOut()
    localStorage.removeItem('care-storage')
    router.replace('/')
  }, [router, clearData])

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <p className="text-white/30 text-sm tracking-widest" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Resetando...
      </p>
    </div>
  )
}
