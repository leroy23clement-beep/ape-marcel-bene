'use client'

import { useState } from 'react'

export default function PushNotificationButton() {
  const [status, setStatus] = useState<string>('')

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert("Ce navigateur ne supporte pas les notifications push.")
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setStatus('Notifications activées avec succès !')
        
        // Enregistrement du Service Worker
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/sw.js')
          console.log('Service Worker enregistré avec succès:', registration)
        }
      } else {
        setStatus('Permission refusée pour les notifications.')
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission :', error)
      setStatus('Une erreur est survenue.')
    }
  }

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-bold text-sm text-gray-800">Notifications mobiles</h4>
          <p className="text-xs text-gray-500">Recevez des alertes pour les nouveaux événements et messages.</p>
        </div>
        <button
          onClick={requestPermission}
          className="bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-purple-800 transition cursor-pointer"
        >
          Activer les notifications
        </button>
      </div>
      {status && <p className="text-xs font-medium text-purple-700">{status}</p>}
    </div>
  )
}