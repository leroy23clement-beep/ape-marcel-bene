import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user ? await supabase.from('profiles').select('*').eq('id', user.id).single() : { data: null }

  // Récupérer l'événement spécifique grâce à l'ID dynamique dans l'URL
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!event) {
    notFound()
  }

  const eventDate = new Date(event.event_date)

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />}

      <main className="mx-auto max-w-3xl p-6 space-y-6">
        
        {/* Lien retour */}
        <div>
          <Link href="/events" className="text-xs font-semibold text-purple-700 hover:underline">
            « Tous les Événements
          </Link>
        </div>

        {/* Détails de l'événement */}
        <div className="bg-white border rounded-2xl p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-purple-900 tracking-tight">
              {event.title}
            </h1>
            <p className="text-sm font-semibold text-gray-700">
              {eventDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} 
              {" à "} 
              {eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="text-sm text-gray-600 leading-relaxed border-t pt-4">
            {event.description}
          </div>

          {/* Bloc Lieu & Google Maps */}
          {event.location && (
            <div className="border rounded-xl p-4 bg-gray-50 space-y-2">
              <p className="text-xs font-bold text-gray-800">Lieu de l'événement</p>
              <p className="text-xs text-gray-600">📍 {event.location}</p>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-medium text-purple-700 hover:underline pt-1"
              >
                + Google Map ↗
              </a>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}