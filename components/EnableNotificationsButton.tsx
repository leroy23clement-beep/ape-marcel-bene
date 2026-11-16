'use client'

import { useEffect, useState } from 'react'

type Status = 'checking' | 'unsupported' | 'denied' | 'idle' | 'subscribing' | 'subscribed'
type SaveResult = 'ok' | 'unauthorized' | 'error'

// L’abonnement est renvoyé au serveur au plus une fois par jour (par appareil)
const LAST_SYNC_KEY = 'push-last-sync'
const SYNC_EVERY_MS = 24 * 60 * 60 * 1000
const SW_TIMEOUT_MS = 10_000

/** Rejette la promesse si elle ne se termine pas à temps (évite un état « en cours » infini). */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} : délai dépassé`)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

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

type KeyBytes = ReturnType<typeof urlBase64ToUint8Array>

/** Enregistre le service worker (sans effet s’il l’est déjà) et attend qu’il soit actif. */
async function getRegistration() {
  await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  return withTimeout(navigator.serviceWorker.ready, SW_TIMEOUT_MS, 'Service worker')
}

/** Vrai si l’abonnement a été créé avec la clé VAPID publique actuelle. */
function usesKey(subscription: PushSubscription, key: Uint8Array): boolean {
  const current = subscription.options?.applicationServerKey
  if (!current) return true // clé inconnue : on ne touche à rien
  const bytes = new Uint8Array(current)
  return bytes.length === key.length && bytes.every((value, i) => value === key[i])
}

/** Réutilise l’abonnement existant s’il correspond à la clé actuelle, sinon en crée un nouveau. */
async function getOrCreateSubscription(registration: ServiceWorkerRegistration, key: KeyBytes) {
  const existing = await registration.pushManager.getSubscription()
  if (existing) {
    if (usesKey(existing, key)) return existing
    // Abonnement créé avec une ancienne clé VAPID : le serveur ne pourrait plus l’utiliser
    await existing.unsubscribe()
  }
  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
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

/** Message affiché à l’utilisateur (le détail technique reste dans la console). */
function friendlyError(err: unknown): string {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return 'Le navigateur n’a pas pu joindre le service de notifications. Vérifie ta connexion et les réglages du navigateur.'
  }
  return 'Impossible d’activer les notifications pour le moment. Réessaie plus tard.'
}

type Props = {
  /** Masque le message vert quand l’appareil était déjà abonné (utile dans la barre de navigation). */
  hideWhenSubscribed?: boolean
}

export default function EnableNotificationsButton({ hideWhenSubscribed = false }: Props) {
  const [status, setStatus] = useState<Status>('checking')
  const [error, setError] = useState<string | null>(null)
  const [justSubscribed, setJustSubscribed] = useState(false)

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
          const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

          // Abonnement lié à une ancienne clé VAPID : on le supprime, l’utilisateur le réactivera
          if (publicKey && !usesKey(existing, urlBase64ToUint8Array(publicKey))) {
            await existing.unsubscribe()
            if (!cancelled) setStatus('idle')
            return
          }

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
      if (!publicKey) {
        throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY absente de ce déploiement (redéployer après l’avoir ajoutée)')
      }
      const key = urlBase64ToUint8Array(publicKey)

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
      const subscription = await getOrCreateSubscription(registration, key)

      const result = await saveSubscription(subscription)
      if (result === 'unauthorized') {
        setError('Connecte-toi pour activer les notifications.')
        setStatus('idle')
        return
      }
      if (result !== 'ok') throw new Error('Enregistrement de l’abonnement impossible')

      markSynced()
      setJustSubscribed(true)
      setStatus('subscribed')
    } catch (err) {
      console.error('Erreur lors de l’activation des notifications :', err)
      setError(friendlyError(err))
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
    // Déjà abonné avant ce chargement : rien à afficher si on est dans la barre de navigation
    if (hideWhenSubscribed && !justSubscribed) return null

    return (
      <div
        role="status"
        className="text-xs text-green-600 font-medium bg-green-50 p-3 rounded-lg border border-green-200"
      >
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
      {error && (
        <p role="alert" className="text-xs text-red-600 max-w-[240px]">
          {error}
        </p>
      )}
    </div>
  )
}
