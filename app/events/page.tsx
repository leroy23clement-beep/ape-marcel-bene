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

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })

      if (eventsData) setEvents(eventsData)
    }
    loadData()
  }, [])

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

        {/* Liste des événements avec balise <a> native */}
        <div className="space-y-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => {
              const eventDateObj = new Date(event.event_date)
              const dayNumber = eventDateObj.toLocaleDateString('fr-FR', { day: 'numeric' })
              const timeString = eventDateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

              return (
                <a
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block bg-white p-5 rounded-xl border shadow-sm hover:border-purple-500 hover:shadow-md transition cursor-pointer group"
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
                        <h2 className="font-bold text-gray-900 group-hover:text-purple-700 transition text-base">
                          {event.title}
                        </h2>
                        <span className="text-xs text-gray-500 font-medium">🕒 {timeString}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{event.description}</p>
                      {event.location && (
                        <p className="text-xs text-purple-600 font-medium pt-1">📍 {event.location}</p>
                      )}
                    </div>
                  </div>
                </a>
              )
            })
          ) : (
            <div className="bg-white p-8 rounded-xl border text-center text-gray-500 text-xs italic">
              Aucun événement trouvé pour cette période.
            </div>
          )}
        </div>

      </main>
    </div>
  )
}