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
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // Format YYYY-MM
  
  // État pour gérer l'événement sélectionné pour la fenêtre modale (popup)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

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

      // Récupération de tous les événements triés par date[cite: 4]
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })

      if (eventsData) setEvents(eventsData)
    }
    loadData()
  }, [])

  // Filtrer les événements selon le mois sélectionné si on est en mode Mois[cite: 4]
  const filteredEvents = events.filter((ev) => {
    if (viewMode === 'month') {
      return ev.event_date.startsWith(selectedMonth)
    }
    return true // En mode liste, on affiche tous les événements[cite: 4]
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
        
        {/* Barre d'en-tête avec les boutons de bascule et d'ajout admin */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Événements de l'APE</h1>

            {/* Bouton d'ajout visible uniquement pour les administrateurs */}
            {profile?.role === 'admin' && (
              <Link
                href="/admin/events/new"
                className="bg-purple-700 hover:bg-purple-800 text-white font-semibold px-3 py-1.5 rounded-lg shadow transition text-xs flex items-center gap-1.5"
              >
                + Ajouter un événement
              </Link>
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
            
            {/* Boutons de bascule Liste / Mois[cite: 4] */}
            <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Liste
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  viewMode === 'month' 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mois
              </button>
            </div>
          </div>
        </div>

        {/* Grille de miniatures / cartes d'événements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => {
              const eventDate = new Date(event.event_date)
              const dayNumber = eventDate.toLocaleDateString('fr-FR', { day: 'numeric' })
              const monthName = eventDate.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()
              const timeString = eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

              return (
                <div
                  key={event.id}
                  id={`event-${event.id}`}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-white rounded-xl border shadow-sm hover:border-purple-500 hover:shadow-md transition cursor-pointer overflow-hidden flex flex-col justify-between group"
                >
                  {/* Miniature / Image de l'événement en entier (object-contain) */}
                  {event.image_url ? (
                    <div className="h-52 w-full bg-gray-950/5 overflow-hidden relative flex items-center justify-center p-2 border-b">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-20 bg-purple-900 text-white px-5 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-200">Événement APE</span>
                      <span className="text-xl">🎉</span>
                    </div>
                  )}

                  {/* Contenu de la carte */}
                  <div className="p-5 flex items-start gap-4">
                    {/* Bloc date à gauche */}
                    <div className="flex flex-col items-center justify-center bg-purple-50 text-purple-700 border border-purple-100 rounded-lg p-3 min-w-[70px]">
                      <span className="text-xl font-extrabold">{dayNumber}</span>
                      <span className="text-[10px] uppercase font-semibold tracking-wider">
                        {monthName}
                      </span>
                    </div>

                    {/* Infos de l'événement */}
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between items-start">
                        <h2 className="font-bold text-gray-900 group-hover:text-purple-700 transition text-base">
                          {event.title}
                        </h2>
                        <span className="text-xs text-gray-500 font-medium">
                          🕒 {timeString}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {event.description}
                      </p>

                      <div className="flex justify-between items-center pt-2">
                        {event.location ? (
                          <p className="text-xs text-purple-600 font-medium">
                            📍 {event.location}
                          </p>
                        ) : <span />}
                        <span className="text-xs font-semibold text-purple-700 group-hover:underline">
                          Voir l'affiche 🔍
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-white p-8 rounded-xl border text-center text-gray-500 text-xs italic col-span-full">
              Aucun événement trouvé pour cette période[cite: 4].
            </div>
          )}
        </div>

      </main>

      {/* FENÊTRE MODALE (POPUP) AU CLIC SUR UN ÉVÉNEMENT */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col">
            
            {/* Bouton de fermeture */}
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 bg-gray-100 text-gray-700 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center font-bold transition z-10 cursor-pointer"
            >
              ✕
            </button>

            {/* Contenu de la modale */}
            <div className="p-6 space-y-4">
              {selectedEvent.image_url && (
                <div className="w-full bg-gray-950/5 rounded-xl overflow-hidden border flex justify-center p-2">
                  <img
                    src={selectedEvent.image_url}
                    alt={selectedEvent.title}
                    className="w-full max-h-[65vh] object-contain rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-1">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 uppercase tracking-wider">
                  {new Date(selectedEvent.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(selectedEvent.event_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <h2 className="text-2xl font-extrabold text-gray-900 pt-1">{selectedEvent.title}</h2>
                {selectedEvent.location && (
                  <p className="text-xs font-medium text-gray-600">📍 Lieu : {selectedEvent.location}</p>
                )}
              </div>

              {selectedEvent.description && (
                <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border whitespace-pre-wrap">
                  <p>{selectedEvent.description}</p>
                </div>
              )}

              {/* Bouton de modification admin dans la modale */}
              <div className="pt-4 border-t flex justify-between items-center">
                {profile?.role === 'admin' ? (
                  <Link
                    href={`/admin/events/${selectedEvent.id}/edit`}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    ✏️ Modifier cet événement
                  </Link>
                ) : <span />}

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="bg-gray-900 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}