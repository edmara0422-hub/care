'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { loadUserData } from '@/lib/db'
import { useCareStore } from '@/lib/store'

const PUBLIC_PATHS = ['/auth', '/']

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { setUserId, hydrateFromDB, clearData } = useCareStore()

  useEffect(() => {
    // No Supabase configured — run in localStorage-only mode, no auth required
    if (!supabase) return
    const sb = supabase

    // Check initial session
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await handleSignIn(session.user.id)
      } else if (!PUBLIC_PATHS.includes(pathname)) {
        router.replace('/auth')
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleSignIn(session.user.id)
        router.replace('/home')
      }
      if (event === 'SIGNED_OUT') {
        clearData()
        setUserId(null)
        router.replace('/auth')
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSignIn(userId: string) {
    setUserId(userId)
    const data = await loadUserData(userId)
    hydrateFromDB(data)
  }

  return <>{children}</>
}
