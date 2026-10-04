'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function NewGalleryPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [eventId, setEventId] = useState('')
  const [loading, setLoading] = useState(false)
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

      // Récupérer la liste des événements pour les lier
      const { data: eventsData } = await supabase.from('events').select('id, title').order('event_date', { ascending: false })
      setEvents(eventsData || [])
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return
    setLoading(true)

    const { error } = await supabase.from('event_galleries').insert({
      title,
      event_id: eventId || null
    })

    if (!error) {
      router.push('/gallery')
    } else {
      alert("Erreur lors de la création de la galerie")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar userEmail={user?.email} firstName={profile?.first_name} role={profile?.role} />

      <div className="mx-auto max-w-xl p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Créer une nouvelle galerie photo</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Titre de la galerie</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required
              placeholder="Ex: Fête d'Halloween 2026"
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Événement associé (optionnel)</label>
            <select 
              value={eventId} 
              onChange={(e) => setEventId(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
            >
              <option value="">-- Aucun événement rattaché --</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow"
          >
            {loading ? 'Création...' : 'Créer la galerie'}
          </button>
        </form>
      </div>
    </div>
  )
}