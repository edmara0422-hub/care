// CARE Service Worker — Push Notifications

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// ── Recebe push do servidor ────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {}
  const title = data.title ?? 'CARE'
  const options = {
    body: data.body ?? 'Como você está se sentindo agora?',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag ?? 'care-notification',
    renotify: true,
    data: { url: data.url ?? '/checkin' },
    actions: [
      { action: 'checkin', title: 'Registrar agora' },
      { action: 'dismiss', title: 'Depois' },
    ],
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

// ── Clique na notificação ──────────────────────────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.action === 'dismiss' ? '/home' : (e.notification.data?.url ?? '/checkin')
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin))
      if (existing) { existing.focus(); existing.navigate(url) }
      else self.clients.openWindow(url)
    })
  )
})
