import { useState, useEffect } from 'react'
import { useCareStore } from './store'

/**
 * Returns true once the Zustand persist store has finished rehydrating from localStorage.
 * Safe to call during SSR — always returns false on the server.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Only runs on the client
    if (useCareStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    const unsub = useCareStore.persist.onFinishHydration(() => setHydrated(true))
    return unsub
  }, [])

  return hydrated
}
