'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function EventsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'month'>('list')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  // États pour gérer l'affichage de la modale d'ajout
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
      }

      fetchEvents()
    }
    loadData()
  }, [])

  async function fetchEvents() {
    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })

    if (eventsData) setEvents(eventsData)
  }

  // Fonction pour enregistrer l'événement dans Supabase
  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('events').insert([
      {
        title,
        description,
        event_date: eventDate,
        location,
      }
    ])

    setLoading(false)

    if (error) {
      alert("Erreur lors de l'ajout : " + error.message)
    } else {
      // Réinitialiser et fermer la modale
      setTitle('')
      setDescription('')
      setEventDate('')
      setLocation('')
      setIsModalOpen(false)
      fetchEvents() // Recharger la liste
    }
  }

  const filteredEvents = events.filter((ev) => {
    if (viewMode === 'month') {
      return ev.event_date.startsWith(selectedMonth)
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {user && (
        <Navbar 
          userEmail={user.email} 
          firstName={profile?.first_name} 
          role={profile?.role} 
        />
      )}

      <main className="mx-auto max-w-5xl p-6 space-y-6">
        
        {/* Barre d'en-tête */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Événements de l'APE</h1>
            
            {/* Bouton ouvrant la modale d'ajout */}
            {profile?.role === 'admin' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-purple-700 hover:bg-purple-800 text-white font-semibold px-3 py-1.5 rounded-lg shadow transition text-xs flex items-center gap-1.5 cursor-pointer"
              >
                + Ajouter un événement
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {viewMode === 'month' && (
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="p-1.5 border rounded-lg text-xs bg-gray-50 text-gray-900 font-medium"
              />
            )}
            
            <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Liste
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  viewMode === 'month' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mois
              </button>
            </div>
          </div>
        </div>

        {/* Liste des événements */}
        <div className="space-y-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => {
              const eventDateObj = new Date(event.event_date)
              const dayNumber = eventDateObj.toLocaleDateString('fr-FR', { day: 'numeric' })
              const timeString = eventDateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

              return (
                <div
                  key={event.id}
                  className="block bg-white p-5 rounded-xl border shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center bg-purple-50 text-purple-700 border border-purple-100 rounded-lg p-3 min-w-[70px]">
                      <span className="text-xl font-extrabold">{dayNumber}</span>
                      <span className="text-[10px] uppercase font-semibold tracking-wider">
                        {eventDateObj.toLocaleDateString('fr-FR', { month: 'short' })}
                      </span>
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between items-start">
                        <h2 className="font-bold text-gray-900 text-base">{event.title}</h2>
                        <span className="text-xs text-gray-500 font-medium">🕒 {timeString}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{event.description}</p>
                      {event.location && (
                        <p className="text-xs text-purple-600 font-medium pt-1">📍 {event.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-white p-8 rounded-xl border text-center text-gray-500 text-xs italic">
              Aucun événement trouvé pour cette période.
            </div>
          )}
        </div>

      </main>

      {/* MODALE DE CRÉATION D'ÉVÉNEMENT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="font-bold text-gray-900 text-base">Ajouter un événement APE</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Titre de l'événement</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required
                  placeholder="Ex: Vote du bureau, boum..."
                  className="w-full p-2 border rounded-md text-gray-900"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Date et heure</label>
                <input 
                  type="datetime-local" 
                  value={eventDate} 
                  onChange={(e) => setEventDate(e.target.value)} 
                  required
                  className="w-full p-2 border rounded-md text-gray-900"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Lieu</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="Ex: Salle SMC1"
                  className="w-full p-2 border rounded-md text-gray-900"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={3}
                  placeholder="Détails de l'événement..."
                  className="w-full p-2 border rounded-md text-gray-900 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-800 transition cursor-pointer font-semibold"
                >
                  {loading ? 'Enregistrement...' : 'Créer l\'événement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}