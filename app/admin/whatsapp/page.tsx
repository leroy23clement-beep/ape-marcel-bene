'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { parseWhatsAppExport } from '@/lib/whatsappParser'

export default function WhatsAppStatsAdminPage() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function checkUserAndAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData || profileData.role !== 'admin') {
        router.push('/bureau')
      } else {
        setProfile(profileData)
      }
    }
    checkUserAndAdmin()
  }, [router])

  // Fonction gérant la lecture du fichier texte WhatsApp uploadé
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        // Analyse du texte avec notre parser complet
        const analysisResults = parseWhatsAppExport(content)
        setStats(analysisResults)
      } catch (error: any) {
        alert("Erreur lors de l'analyse du fichier : " + error.message)
      } finally {
        setLoading(false)
      }
    }

    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {user && (
        <Navbar 
          userEmail={user.email} 
          firstName={profile?.first_name} 
          role={profile?.role} 
        />
      )}

      <main className="mx-auto max-w-4xl p-6 space-y-6">
        <div>
          <Link href="/bureau" className="text-xs font-semibold text-purple-700 hover:underline">
            « Retour à l'espace Bureau
          </Link>
        </div>

        <div className="bg-white border rounded-2xl p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-950">📊 Analyseur de WhatsApp - APE</h1>
            <p className="text-xs text-gray-500 mt-1">
              Importe ton fichier d'export WhatsApp (`.txt`) pour générer les statistiques marrantes du bureau.
            </p>
          </div>

          <div className="p-6 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50/50 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-3xl">📱</span>
            <div>
              <label className="cursor-pointer bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition inline-block">
                Sélectionner le fichier d'export (.txt)
                <input 
                  type="file" 
                  accept=".txt" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>
            {loading && <p className="text-xs text-purple-600 font-medium animate-pulse">Analyse des messages en cours...</p>}
          </div>

          {/* Affichage des résultats complets de l'analyse */}
          {stats && (
            <div className="space-y-6 pt-6 border-t">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                🎉 Résultats de l'analyse détaillée
              </h2>

              {/* Grille principale des compteurs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-center">
                  <p className="text-[11px] text-purple-600 font-bold uppercase">Messages totaux</p>
                  <p className="text-2xl font-extrabold text-purple-900 mt-1">{stats.totalMessages}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                  <p className="text-[11px] text-amber-600 font-bold uppercase">🍻 Compteur Apéro</p>
                  <p className="text-2xl font-extrabold text-amber-900 mt-1">{stats.aperoCount}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                  <p className="text-[11px] text-blue-600 font-bold uppercase">📍 Mot "Cité"</p>
                  <p className="text-2xl font-extrabold text-blue-900 mt-1">{stats.citeCount}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                  <p className="text-[11px] text-emerald-600 font-bold uppercase">❓ Questions posées</p>
                  <p className="text-2xl font-extrabold text-emerald-900 mt-1">{stats.questionCount}</p>
                </div>
              </div>

              {/* Statistiques décalées */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border space-y-1">
                  <p className="text-xs font-bold text-gray-800">🏆 Le plus gros bavard :</p>
                  <p className="text-xs text-purple-700 font-extrabold">{stats.topBavard.name} ({stats.topBavard.count} msgs)</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border space-y-1">
                  <p className="text-xs font-bold text-gray-800">👑 Roi/Reine des emojis :</p>
                  <p className="text-xs text-purple-700 font-extrabold">{stats.topEmojiUser.name} ({stats.topEmojiUser.count} emojis)</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border space-y-1">
                  <p className="text-xs font-bold text-gray-800">🌙 Nuit / ☕ Matinaux :</p>
                  <p className="text-xs text-purple-700 font-extrabold">{stats.nightMessagesCount} de nuit / {stats.morningMessagesCount} matins</p>
                </div>
              </div>

              {/* Le Pavé d'or */}
              <div className="bg-purple-900 text-white p-5 rounded-xl space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-200">📜 Le Pavé d'or (Message le plus long) :</p>
                <p className="text-xs italic text-purple-100">"{stats.longestMessage.text}"</p>
                <p className="text-[11px] text-purple-300 text-right">— Envoyé par {stats.longestMessage.author} ({stats.longestMessage.length} caractères)</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}