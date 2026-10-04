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

      // Charger les stats existantes
      const { data: existingData } = await supabase
        .from('whatsapp_stats')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingData) {
        setStats(existingData.stats_json || existingData)
      }
    }
    checkUserAndAdmin()
  }, [router])

  // Lecture et remplacement direct par le nouveau fichier analysé
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        
        // Analyse complète du fichier (génère tous les chiffres et les top 3)
        const newAnalysis = parseWhatsAppExport(content)
        setStats(newAnalysis)

        // Nettoyer la table et insérer la nouvelle analyse fraîche
        await supabase.from('whatsapp_stats').delete().neq('id', 0)
        const { error: insertError } = await supabase.from('whatsapp_stats').insert([{ stats_json: newAnalysis }])

        if (insertError) {
          throw insertError
        }

        alert("Fichier analysé et statistiques mises à jour avec succès ! 🎉")
      } catch (error: any) {
        alert("Erreur lors de l'analyse ou de l'enregistrement : " + error.message)
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
            <h1 className="text-2xl font-extrabold text-gray-950">📊 Analyseur WhatsApp</h1>
            <p className="text-xs text-gray-500 mt-1">
              Importe ton export `.txt` WhatsApp. Cela mettra à jour instantanément les compteurs et les classements du bureau.
            </p>
          </div>

          <div className="p-6 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50/50 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-3xl">📱</span>
            <div>
              <label className="cursor-pointer bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition inline-block">
                Sélectionner un fichier d'export (.txt)
                <input 
                  type="file" 
                  accept=".txt" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>
            {loading && <p className="text-xs text-purple-600 font-medium animate-pulse">Analyse en cours...</p>}
          </div>

          {stats && (
            <div className="space-y-6 pt-6 border-t">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                📈 Aperçu des statistiques actuelles
              </h2>

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
                  <p className="text-[11px] text-blue-600 font-bold uppercase">🏫 Mentions école</p>
                  <p className="text-2xl font-extrabold text-blue-900 mt-1">{stats.citeCount}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                  <p className="text-[11px] text-emerald-600 font-bold uppercase">❓ Questions</p>
                  <p className="text-2xl font-extrabold text-emerald-900 mt-1">{stats.questionCount}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}