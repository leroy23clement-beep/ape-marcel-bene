'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { registerVolunteer } from '@/lib/actions/events'
import Image from 'next/image'

export default function EventsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)

  // Champs du formulaire
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [description, setDescription] = useState('')

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      fetchEvents()
    }
    loadData()
  }, [])

  const fetchEvents = async () => {
    const { data: eventsData } = await supabase
      .from('events')
      .select('*, event_volunteers(*)')
      .order('event_date', { ascending: true })
    setEvents(eventsData || [])
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!e.target.files || e.target.files.length === 0) return

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('events-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('events-images')
        .getPublicUrl(fileName)

      setImageUrl(data.publicUrl)
    } catch (error: any) {
      console.error("Erreur upload:", error)
      alert("Erreur lors de l'upload de l'image : " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    console.log("Clic sur Publier détecté !")
    
    if (!title || !eventDate) {
      alert("Veuillez remplir au moins le titre et la date.")
      return
    }

    setLoading(true)

    try {
      console.log("Envoi des données vers Supabase...", {
        title,
        description,
        event_date: eventDate,
        location,
        visibility,
        is_internal: visibility !== 'public',
        image_url: imageUrl || null,
      })

      const { data, error } = await supabase.from('events').insert({
        title,
        description,
        event_date: eventDate,
        location,
        visibility,
        is_internal: visibility !== 'public',
        image_url: imageUrl || null,
      }).select()

      console.log("Réponse Supabase - data:", data, "error:", error)

      if (error) throw error

      alert("Événement publié avec succès !")
      setTitle('')
      setEventDate('')
      setLocation('')
      setVisibility('public')
      setDescription('')
      setImageUrl('')
      fetchEvents()
    } catch (error: any) {
      console.error("Erreur attrapée dans catch:", error)
      alert("Erreur lors de la publication : " + (error.message || JSON.stringify(error)))
    } finally {
      setLoading(false)
    }
  }

  const isBureau = profile?.role && profile.role !== 'parent'
  const canSeeSecretariat = ['president', 'secretaire', 'vice_secretaire', 'admin'].includes(profile?.role ?? '')

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-4xl p-6 space-y-8">
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Événements APE</h1>
          <p className="text-sm text-gray-600 mt-1">
            Retrouvez la liste des manifestations et proposez votre aide !
          </p>
        </header>

        {isBureau && (
          <section className="bg-purple-50/50 border border-purple-200 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
              <span>➕</span> Créer un nouvel événement
            </h2>

            {/* Remplacement du <form> par un simple <div> pour éviter tout blocage natif */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Titre *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="ex: Fête de l'école" 
                  className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Date et heure *</label>
                <input 
                  type="datetime-local" 
                  value={eventDate} 
                  onChange={(e) => setEventDate(e.target.value)} 
                  className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Lieu (optionnel)</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="ex: Cour de l'école" 
                  className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Visibilité</label>
                <select 
                  value={visibility} 
                  onChange={(e) => setVisibility(e.target.value)} 
                  className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900"
                >
                  <option value="public">Public (Tous les parents)</option>
                  <option value="codir">CODIR uniquement</option>
                  {canSeeSecretariat && (
                    <option value="secretariat">Secrétariat / Présidence</option>
                  )}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-700">Description</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Détails de l'événement" 
                  className="w-full text-sm p-2.5 rounded-lg border bg-white text-gray-900" 
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-700">Image de l'événement (optionnel)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="w-full text-sm p-2 rounded-lg border bg-white file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 text-gray-900" 
                />
                {uploading && <p className="text-xs text-purple-600 mt-1">Téléchargement de l'image en cours...</p>}
                {imageUrl && <p className="text-xs text-emerald-600 mt-1">✓ Image prête à être publiée</p>}
              </div>

              <div className="md:col-span-2 flex justify-end pt-2 border-t border-purple-200">
                <button 
                  type="button" 
                  onClick={handleSubmit}
                  disabled={uploading || loading}
                  className="bg-purple-700 hover:bg-purple-800 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  {loading ? "Publication..." : "Publier l'événement"}
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Prochains événements</h2>
          {events && events.length > 0 ? (
            events.map((event) => {
              const isRegistered = event.event_volunteers?.some(
                (v: { user_id: string }) => v.user_id === user.id
              );

              return (
                <div key={event.id} className={`bg-white border rounded-xl p-6 shadow-sm space-y-4 ${
                  event.visibility === 'secretariat' ? 'border-red-300 bg-red-50/30' : event.visibility === 'codir' ? 'border-purple-300 bg-purple-50/30' : ''
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {event.visibility === 'secretariat' && (
                          <span className="text-[10px] font-bold uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200">
                            Secrétariat
                          </span>
                        )}
                        {event.visibility === 'codir' && (
                          <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                            CODIR
                          </span>
                        )}
                        <h3 className="font-bold text-gray-900 text-xl">{event.title}</h3>
                      </div>
                      {event.location && <p className="text-xs text-gray-500">📍 {event.location}</p>}
                    </div>

                    <span className="text-xs font-semibold px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {new Date(event.event_date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>

                  {event.image_url && (
                    <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden border bg-gray-100">
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {event.description && <p className="text-sm text-gray-600">{event.description}</p>}

                  <div className="pt-3 border-t flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      👥 <strong>{event.event_volunteers?.length || 0}</strong> bénévole(s) inscrit(s)
                    </div>

                    {isRegistered ? (
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium">
                        ✓ Vous êtes inscrit comme bénévole
                      </span>
                    ) : (
                      <form action={registerVolunteer} className="flex gap-2">
                        <input type="hidden" name="eventId" value={event.id} />
                        <input
                          type="text"
                          name="roleNeeded"
                          placeholder="Ex: Tenue de stand..."
                          className="text-xs px-3 py-1.5 border rounded-lg focus:outline-purple-600 bg-white"
                          required
                        />
                        <button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
                        >
                          Je participe
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white border rounded-xl p-8 text-center text-gray-500 text-sm">
              Aucun événement prévu pour le moment.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}