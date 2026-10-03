'use client'

import { useState, useEffect } from 'react'

export default function EnableNotificationsButton() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Vérifier si les notifications sont supportées et déjà activées
    if ('Notification' in window && 'serviceWorker' in navigator) {
      if (Notification.permission === 'granted') {
        setIsSubscribed(true)
      }
    }
    setLoading(false)
  }, [])

  async function handleSubscribe() {
    setLoading(true)
    try {
      // Demander la permission au navigateur
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        // Enregistrer le Service Worker et récupérer l'abonnement Push
        const registration = await navigator.serviceWorker.ready
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        
        // Convertir la clé VAPID pour le navigateur
        const convertedKey = urlBase64ToUint8Array(publicVapidKey)
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        })

        // Envoyer l'abonnement à ta base de données Supabase
        await fetch('/api/save-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        })

        setIsSubscribed(true)
      }
    } catch (err) {
      console.error('Erreur lors de l\'activation des notifications :', err)
    } finally {
      setLoading(false)
    }
  }

  // Fonction utilitaire pour convertir la clé VAPID
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Si l'utilisateur est déjà abonné ou si le chargement est en cours, on ne montre rien (ou un message discret)
  if (loading) return null
  if (isSubscribed) {
    return (
      <div className="text-xs text-green-600 font-medium bg-green-50 p-3 rounded-lg border border-green-200">
        ✅ Notifications activées sur cet appareil.
      </div>
    )
  }

  return (
    <button
      onClick={handleSubscribe}
      className="bg-purple-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition cursor-pointer"
    >
      Activer les notifications 🔔
    </button>
  )
}