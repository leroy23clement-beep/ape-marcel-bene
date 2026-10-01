'use client'

import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PrivacyPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function loadUser() {
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
    }
    loadUser()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {user && <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />}

      <main className="mx-auto max-w-3xl p-6 my-8 bg-white border rounded-xl shadow-sm space-y-6 text-gray-800">
        <h1 className="text-2xl font-bold border-b pb-4">Protection des données et confidentialité (RGPD)</h1>
        
        <div className="space-y-4 text-sm leading-relaxed">
          <h2 className="font-bold text-base text-purple-900">1. Traitement des données personnelles</h2>
          <p>
            L'Association des Parents d'Élèves (APE) Marcel Béné traite des données personnelles (noms, prénoms, adresses e-mail, rôles) collectées lors de l'inscription ou de l'utilisation de la plateforme. Ces données sont strictement réservées à un usage interne pour la gestion des comptes, des tâches du bureau et des commandes de l'association.
          </p>

          <h2 className="font-bold text-base text-purple-900">2. Vos droits (Accès, Modification, Suppression)</h2>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi « Informatique et Libertés », vous disposez d'un droit total d'accès, de rectification, de portabilité et d'effacement de vos données personnelles, ainsi que d'un droit d'opposition à leur traitement.
          </p>

          <h2 className="font-bold text-base text-purple-900">3. Comment exercer vos droits ?</h2>
          <p>
            Pour toute question relative à vos données ou pour demander la modification ou la suppression de votre compte et de vos informations, vous pouvez contacter directement le bureau de l'association :
          </p>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 font-medium text-purple-900 w-fit">
            📧 Email de contact : ape.marcelbene@gmail.com
          </div>
        </div>

        <div className="pt-4 border-t">
          <a href="/dashboard" className="text-xs text-purple-700 hover:underline font-medium">
            ← Retour au tableau de bord
          </a>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-500">
        © 2026 APE Marcel Béné - Tous droits réservés.
      </footer>
    </div>
  )
}