'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addTeamMember } from '@/app/bureau/team/actions'

/**
 * Formulaire d'ajout d'un membre du bureau.
 *
 * Corrections :
 *  - ligne 60 : `setErrorMsg(err.message ||Une erreur est survenue)` n'avait
 *    pas de guillemets (TS1005) et empêchait le fichier de compiler ;
 *  - l'insertion passait par le client Supabase du navigateur : elle est
 *    maintenant faite par une Server Action qui vérifie le rôle et le type
 *    du fichier photo.
 */
export default function TeamForm() {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget

    setLoading(true)
    setErrorMsg('')

    try {
      const formData = new FormData(form)
      const result = await addTeamMember(formData)
      if (!result.success) throw new Error(result.error ?? 'Erreur lors de l’ajout.')

      form.reset()
      router.refresh()
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : ''
      setErrorMsg(message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Ajouter un membre</h2>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Prénom *</label>
            <input
              type="text"
              name="firstName"
              required
              placeholder="Ex: Clément"
              className="w-full p-2 border rounded-md text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
            <input
              type="text"
              name="lastName"
              required
              placeholder="Ex: Leroy"
              className="w-full p-2 border rounded-md text-sm text-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Rôle affiché *</label>
          <input
            type="text"
            name="roleTitle"
            required
            placeholder="Ex: Trésorière"
            className="w-full p-2 border rounded-md text-sm text-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Photo (facultatif)</label>
          <input
            type="file"
            name="photoFile"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="w-full p-2 border rounded-md text-sm text-gray-900 bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-gray-400 text-white text-sm font-medium py-2 rounded-lg transition cursor-pointer"
        >
          {loading ? 'Ajout en cours...' : 'Ajouter le membre'}
        </button>
      </form>
    </div>
  )
}
