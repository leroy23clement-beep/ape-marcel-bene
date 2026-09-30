'use client'

import EventFinanceManager from '@/components/EventFinanceManager'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

// Gestionnaire des besoins et créneaux sous forme de matrice (Tableau croisé)
function EventNeedsManager({ eventId, isBureau, user, profile }: { eventId: string; isBureau: boolean; user: any; profile: any }) {
  const [needs, setNeeds] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  
  // Formulaire ajout besoin (Bureau)
  const [newNeedTitle, setNewNeedTitle] = useState('')
  const [timeSlot, setTimeSlot] = useState('') // Ex: 14h00 - 15h00 (Ligne)
  const [columnName, setColumnName] = useState('') // Ex: Stand Buvette / Maquillage (Colonne)

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

  // Le bureau ajoute un besoin (croisement Colonne / Ligne)
  async function handleAddNeed(e: React.FormEvent) {
    e.preventDefault()
    if (!columnName || !timeSlot) {
      alert("Veuillez remplir le poste (colonne) et le créneau (ligne).")
      return
    }

    const { error } = await supabase.from('event_needs').insert({
      event_id: eventId,
      title: columnName,     // La colonne (ex: Buvette, Maquillage)
      time_slot: timeSlot,   // La ligne (ex: 14h-15h)
      max_slots: 1,
    })

    if (!error) {
      setColumnName('')
      setTimeSlot('')
      fetchNeedsAndParticipants()
    } else {
      alert("Erreur : " + error.message)
    }
  }

  async function handleDeleteNeed(needId: string) {
    if (!confirm("Supprimer cette case du planning ?")) return
    await supabase.from('event_needs').delete().eq('id', needId)
    fetchNeedsAndParticipants()
  }

  // Inscription à un créneau (case de la matrice)
  async function handleBookCell(needId: string) {
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

  const myParticipations = participants.filter(p => p.user_id === user?.id)

  // Extraire les colonnes (postes/activités) et les lignes (créneaux horaires) uniques
  const columns = Array.from(new Set(needs.map(n => n.title))).filter(Boolean)
  const rows = Array.from(new Set(needs.map(n => n.time_slot))).filter(Boolean)

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 bg-purple-50/30 p-4 rounded-xl">
      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
        <span>🙋‍♂️</span> Planning des Bénévoles ({participants.length} inscription(s))
      </h4>

      {/* ESPACE BUREAU : Ajouter une case au tableau */}
      {isBureau && (
        <form onSubmit={handleAddNeed} className="bg-white p-3 rounded-lg border space-y-3 shadow-xs">
          <p className="text-xs font-bold text-purple-950">➕ Le Bureau : Ajouter un créneau au tableau croisé</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Poste / Stand (colonne) ex: Buvette"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              className="p-2 border rounded text-xs text-gray-900 bg-white"
              required
            />
            <input
              type="text"
              placeholder="Créneau horaire (ligne) ex: 14h00 - 15h00"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="p-2 border rounded text-xs text-gray-900 bg-white"
              required
            />
            <button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white text-xs py-2 rounded font-medium cursor-pointer">
              Ajouter au tableau
            </button>
          </div>
        </form>
      )}

      {/* MATRICE / TABLEAU CROISE */}
      {needs.length > 0 && rows.length > 0 && columns.length > 0 ? (
        <div className="bg-white border rounded-xl p-4 shadow-sm overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-left text-xs font-semibold text-gray-600 border-r">Créneaux \ Postes</th>
                {columns.map((col, idx) => (
                  <th key={idx} className="p-3 text-center text-xs font-semibold text-purple-900 border-r last:border-r-0">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-gray-50/50">
                  <td className="p-3 font-bold text-xs text-gray-800 bg-gray-50/50 border-r whitespace-nowrap">
                    🕒 {row}
                  </td>
                  {columns.map((col, cIdx) => {
                    // Trouver le besoin correspondant à ce croisement [Poste / Colonne] + [Créneau / Ligne]
                    const matchingNeed = needs.find(n => n.title === col && n.time_slot === row)
                    const participation = matchingNeed ? participants.find(p => p.need_id === matchingNeed.id) : null
                    const isMyBooking = participation && participation.user_id === user?.id

                    return (
                      <td key={cIdx} className="p-2 text-center border-r last:border-r-0 min-w-[150px]">
                        {matchingNeed ? (
                          participation ? (
                            // Case prise / grisée
                            <div className={`text-xs py-2 px-2 rounded-md font-medium border flex flex-col items-center justify-center gap-1 ${isMyBooking ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-gray-100 border-gray-200 text-gray-500 opacity-80'}`}>
                              <span className="truncate max-w-[130px]" title={participation.user_name}>
                                🔒 {participation.user_name}
                              </span>
                              {isMyBooking && (
                                <button
                                  onClick={() => handleLeave(participation.id)}
                                  className="text-[10px] bg-white text-red-600 hover:bg-red-50 border border-red-200 px-2 py-0.5 rounded shadow-xs cursor-pointer"
                                >
                                  Se libérer
                                </button>
                              )}
                              {isBureau && !isMyBooking && (
                                <button
                                  onClick={() => handleDeleteNeed(matchingNeed.id)}
                                  className="text-[10px] text-red-500 hover:underline cursor-pointer"
                                >
                                  Supprimer
                                </button>
                              )}
                            </div>
                          ) : (
                            // Case libre (cliquable)
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleBookCell(matchingNeed.id)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-3 rounded-md font-medium transition shadow-xs cursor-pointer"
                              >
                                ✓ Choisir
                              </button>
                              {isBureau && (
                                <button
                                  onClick={() => handleDeleteNeed(matchingNeed.id)}
                                  className="text-[10px] text-red-500 hover:underline cursor-pointer"
                                >
                                  Suppr. case
                                </button>
                              )}
                            </div>
                          )
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-6 text-center text-gray-500 text-xs">
          Aucun créneau ou poste défini pour le moment. Le bureau peut en ajouter un ci-dessus.
        </div>
      )}

      {/* Liste globale de vos inscriptions pour un suivi rapide */}
      {myParticipations.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg space-y-2">
          <p className="text-xs font-bold text-emerald-800">✓ Vos créneaux réservés :</p>
          <div className="flex flex-wrap gap-2">
            {myParticipations.map(p => {
              const need = needs.find(n => n.id === p.need_id)
              return (
                <span key={p.id} className="inline-flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-900 text-xs px-2.5 py-1 rounded-md shadow-xs">
                  {need ? `${need.title} (${need.time_slot})` : 'Créneau'}
                  <button onClick={() => handleLeave(p.id)} className="text-red-500 hover:text-red-700 font-bold ml-1 cursor-pointer">×</button>
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
    }
    loadData()
  }, [])

  const fetchEvents = async () => {
    const { data: eventsData } = await supabase.from('events').select('*').order('event_date', { ascending: true })
    setEvents(eventsData || [])
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

                {/* Gestionnaire dynamique des besoins sous forme de matrice croisée */}
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