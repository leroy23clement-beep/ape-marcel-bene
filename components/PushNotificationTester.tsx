'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PushNotificationTester() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const supabase = createClient()

  // Forcer l'abonnement manuellement au clic sur le bouton
  const handleSubscribeDevice = async () => {
    setLoading(true)
    setStatus(null)

    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error("Les notifications push ne sont pas supportées par ce navigateur.")
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error("L'autorisation des notifications a été refusée ou bloquée par le navigateur.")
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error("Clé VAPID publique introuvable.")
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("Utilisateur non connecté.")
      }

      const subJson = subscription.toJSON()

      // Une ligne par appareil : `device_endpoint` (colonne écrite par le code).
      // `endpoint` est générée par la base, donc en lecture seule.
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        device_endpoint: subscription.endpoint,
        subscription: subJson,
      }, { onConflict: 'device_endpoint' })

      if (error) throw error

      setStatus('✅ Appareil enregistré avec succès dans Supabase ! 🎉')
    } catch (err: any) {
      console.error(err)
      setStatus(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSendTest = async () => {
    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🔔 Test Notification APE',
          message: 'Les notifications fonctionnent parfaitement !'
        })
      })

      const data = await res.json()

      if (data.success) {
        setStatus(`✅ Notification envoyée avec succès à ${data.sentCount} appareil(s) !`)
      } else {
        setStatus(`⚠️ ${data.message || 'Erreur lors de l’envoi.'}`)
      }
    } catch (err) {
      setStatus('❌ Impossible de joindre l’API de notification.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <span>📲</span> Notifications Push Parents
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Gérez l'abonnement de votre appareil et testez l'envoi instantané.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSubscribeDevice}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-xs py-2.5 px-4 rounded-xl transition cursor-pointer shadow-sm"
          >
            S'abonner sur cet appareil
          </button>

          <button
            onClick={handleSendTest}
            disabled={loading}
            className="bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-medium text-xs py-2.5 px-4 rounded-xl transition cursor-pointer shadow-sm"
          >
            Envoyer un test
          </button>
        </div>
      </div>

      {status && (
        <div className="text-xs font-medium p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
          {status}
        </div>
      )}
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}