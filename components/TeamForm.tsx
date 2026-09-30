'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function TeamForm() {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const formData = new FormData(e.currentTarget)
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const roleTitle = formData.get('roleTitle') as string
    const photoFile = formData.get('photoFile') as File

    try {
      let photoUrl = null

      // 1. Upload de la photo si présente
      if (photoFile && photoFile.size > 0 && photoFile.name !== 'undefined') {
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('team-photos')
          .upload(fileName, photoFile)

        if (uploadError) throw new Error("Erreur lors de l'upload : " + uploadError.message)

        const { data: publicUrlData } = supabase.storage
          .from('team-photos')
          .getPublicUrl(fileName)

        photoUrl = publicUrlData.publicUrl
      }

      // 2. Insertion dans la base de données
      const { error: insertError } = await supabase.from('bureau_members').insert({
        first_name: firstName,
        last_name: lastName,
        role_title: roleTitle,
        photo_url: photoUrl,
      })

      if (insertError) throw new Error("Erreur d'insertion : " + insertError.message)

      // Réinitialiser le formulaire et rafraîchir la page
      e.currentTarget.reset()
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message ||Une erreur est survenue)
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fonction / Rôle (affiché) *</label>
            <input
              type="text"
              name="roleTitle"
              required
              placeholder="Ex: Président, Trésorier..."
              className="w-full p-2 border rounded-md text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Photo depuis le PC (optionnel)</label>
            <input
              type="file"
              name="photoFile"
              accept="image/*"
              className="w-full p-1.5 border rounded-md text-sm text-gray-900 bg-white file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-700 text-white text-sm py-2 rounded-md hover:bg-purple-800 transition font-medium cursor-pointer disabled:opacity-50"
        >
          {loading ? "Enregistrement en cours..." : "+ Enregistrer le membre"}
        </button>
      </form>
    </div>
  )
}