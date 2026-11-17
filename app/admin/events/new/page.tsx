'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

/** Convertit une valeur ISO en valeur locale pour `<input type="datetime-local">`. */
function toDateTimeLocal(isoValue: string | null): string {
  if (!isoValue) return ''
  const date = new Date(isoValue)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 Mo

function EventFormContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  // `useSearchParams()` renvoie `string | null` : on normalise tout de suite
  // en chaîne pour que `.eq('id', eventId)` reste typé.
  const eventId = searchParams.get('id') ?? ''

  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [profile, setProfile] = useState<{ first_name?: string | null; role?: string | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  // Contrôle d'accès : réservé aux administrateurs.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  // Si un ID est présent dans l'URL, on charge l'événement pour le pré-remplir.
  useEffect(() => {
    if (!eventId) return

    async function fetchEventToEdit() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (data) {
        setTitle(data.title ?? '')
        setDescription(data.description ?? '')
        // `slice(0, 16)` supposait une valeur ISO en UTC : le champ
        // `datetime-local` affichait une heure décalée de 2 h l'été.
        setEventDate(toDateTimeLocal(data.event_date))
        setLocation(data.location ?? '')
        setImageUrl(data.image_url ?? '')
      } else if (error) {
        alert("Erreur lors du chargement de l'événement : " + error.message)
      }
    }
    fetchEventToEdit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  // Upload de l'affiche vers le bucket 'events-images'.
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      const file = e.target.files?.[0]
      if (!file) return

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        alert('Image refusée : formats acceptés JPG, PNG, WEBP ou GIF.')
        e.target.value = ''
        return
      }
      if (file.size > MAX_IMAGE_BYTES) {
        alert('Image trop lourde (5 Mo maximum).')
        e.target.value = ''
        return
      }

      const fileExt = (file.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const filePath = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('events-images')
        .upload(filePath, file, { contentType: file.type })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('events-images')
        .getPublicUrl(filePath)

      setImageUrl(data.publicUrl)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      alert("Erreur lors de l'upload de l'image : " + message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (!title.trim() || !eventDate) {
        alert('Le titre et la date sont obligatoires.')
        return
      }

      const payload = {
        title: title.trim(),
        description,
        event_date: eventDate,
        location: location || null,
        image_url: imageUrl || null,
      }

      if (eventId) {
        const { error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', eventId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('events').insert([payload])
        if (error) throw error
      }

      router.push('/events')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      alert("Erreur lors de l'enregistrement : " + message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user?.email ?? ''} firstName={profile?.first_name ?? undefined} role={profile?.role ?? undefined} />

      <main className="mx-auto max-w-3xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {eventId ? 'Modifier un événement' : 'Créer un événement'}
          </h1>
          <Link href="/events" className="text-xs text-purple-700 hover:underline">
            ← Retour aux événements
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Titre *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2 border rounded-lg text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date et heure *</label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="w-full p-2 border rounded-lg text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Lieu</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-2 border rounded-lg text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Affiche</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              className="w-full p-2 border rounded-lg text-sm text-gray-900 bg-white"
            />
            {uploading && <p className="text-xs text-gray-500 mt-1">Envoi de l’image…</p>}
            {imageUrl && (
              <p className="text-xs text-emerald-700 mt-1 break-all">Image enregistrée : {imageUrl}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-gray-400 text-white text-sm font-medium py-2 rounded-lg transition cursor-pointer"
          >
            {loading ? 'Enregistrement…' : eventId ? 'Enregistrer les modifications' : 'Créer l’événement'}
          </button>
        </form>
      </main>
    </div>
  )
}

/**
 * `useSearchParams()` doit être sous un `<Suspense>` en Next 16, sinon la page
 * est rendue entièrement côté client sans avertissement.
 */
export default function NewEventPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Chargement...</div>}>
      <EventFormContent />
    </Suspense>
  )
}
