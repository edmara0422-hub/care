const VAPID_PUBLIC = 'BG8PY7g7YJX1Ca_S7PINbzdyjLLIsrsICI191zbsfWogJMsHDQD-NIt7QV7jIt-LeFbyPnrlZwvp7OZPJN2odrk'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    return reg
  } catch {
    return null
  }
}

export async function subscribePush(userId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  try {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    })

    // Salva subscription no servidor
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subscription: sub.toJSON() }),
    })
    return true
  } catch {
    return false
  }
}

export async function unsubscribePush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  await sub?.unsubscribe()
}

export function getPushSupport(): 'supported' | 'ios-pwa-only' | 'unsupported' {
  if (!('serviceWorker' in navigator)) return 'unsupported'
  if (!('PushManager' in window)) {
    // iOS só suporta push quando instalado como PWA (iOS 16.4+)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    return isIOS ? 'ios-pwa-only' : 'unsupported'
  }
  return 'supported'
}

export function isInstalledPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
}
