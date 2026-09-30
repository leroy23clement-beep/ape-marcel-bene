'use client'

import EventFinanceManager from '@/components/EventFinanceManager'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

// Gestionnaire des besoins et créneaux (Bureau + Participants)
function EventNeedsManager({ eventId, isBureau, user, profile }: { eventId: string; isBureau: boolean; user: any; profile: any }) {
  const [needs, setNeeds] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  
  // Formulaire ajout besoin (Bureau)
  const [newNeedTitle, setNewNeedTitle] = useState('')
  const [needType, setNeedType] = useState('tache') // 'tache' (coche multiple) ou 'creneau' (créneau unique)
  const [maxSlots, setMaxSlots] = useState(1)
  
  // Sélection multiple pour les tâches libres
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    fetchNeedsAndParticipants()
  }, [eventId])

  async function fetchNeedsAndParticipants() {
    const { data: needsData } = await supabase.from('event_needs').select('*').eq('event_id', eventId)
    if (needsData) setNeeds(needsData)

    const { data: partData } = await supabase.from('event_participants').select('*').eq('event_id', eventId)
    if (partData) setParticipants(partData)
  }

  // Le bureau ajoute un besoin ou un créneau
  async function handleAddNeed(e: React.FormEvent) {
    e.preventDefault()
    if (!newNeedTitle) return

    const { error } = await supabase.from('event_needs').insert({
      event_id: eventId,
      title: newNeedTitle,
      category: needType,
      max_slots: needType === 'creneau' ? Number(maxSlots) : 1,
    })

    if (!error) {
      setNewNeedTitle('')
      setMaxSlots(1)
      fetchNeedsAndParticipants()
    } else {
      alert("Erreur : " + error.message)
    }
  }

  async function handleDeleteNeed(needId: string) {
    if (!confirm("Supprimer ce besoin / créneau ?")) return
    await supabase.from('event_needs').delete().eq('id', needId)
    fetchNeedsAndParticipants()
  }

  // Inscription aux tâches libres (Cases à cocher multiples)
  async function handleMultipleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedNeeds.length === 0) {
      alert("Veuillez cocher au moins une option.")
      return
    }

    const userName = profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : user.email

    for (const needId of selectedNeeds) {
      await supabase.from('event_participants').insert({
        event_id: eventId,
        user_id: user.id,
        need_id: needId,
        user_name: userName,
      })
    }

    setSelectedNeeds()
    fetchNeedsAndParticipants()
  }

  // Inscription à un créneau unique (ex: Stand de 14h à 15h)
  async function handleBookCreneau(needId: string) {
    const userName = profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : user.email

    const { error } = await supabase.from('event_participants').insert({
      event_id: eventId,
      user_id: user.id,
      need_id: needId,
      user_name: userName,
    })

    if (!error) fetchNeedsAndParticipants()
  }

  // Se désinscrire
  async function handleLeave(participationId: string) {
    await supabase.from('event_participants').delete().eq('id', participationId)
    fetchNeedsAndParticipants()
  }

  const tacheNeeds = needs.filter(n => n.category === 'tache')
  const creneauNeeds = needs.filter(n => n.category === 'creneau')
  const myParticipations = participants.filter(p => p.user_id === user?.id)
  const myParticipatingNeedIds = myParticipations.map(p => p.need_id)

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 bg-purple-50/30 p-4 rounded-xl">
      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
        <span>🙋‍♂️</span> Gestion des Bénévoles & Créneaux ({participants.length} inscription(s))
      </h4>

      {/* ESPACE BUREAU : Définir les besoins ou créneaux */}
      {isBureau && (
        <form onSubmit={handleAddNeed} className="bg-white p-3 rounded-lg border space-y-3">
          <p className="text-xs font-bold text-purple-900">➕ Le Bureau : Définir un besoin ou un créneau pour cet événement</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Ex: Gâteau / Stand Buvette 14h-16h"
              value={newNeedTitle}
              onChange={(e) => setNewNeedTitle(e.target.value)}
              className="p-2 border rounded text-xs text-gray-900 bg-white sm:col-span-1"
              required
            />
            <select
              value={needType}
              onChange={(e) => setNeedType(e.target.value)}
              className="p-2 border rounded text-xs text-gray-900 bg-white"
            >
              <option value="tache">🍰 Tâche multiple (ex: Gâteau, Installation)</option>
              <option value="creneau">🕒 Créneau horaire / Poste unique</option>
            </select>
            <button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white text-xs py-2 rounded font-medium cursor-pointer">
              Ajouter au planning
            </button>
          </div>
        </form>
      )}

      {/* 1. SECTION TACHES MULTIPLES (ex: Vente de gâteaux, installation...) */}
      {tacheNeeds.length > 0 && (
        <form onSubmit={handleMultipleSubmit} className="bg-white p-4 rounded-lg border space-y-3">
          <p className="text-xs font-bold text-gray-800">✨ Je souhaite participer (vous pouvez en cocher plusieurs) :</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tacheNeeds.map((need) => {
              const alreadyDid = myParticipatingNeedIds.includes(need.id)
              return (
                <label key={need.id} className={`flex items-center justify-between p-2.5 border rounded-lg text-xs ${alreadyDid ? 'bg-gray-100 opacity-60' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      disabled={alreadyDid}
                      value={need.id}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNeeds([...selectedNeeds, need.id])
                        } else {
                          setSelectedNeeds(selectedNeeds.filter(id => id !== need.id))
                        }
                      }}
                      className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                    />
                    <span className="font-semibold text-gray-900">{need.title}</span>
                  </div>
                  {alreadyDid && <span className="text-[10px] text-emerald-600 font-bold">Inscrit ✓</span>}
                  {isBureau && (
                    <button type="button" onClick={() => handleDeleteNeed(need.id)} className="text-red-500 hover:text-red-700 text-[10px] ml-2">Suppr</button>
                  )}
                </label>
              )
            })}
          </div>
          {tacheNeeds.some(n => !myParticipatingNeedIds.includes(n.id)) && (
            <button type="submit" className="w-full bg-purple-700 hover:bg-purple-800 text-white text-xs py-2 rounded font-medium transition cursor-pointer">
              Valider mes choix multiples
            </button>
          )}
        </form>
      )}

      {/* 2. SECTION CRENEAUX / STANDS (Disparaissent une fois pris si limités) */}
      {creneauNeeds.length > 0 && (
        <div className="bg-white p-4 rounded-lg border space-y-3">
          <p className="text-xs font-bold text-gray-800">🎪 Planning des créneaux et stands (1 bénévole par créneau) :</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {creneauNeeds.map((need) => {
              const assignedParts = participants.filter(p => p.need_id === need.id)
              const isTaken = assignedParts.length >= need.max_slots
              const myBooking = assignedParts.find(p => p.user_id === user?.id)

              return (
                <div key={need.id} className={`p-3 border rounded-lg text-xs flex justify-between items-center ${isTaken && !myBooking ? 'bg-gray-100 opacity-50' : 'bg-white'}`}>
                  <div>
                    <span className="font-bold text-gray-900 block">{need.title}</span>
                    <span className="text-gray-500 text-[11px]">
                      {assignedParts.length > 0 ? `Occupé par : ${assignedParts.map(p => p.user_name).join(', ')}` : '🟢 Disponible'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {myBooking ? (
                      <button onClick={() => handleLeave(myBooking.id)} className="bg-red-50 text-red-600 px-2 py-1 rounded font-medium hover:bg-red-100">
                        Libérer
                      </button>
                    ) : !isTaken ? (
                      <button onClick={() => handleBookCreneau(need.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded font-medium">
                        Choisir
                      </button>
                    ) : (
                      <span className="text-gray-400 font-semibold">Complet</span>
                    )}

                    {isBureau && (
                      <button onClick={() => handleDeleteNeed(need.id)} className="text-red-500 hover:text-red-700 text-[10px]">Suppr</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Liste globale de vos inscriptions pour pouvoir vous désinscrire facilement */}
      {myParticipations.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg space-y-2">
          <p className="text-xs font-bold text-emerald-800">✓ Vos inscriptions enregistrées :</p>
          <div className="flex flex-wrap gap-2">
            {myParticipations.map(p => {
              const need = needs.find(n => n.id === p.need_id)
              return (
                <span key={p.id} className="inline-flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-900 text-xs px-2.5 py-1 rounded-md shadow-xs">
                  {need ? need.title : 'Participation'}
                  <button onClick={() => handleLeave(p.id)} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Code principal de la page des événements
export default function EventsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [bureauMembers, setBureauMembers] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)

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

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      fetchEvents()
      fetchBureauMembers()
    }
    loadData()
  }, [])

  const fetchEvents = async () => {
    const { data: eventsData } = await supabase.from('events').select('*').order('event_date', { ascending: true })
    setEvents(eventsData || [])
  }

  const fetchBureauMembers = async () => {
    const { data } = await supabase.from('profiles').select('*')
    if (data) setBureauMembers(data)
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Supprimer cet événement ?")) return
    await supabase.from('events').delete().eq('id', eventId)
    fetchEvents()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!e.target.files || e.target.files.length === 0) return
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('events-images').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('events-images').getPublicUrl(fileName)
      setImageUrl(data.publicUrl)
    } catch (error: any) {
      alert("Erreur upload : " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!title || !eventDate) {
      alert("Veuillez remplir le titre et la date.")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('events').insert({
        title, description, event_date: eventDate, location, visibility, is_internal: visibility !== 'public', image_url: imageUrl || null,
      })
      if (error) throw error

      alert("Événement publié !")
      setTitle(''); setEventDate(''); setLocation(''); setVisibility('public'); setDescription(''); setImageUrl('')
      fetchEvents()
    } catch (error: any) {
      alert("Erreur : " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const isBureau = profile?.role && profile.role !== 'parent'

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-4xl p-6 space-y-8">
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Événements APE</h1>
          <p className="text-sm text-gray-600 mt-1">Retrouvez la liste des manifestations et participez aux plannings !</p>
        </header>

        {isBureau && (
          <section className="bg-purple-50/50 border border-purple-200 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-purple-900">➕ Créer un nouvel événement</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre ex: Fête de l'école" className="text-sm p-2.5 rounded-lg border bg-white text-gray-900" />
              <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="text-sm p-2.5 rounded-lg border bg-white text-gray-900" />
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lieu" className="text-sm p-2.5 rounded-lg border bg-white text-gray-900" />
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="text-sm p-2.5 rounded-lg border bg-white text-gray-900">
                <option value="public">Public</option>
                <option value="codir">CODIR</option>
              </select>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="md:col-span-2 text-sm p-2.5 rounded-lg border bg-white text-gray-900" />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="md:col-span-2 text-sm p-2 rounded-lg border bg-white text-gray-900" />
              <div className="md:col-span-2 flex justify-end">
                <button type="button" onClick={handleSubmit} disabled={uploading || loading} className="bg-purple-700 hover:bg-purple-800 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer">
                  {loading ? "Publication..." : "Publier l'événement"}
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Prochains événements</h2>
          {events && events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-xl">{event.title}</h3>
                    {event.location && <p className="text-xs text-gray-500">📍 {event.location}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border">
                      {new Date(event.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isBureau && (
                      <button onClick={() => handleDeleteEvent(event.id)} className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 border rounded cursor-pointer">
                        🗑️ Supprimer
                      </button>
                    )}
                  </div>
                </div>

                {event.image_url && (
                  <div className="w-full h-48 sm:h-64 rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-contain" />
                  </div>
                )}

                {event.description && <p className="text-sm text-gray-600">{event.description}</p>}

                {isBureau && <div className="space-y-2"><EventFinanceManager eventId={event.id} /></div>}

                {/* Gestionnaire dynamique des besoins et créneaux (ouvert à tous) */}
                <EventNeedsManager eventId={event.id} isBureau={isBureau} user={user} profile={profile} />
              </div>
            ))
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