/* Service worker de l’APE Marcel Béné : réception des notifications push.
   Pas de cache ni d’interception des requêtes : il ne sert qu’aux notifications. */

const DEFAULT_TITLE = 'APE Marcel Béné'
const DEFAULT_BODY = 'Nouvelle notification de l’association'
const ICON = '/icon-192.png'

// Activation immédiate : pas besoin de recharger la page après une mise à jour
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

/** N’accepte que des chemins internes au site (jamais de lien externe). */
function safeUrl(value) {
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) {
    return value
  }
  return '/'
}

// Réception d’une notification
self.addEventListener('push', (event) => {
  let data = {}

  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data = { body: event.data.text() }
    }
  }

  const title = typeof data.title === 'string' && data.title ? data.title : DEFAULT_TITLE
  const body = typeof data.body === 'string' && data.body ? data.body : DEFAULT_BODY

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: ICON,
      data: { url: safeUrl(data.url) },
    })
  )
})

// Clic sur la notification : ouvre (ou réutilise) une fenêtre du site à la bonne page
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const target = new URL(
    safeUrl(event.notification.data && event.notification.data.url),
    self.location.origin
  ).href

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          try {
            await client.focus()
            if ('navigate' in client) await client.navigate(target)
            return
          } catch {
            // on retombe sur l’ouverture d’une nouvelle fenêtre
          }
        }
      }

      await self.clients.openWindow(target)
    })()
  )
})

// Le navigateur a renouvelé l’abonnement : on le réenregistre côté serveur
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const options = event.oldSubscription && event.oldSubscription.options
        if (!options || !options.applicationServerKey) return

        const subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: options.applicationServerKey,
        })

        await fetch('/api/save-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(subscription),
        })
      } catch {
        // le bouton de l’interface resynchronisera l’abonnement à la prochaine visite
      }
    })()
  )
})
