'use client'

import { useEffect, useState } from 'react'

type Status = 'checking' | 'unsupported' | 'denied' | 'idle' | 'subscribing' | 'subscribed'
type SaveResult = 'ok' | 'unauthorized' | 'error'

// L’abonnement est renvoyé au serveur au plus une fois par jour (par appareil)
const LAST_SYNC_KEY = 'push-last-sync'
const SYNC_EVERY_MS = 24 * 60 * 60 * 1000

/** Convertit la clé VAPID publique (base64 URL) au format attendu par le navigateur. */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(new ArrayBuffer(rawData.length))
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

/** Enregistre le service worker (sans effet s’il l’est déjà) et attend qu’il soit actif. */
async function getRegistration() {
  await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  return navigator.serviceWorker.ready
}

async function saveSubscription(subscription: PushSubscription): Promise<SaveResult> {
  try {
    const res = await fetch('/api/save-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    })
    if (res.ok) return 'ok'
    return res.status === 401 ? 'unauthorized' : 'error'
  } catch {
    return 'error'
  }
}

function needsSync(): boolean {
  try {
    const last = Number(localStorage.getItem(LAST_SYNC_KEY) ?? 0)
    return Date.now() - last > SYNC_EVERY_MS
  } catch {
    return true
  }
}

function markSynced() {
  try {
    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()))
  } catch {
    // stockage indisponible : sans conséquence
  }
}

export default function EnableNotificationsButton() {
  const [status, setStatus] = useState<Status>('checking')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      const supported =
        'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

      if (!supported) {
        setStatus('unsupported')
        return
      }
      if (Notification.permission === 'denied') {
        setStatus('denied')
        return
      }

      try {
        // On vérifie l’abonnement réel, pas seulement l’autorisation du navigateur
        const registration = await getRegistration()
        const existing = await registration.pushManager.getSubscription()
        if (cancelled) return

        if (existing && Notification.permission === 'granted') {
          setStatus('subscribed')
          if (needsSync() && (await saveSubscription(existing)) === 'ok') markSynced()
        } else {
          setStatus('idle')
        }
      } catch (err) {
        console.error('Erreur lors de la vérification des notifications :', err)
        if (!cancelled) setStatus('idle')
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubscribe() {
    setStatus('subscribing')
    setError(null)

    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY manquante')

      const permission = await Notification.requestPermission()
      if (permission === 'denied') {
        setStatus('denied')
        return
      }
      if (permission !== 'granted') {
        // fenêtre fermée sans choix : on laisse le bouton disponible
        setStatus('idle')
        return
      }

      const registration = await getRegistration()
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }))

      const result = await saveSubscription(subscription)
      if (result === 'unauthorized') {
        setError('Connecte-toi pour activer les notifications.')
        setStatus('idle')
        return
      }
      if (result !== 'ok') throw new Error('Enregistrement de l’abonnement impossible')

      markSynced()
      setStatus('subscribed')
    } catch (err) {
      console.error('Erreur lors de l’activation des notifications :', err)
      setError('Impossible d’activer les notifications pour le moment. Réessaie plus tard.')
      setStatus('idle')
    }
  }

  if (status === 'checking') return null

  if (status === 'unsupported') {
    return (
      <p className="text-xs text-gray-500 max-w-[240px]">
        Notifications indisponibles sur ce navigateur (sur iPhone : ajoute d’abord le site à
        l’écran d’accueil).
      </p>
    )
  }

  if (status === 'denied') {
    return (
      <p className="text-xs text-gray-500 max-w-[240px]">
        Notifications bloquées : autorise-les dans les réglages de ton navigateur.
      </p>
    )
  }

  if (status === 'subscribed') {
    return (
      <div className="text-xs text-green-600 font-medium bg-green-50 p-3 rounded-lg border border-green-200">
        ✅ Notifications activées sur cet appareil.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleSubscribe}
        disabled={status === 'subscribing'}
        className="bg-purple-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition cursor-pointer disabled:opacity-60 disabled:cursor-wait"
      >
        {status === 'subscribing' ? 'Activation…' : 'Activer les notifications 🔔'}
      </button>
      {error && <p className="text-xs text-red-600 max-w-[240px]">{error}</p>}
    </div>
  )
}
