'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

export default function BureauPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

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
    }
    loadData()
  }, [])

  if (!user) return null

  const isBureau = profile?.role && profile.role !== 'parent'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-4xl p-6 space-y-6">
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Espace Bureau</h1>
          <p className="text-sm text-gray-600 mt-1">
            Réservé aux membres du bureau et à l'administration.
          </p>
        </header>

        {isBureau ? (
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Gestion interne</h2>
            <p className="text-sm text-gray-600">
              Bienvenue dans l'espace de gestion restreint. Tu peux ici retrouver les outils administratifs de l'APE Marcel Béné.
            </p>
            {/* Tu pourras ajouter ici des liens ou des tableaux de gestion */}
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
            Accès restreint. Cet espace est réservé aux membres du bureau.
          </div>
        )}
      </main>
    </div>
  )
}