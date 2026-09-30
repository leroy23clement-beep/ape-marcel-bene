'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function BureauPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) return null
  if (!user) return null

  // Liste des rôles ayant accès à l'Espace Bureau
  const allowedBureauRoles = ['admin', 'president', 'secretaire', 'tresorier', 'bureau']
  const userRole = profile?.role ? profile.role.toLowerCase() : 'parent'
  const isBureau = allowedBureauRoles.includes(userRole)

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
          <div className="space-y-6">
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-2">
              <h2 className="text-lg font-semibold text-gray-800">Gestion interne</h2>
              <p className="text-sm text-gray-600">
                Bienvenue dans l'espace de gestion restreint. Tu peux ici retrouver les outils administratifs de l'APE Marcel Béné (Rôle actuel : <strong className="uppercase">{profile?.role}</strong>).
              </p>
            </div>

            {/* Grille des outils du bureau */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Carte Suivi des tâches */}
              <Link 
                href="/bureau/taches"
                className="block bg-white border rounded-xl p-6 shadow-sm hover:border-purple-500 transition space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-800">📋 Suivi des tâches</h3>
                  <span className="text-xs text-purple-700 font-medium">Accéder →</span>
                </div>
                <p className="text-xs text-gray-600">
                  Vue d'ensemble des tâches par événement avec vos attributions en surbrillance.
                </p>
              </Link>

              {/* Carte Documents & PV */}
              <Link 
                href="/bureau/documents"
                className="block bg-white border rounded-xl p-6 shadow-sm hover:border-purple-500 transition space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-800">📂 Documents & PV</h3>
                  <span className="text-xs text-purple-700 font-medium">Accéder →</span>
                </div>
                <p className="text-xs text-gray-600">
                  Téléchargez et consultez les comptes-rendus, statuts et règlements de l'association.
                </p>
              </Link>

              {/* Carte Calendrier des réunions */}
              <Link 
                href="/bureau/calendar"
                className="block bg-white border rounded-xl p-6 shadow-sm hover:border-purple-500 transition space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-800">📅 Calendrier des réunions</h3>
                  <span className="text-xs text-purple-700 font-medium">Accéder →</span>
                </div>
                <p className="text-xs text-gray-600">
                  Consulter les dates des réunions de préparation et points internes.
                </p>
              </Link>

              {/* Carte Gestion du Trombinoscope */}
              <Link 
                href="/bureau/team"
                className="block bg-white border rounded-xl p-6 shadow-sm hover:border-purple-500 transition space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-800">👥 Trombinoscope (Qui sommes-nous)</h3>
                  <span className="text-xs text-purple-700 font-medium">Gérer →</span>
                </div>
                <p className="text-xs text-gray-600">
                  Ajouter ou modifier les membres de l'équipe affichés publiquement.
                </p>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
            Accès restreint. Cet espace est réservé aux membres du bureau et de l'administration.
          </div>
        )}
      </main>
    </div>
  )
}