'use client'

import { useState } from 'react'
import { sendPushNotification } from '@/lib/actions/push'

export default function SendNotificationForm() {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)

    const formData = new FormData(event.currentTarget)
    const result = await sendPushNotification(formData)

    setLoading(false)
    setFeedback(result.message)

    if (result.success) {
      event.currentTarget.reset()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 shadow-sm space-y-4 max-w-xl">
      <h3 className="font-bold text-base text-gray-900">Envoyer une notification push</h3>
      
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">Destinataires</label>
        <select 
          name="target" 
          required
          className="w-full p-2 border rounded-md text-sm text-gray-900 bg-white"
        >
          <option value="all">Tout le monde (Tous les parents abonnés)</option>
          <option value="bureau">Membres du Bureau (Admin, Président, Bureau, etc.)</option>
          <option value="restricted">Restreint (Trésorier, Secrétaire & Toi)</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">Titre de l'alerte</label>
        <input
          type="text"
          name="title"
          placeholder="Ex: Vente de jus de pomme 🍎"
          required
          className="w-full p-2 border rounded-md text-sm text-gray-900"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">Message</label>
        <textarea
          name="body"
          placeholder="Ex: Les commandes sont ouvertes sur la boutique !"
          rows={3}
          required
          className="w-full p-2 border rounded-md text-sm text-gray-900"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-700 text-white text-sm font-semibold py-2 rounded-lg hover:bg-purple-800 transition cursor-pointer disabled:opacity-50"
      >
        {loading ? "Envoi en cours..." : "Diffuser la notification 🚀"}
      </button>

      {feedback && (
        <p className={`text-xs font-medium ${feedback.includes('succès') ? 'text-green-600' : 'text-red-600'}`}>
          {feedback}
        </p>
      )}
    </form>
  )
}