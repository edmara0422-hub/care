'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { registerSW, isInstalledPWA } from '@/lib/push'

export default function PWASetup() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  const [showIOSBanner, setShowIOSBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Registra service worker
    registerSW()

    // Já está instalado — não mostra banner
    if (isInstalledPWA()) return

    // Android — captura o evento de instalação
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS — mostra instrução manual (Safari só deixa instalar via "Adicionar à Tela Início")
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    const alreadyDismissed = localStorage.getItem('care-pwa-dismissed')
    if (isIOS && isSafari && !alreadyDismissed) {
      setTimeout(() => setShowIOSBanner(true), 3000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const installAndroid = async () => {
    if (!installPrompt) return
    const prompt = installPrompt as unknown as { prompt: () => void; userChoice: Promise<{ outcome: string }> }
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstallPrompt(null)
  }

  const dismiss = () => {
    setDismissed(true)
    setShowIOSBanner(false)
    localStorage.setItem('care-pwa-dismissed', '1')
  }

  if (dismissed) return null

  return (
    <AnimatePresence>
      {/* Android install banner */}
      {installPrompt && (
        <motion.div
          key="android"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-24 left-4 right-4 z-[100] rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(10,10,10,0.95)', border: '0.5px solid rgba(0,212,160,0.3)', backdropFilter: 'blur(24px)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
            style={{ background: 'rgba(0,212,160,0.15)', color: '#00D4A0' }}>C</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Instalar CARE</p>
            <p className="text-[11px]" style={{ color: '#606060' }}>Acesso rápido e notificações</p>
          </div>
          <button onClick={installAndroid}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0"
            style={{ background: '#00D4A0', color: '#080808' }}>
            Instalar
          </button>
          <button onClick={dismiss} className="text-lg leading-none" style={{ color: '#404040' }}>×</button>
        </motion.div>
      )}

      {/* iOS install instructions */}
      {showIOSBanner && (
        <motion.div
          key="ios"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-24 left-4 right-4 z-[100] rounded-2xl p-4"
          style={{ background: 'rgba(10,10,10,0.95)', border: '0.5px solid rgba(0,212,160,0.3)', backdropFilter: 'blur(24px)' }}
        >
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-semibold text-white">Instalar no iPhone</p>
            <button onClick={dismiss} className="text-lg leading-none" style={{ color: '#404040' }}>×</button>
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: '#707070' }}>
            Toque em{' '}
            <span className="text-white font-medium">
              <svg className="inline w-3.5 h-3.5 mx-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
              Compartilhar
            </span>{' '}
            no Safari e depois em{' '}
            <span className="text-white font-medium">"Adicionar à Tela Início"</span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
