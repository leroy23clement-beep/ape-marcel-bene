'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function GalleryDetailPage() {
  const params = useParams()
  const galleryId = params.id
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [gallery, setGallery] = useState<any>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(prof)
      }

      // Récupérer la galerie
      const { data: galleryData } = await supabase
        .from('event_galleries')
        .select('*, events(title)')
        .eq('id', galleryId)
        .single()

      if (galleryData) {
        setGallery(galleryData)
        // Récupérer les photos associées
        const { data: photosData } = await supabase
          .from('event_photos')
          .select('*')
          .eq('gallery_id', galleryId)
          .order('created_at', { ascending: false })
        setPhotos(photosData || [])
      }
      setLoading(false)
    }
    loadData()
  }, [galleryId])

  const isAdminOrBureau = profile?.role && profile.role !== 'parent'

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    setUploading(true)

    const files = Array.from(e.target.files)
    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36.substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `${galleryId}/${fileName}`

      // Upload dans le bucket Supabase 'event-galleries'
      const { error: uploadError } = await supabase.storage
        .from('event-galleries')
        .upload(filePath, file)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('event-galleries')
          .getPublicUrl(filePath)

        // Enregistrer l'URL dans la table event_photos
        await supabase.from('event_photos').insert({
          gallery_id: galleryId,
          image_url: publicUrl
        })
      }
    }

    // Recharger les photos
    const { data: photosData } = await supabase
      .from('event_photos')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: false })
    setPhotos(photosData || [])
    setUploading(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">Chargement...</div>
  }

  if (!gallery) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">Galerie introuvable.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar userEmail={user?.email} firstName={profile?.first_name} role={profile?.role} />

      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <button onClick={() => router.push('/gallery')} className="text-xs text-purple-700 font-semibold hover:underline mb-1 block">
              ← Retour aux galeries
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{gallery.title}</h1>
            {gallery.events?.title && (
              <p className="text-xs text-gray-600 mt-1">Événement associé : <span className="font-semibold text-purple-700">{gallery.events.title}</span></p>
            )}
          </div>

          {isAdminOrBureau && (
            <div>
              <label className={`cursor-pointer bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition ${uploading ? 'opacity-50' : ''}`}>
                {uploading ? 'Ajout en cours...' : '+ Ajouter des photos'}
                <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
          )}
        </div>

        {/* Grille de photos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.length > 0 ? (
            photos.map((photo) => (
              <div key={photo.id} className="bg-white border rounded-xl overflow-hidden shadow-sm aspect-square relative group">
                <img src={photo.image_url} alt="Photo souvenir" className="w-full h-full object-cover" />
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border text-gray-400 text-xs italic">
              Aucune photo dans cette galerie pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}