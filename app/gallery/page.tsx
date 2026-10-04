'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function GalleryIndexPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [galleries, setGalleries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(prof)
      }

      // Récupérer les galeries (liées aux événements)
      const { data } = await supabase
        .from('event_galleries')
        .select('*, events(title, event_date)')
        .order('created_at', { ascending: false })

      setGalleries(data || [])
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">Chargement des galeries...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar userEmail={user?.email} firstName={profile?.first_name} role={profile?.role} />

      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <header className="border-b pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>📸</span> Galeries photos des événements
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Retrouvez tous les souvenirs en images des manifestations de l'association.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleries.length > 0 ? (
            galleries.map((gallery) => (
              <Link 
                key={gallery.id} 
                href={`/gallery/${gallery.id}`}
                className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group flex flex-col"
              >
                <div className="h-48 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                  {gallery.cover_image ? (
                    <img src={gallery.cover_image} alt={gallery.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <span className="text-4xl">📷</span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h2 className="font-bold text-gray-900 text-base group-hover:text-purple-700 transition">
                      {gallery.title}
                    </h2>
                    {gallery.events?.title && (
                      <p className="text-xs text-purple-600 font-medium mt-0.5">
                        Événement : {gallery.events.title}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 font-medium pt-2 border-t">
                    Voir les photos →
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border text-gray-500 text-sm">
              Aucune galerie photo n'a encore été créée.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}