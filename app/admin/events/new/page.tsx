'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function NewEventPage() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Champs du formulaire
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    async function checkUserAndAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData || profileData.role !== 'admin') {
        router.push('/events')
      } else {
        setProfile(profileData)
      }
    }
    checkUserAndAdmin()
  }, [router])

  // Fonction pour gérer l'upload du fichier image vers Supabase Storage
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      const file = e.target.files?.[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload dans le bucket Supabase 'events'
      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Récupération de l'URL publique de l'image
      const { data } = supabase.storage
        .from('events')
        .getPublicUrl(filePath)

      setImageUrl(data.publicUrl)
    } catch (error: any) {
      alert("Erreur lors de l'upload de l'image : " + error.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('events').insert([
      {
        title,
        description,
        event_date: eventDate,
        location: location || null,
        image_url: imageUrl || null,
      },
    ])

    setLoading(false)

    if (error) {
      alert("Erreur lors de la création de l'événement : " + error.message)
    } else {
      router.push('/events')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && (
        <Navbar 
          userEmail={user.email} 
          firstName={profile?.first_name} 
          role={profile?.role} 
        />
      )}

      <main className="mx-auto max-w-2xl p-6 space-y-6">
        <div>
          <Link href="/events" className="text-xs font-semibold text-purple-700 hover:underline">
            « Retour aux événements
          </Link>
        </div>

        <div className="bg-white border rounded-2xl p-8 shadow-sm space-y-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Ajouter un nouvel événement</h1>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Titre de l'événement *</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required
                placeholder="Ex: Boum de fin d'année"
                className="w-full p-2.5 border rounded-lg text-gray-900 text-sm"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Date et heure *</label>
              <input 
                type="datetime-local" 
                value={eventDate} 
                onChange={(e) => setEventDate(e.target.value)} 
                required
                className="w-full p-2.5 border rounded-lg text-gray-900 text-sm"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Lieu</label>
              <input 
                type="text" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="Ex: École Marcel Béné, Muizon"
                className="w-full p-2.5 border rounded-lg text-gray-900 text-sm"
              />
            </div>

            {/* Sélecteur de fichier pour l'affiche */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">Affiche de l'événement (Image)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-2 border rounded-lg text-gray-700 text-xs bg-gray-50 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
              />
              {uploading && <p className="text-[11px] text-purple-600 mt-1">Téléchargement de l'image en cours...</p>}
              {imageUrl && !uploading && (
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-green-600 font-medium text-[11px]">✓ Image chargée avec succès</span>
                  <img src={imageUrl} alt="Aperçu" className="h-16 w-auto rounded border object-contain" />
                </div>
              )}
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={5}
                placeholder="Détails complets de l'événement..."
                className="w-full p-2.5 border rounded-lg text-gray-900 text-sm resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link
                href="/events"
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-semibold"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={loading || uploading}
                className="px-5 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition font-semibold cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Création en cours...' : 'Publier l\'événement'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}