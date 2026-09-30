'use client'

import EventFinanceManager from '@/components/EventFinanceManager'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

// Composant interne pour gérer les tâches d'un événement (Réservé au bureau)
function EventTasksManager({ eventId, members }: { eventId: string; members: any[] }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('moyenne')
  const [assignedTo, setAssignedTo] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchTasks()
  }, [eventId])

  async function fetchTasks() {
    const { data } = await supabase
      .from('event_tasks')
      .select('*')
      .eq('event_id', eventId)
      .order('due_date', { ascending: true })
    if (data) setTasks(data)
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!title) return
    setLoading(true)

    const { error } = await supabase.from('event_tasks').insert({
      event_id: eventId,
      title,
      due_date: dueDate || null,
      priority,
      assigned_to: assignedTo || null,
    })

    if (!error) {
      setTitle('')
      setDueDate('')
      setPriority('moyenne')
      setAssignedTo('')
      fetchTasks()
    } else {
      alert("Erreur lors de l'ajout de la tâche : " + error.message)
    }
    setLoading(false)
  }

  async function toggleTask(id: string, currentStatus: boolean) {
    await supabase.from('event_tasks').update({ completed: !currentStatus }).eq('id', id)
    fetchTasks()
  }

  async function deleteTask(id: string) {
    if (!confirm("Supprimer cette tâche ?")) return
    await supabase.from('event_tasks').delete().eq('id', id)
    fetchTasks()
  }

  const priorityBadge = (p: string) => {
    switch (p) {
      case 'haute': return <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-700 rounded-full font-semibold uppercase">Haute</span>
      case 'moyenne': return <span className="px-2 py-0.5 text-[10px] bg-orange-100 text-orange-700 rounded-full font-semibold uppercase">Moyenne</span>
      default: return <span className="px-2 py-0.5 text-[10px] bg-green-100 text-green-700 rounded-full font-semibold uppercase">Basse</span>
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 bg-gray-50/70 p-4 rounded-xl">
      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
        <span>📋</span> Tâches à faire pour cet événement ({tasks.length})
      </h4>

      <form onSubmit={handleAddTask} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 items-end bg-white p-3 rounded-lg border shadow-xs">
        <div className="md:col-span-2">
          <label className="block text-[11px] font-medium text-gray-700 mb-1">Nouvelle tâche *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Acheter le matériel..."
            className="w-full p-2 border rounded text-xs text-gray-900 bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-700 mb-1">Échéance</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2 border rounded text-xs text-gray-900 bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-700 mb-1">Priorité</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full p-2 border rounded text-xs text-gray-900 bg-white"
          >
            <option value="basse">Basse</option>
            <option value="moyenne">Moyenne</option>
            <option value="haute">Haute</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-700 mb-1">Assigné à</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full p-2 border rounded text-xs text-gray-900 bg-white"
          >
            <option value="">Personne</option>
            {members.map((m) => (
              <option key={m.id} value={`${m.first_name} ${m.last_name || ''}`}>
                {m.first_name} {m.last_name || ''}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="md:col-span-5 bg-purple-700 hover:bg-purple-800 text-white text-xs py-2 rounded transition font-medium cursor-pointer"
        >
          + Ajouter la tâche
        </button>
      </form>

      <div className="space-y-2">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className={`flex items-center justify-between p-2.5 border rounded-lg transition ${task.completed ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id, task.completed)}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
                <div>
                  <p className={`text-xs font-semibold text-gray-900 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                    {task.due_date && <span>📅 Échéance : {new Date(task.due_date).toLocaleDateString('fr-FR')}</span>}
                    {task.assigned_to && <span>👤 Assigné à : <strong className="text-gray-700">{task.assigned_to}</strong></span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {priorityBadge(task.priority)}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-[11px] text-red-600 hover:text-red-800 font-medium px-2 py-1 bg-red-50 hover:bg-red-100 rounded cursor-pointer"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-500 italic text-center py-2">Aucune tâche enregistrée pour cet événement.</p>
        )}
      </div>
    </div>
  )
}

// Composant de participation interactif (Ouvert à tous : Bureau et Parents)
function EventParticipationManager({ eventId, isBureau, user, profile }: { eventId: string; isBureau: boolean; user: any; profile: any }) {
  const [participants, setParticipants] = useState<any[]>([])
  const [taskName, setTaskName] = useState('Participation générale / Bénévolat')
  const [customTask, setCustomTask] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchParticipants()
  }, [eventId])

  async function fetchParticipants() {
    const { data } = await supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', eventId)
    if (data) setParticipants(data)
  }

  async function handleParticipate(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const selectedRole = customTask.trim() || taskName
    const userName = profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : user.email

    setLoading(true)
    const { error } = await supabase.from('event_participants').insert({
      event_id: eventId,
      user_id: user.id,
      user_name: userName,
      task_name: selectedRole,
    })

    if (!error) {
      setCustomTask('')
      fetchParticipants()
    } else {
      alert("Erreur lors de l'inscription : " + error.message)
    }
    setLoading(false)
  }

  async function handleLeave(participantId: string) {
    const { error } = await supabase
      .from('event_participants')
      .delete()
      .eq('id', participantId)

    if (!error) fetchParticipants()
  }

  const userName = profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : user?.email
  const userParticipations = participants.filter(p => p.user_id === user?.id)

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 bg-purple-50/30 p-4 rounded-xl">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <span>🙋‍♂️</span> Inscriptions & Créneaux ({participants.length} bénévole{participants.length > 1 ? 's' : ''})
        </h4>
      </div>

      {/* Formulaire d'inscription */}
      <form onSubmit={handleParticipate} className="bg-white p-4 rounded-lg border shadow-xs space-y-3">
        <p className="text-xs font-bold text-gray-800">Je m'inscris à une tâche / un créneau :</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Poste ou besoin</label>
            <select
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full p-2 border rounded text-xs text-gray-900 bg-white"
            >
              <option value="Participation générale / Bénévolat">Participation générale / Bénévolat</option>
              <option value="Préparation de gâteau / crêpes">🍰 Préparation de gâteau / crêpes</option>
              <option value="Installation (avant l'événement)">🛠️ Installation (avant l'événement)</option>
              <option value="Rangement (après l'événement)">🧹 Rangement (après l'événement)</option>
              <option value="Tenue de stand (Créneau 1)">🎪 Tenue de stand (Créneau 1)</option>
              <option value="Tenue de stand (Créneau 2)">🎪 Tenue de stand (Créneau 2)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Ou préciser un créneau / détail personnalisé</label>
            <input
              type="text"
              value={customTask}
              onChange={(e) => setCustomTask(e.target.value)}
              placeholder="Ex: Buvette de 14h à 16h..."
              className="w-full p-2 border rounded text-xs text-gray-900 bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-700 hover:bg-purple-800 text-white text-xs py-2 rounded transition font-medium cursor-pointer"
        >
          {loading ? "Inscription..." : "✨ Valider ma participation"}
        </button>
      </form>

      {/* Liste des inscrits */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-700">Bénévoles inscrits par poste :</p>
        {participants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {participants.map((p) => {
              const isMe = p.user_id === user?.id
              return (
                <div key={p.id} className="flex justify-between items-center p-2.5 bg-white border rounded-lg text-xs">
                  <div>
                    <span className="font-bold text-purple-700 block">{p.task_name}</span>
                    <span className="text-gray-600">👤 {p.user_name}</span>
                  </div>
                  {isMe && (
                    <button
                      type="button"
                      onClick={() => handleLeave(p.id)}
                      className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded font-medium cursor-pointer"
                    >
                      Se désinscrire
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic text-center py-2">Aucun inscrit pour le moment. Soyez le premier !</p>
        )}
      </div>
    </div>
  )
}

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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      fetchEvents()
      fetchBureauMembers()
    }
    loadData()
  }, [])

  const fetchEvents = async () => {
    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })
    setEvents(eventsData || [])
  }

  const fetchBureauMembers = async () => {
    const { data } = await supabase.from('profiles').select('*')
    if (data) setBureauMembers(data)
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return
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

      const { error: uploadError } = await supabase.storage
        .from('events-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('events-images')
        .getPublicUrl(fileName)

      setImageUrl(data.publicUrl)
    } catch (error: any) {
      alert("Erreur lors de l'upload : " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!title || !eventDate) {
      alert("Veuillez remplir au moins le titre et la date.")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('events').insert({
        title,
        description,
        event_date: eventDate,
        location,
        visibility,
        is_internal: visibility !== 'public',
        image_url: imageUrl || null,
      })

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
      alert("Erreur lors de la publication : " + error.message)
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
                {uploading && <p className="text-xs text-purple-600 mt-1">Téléchargement en cours...</p>}
                {imageUrl && <p className="text-xs text-emerald-600 mt-1">✓ Image prête</p>}
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
            events.map((event) => (
              <div 
                key={event.id} 
                className={`bg-white border rounded-xl p-6 shadow-sm space-y-4 ${
                  event.visibility === 'secretariat' ? 'border-red-300 bg-red-50/30' : event.visibility === 'codir' ? 'border-purple-300 bg-purple-50/30' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {event.visibility === 'secretariat' && (
                        <span className="text-[10px] font-bold uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200">
                          Secrétariat
                        </span>
                      )}
                      {event.visibility === 'codir' && (
                        <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-red-200">
                          CODIR
                        </span>
                      )}
                      <h3 className="font-bold text-gray-900 text-xl">{event.title}</h3>
                    </div>
                    {event.location && <p className="text-xs text-gray-500">📍 {event.location}</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {new Date(event.event_date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>

                    {isBureau && (
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium px-2.5 py-1 rounded border border-red-200 hover:bg-red-50 transition cursor-pointer"
                      >
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

                {/* Tâches internes réservées au Bureau */}
                {isBureau && (
                  <EventTasksManager eventId={event.id} members={bureauMembers} />
                )}

                {/* Trésorerie réservée au Bureau */}
                {isBureau && (
                  <EventFinanceManager eventId={event.id} />
                )}

                {/* Inscriptions interactives par tâche/créneau ouvertes à tous */}
                <EventParticipationManager eventId={event.id} isBureau={isBureau} user={user} profile={profile} />
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