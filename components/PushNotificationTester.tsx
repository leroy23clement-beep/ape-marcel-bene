'use client'

import { useState } from 'react'

export default function PushNotificationTester() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const handleSendTest = async () => {
    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🔔 Test Notification APE',
          message: 'Les rappels automatiques (J-7 et J-1) sont prêts et opérationnels !'
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
    <div className="bg-white border rounded-xl p-6 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <span>📲</span> Notifications Push Parents
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Testez l'envoi instantané d'une notification sur les appareils des parents abonnés.
          </p>
        </div>

        <button
          onClick={handleSendTest}
          disabled={loading}
          className="bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-medium text-sm py-2.5 px-4 rounded-xl transition cursor-pointer shadow-sm flex items-center gap-2"
        >
          {loading ? 'Envoi en cours...' : 'Envoyer une notif de test'}
        </button>
      </div>

      {status && (
        <div className="text-xs font-medium p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
          {status}
        </div>
      )}
    </div>
  )
}