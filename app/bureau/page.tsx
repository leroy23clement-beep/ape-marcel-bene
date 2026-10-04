'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import SendNotificationForm from '@/components/SendNotificationForm'

export default function BureauPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [whatsappStats, setWhatsappStats] = useState<any>(null)
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

      const { data: statsData } = await supabase
        .from('whatsapp_stats')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (statsData) {
        setWhatsappStats(statsData.stats_json || statsData)
      }

      setLoading(false)
    }
    loadData()
  }, [supabase])

  if (loading) return null
  if (!user) return null

  const allowedBureauRoles = ['admin', 'president', 'secretaire', 'tresorier', 'bureau']
  const userRole = profile?.role ? profile.role.toLowerCase() : 'parent'
  const isBureau = allowedBureauRoles.includes(userRole)

  const notificationAllowedRoles = ['admin', 'tresorier', 'secretaire']
  const canSendNotifications = notificationAllowedRoles.includes(userRole)

  // Récupération directe des tableaux exacts renvoyés par le parseur
  const bavardsList = whatsappStats?.topBavardsList || []
  const emojiList = whatsappStats?.topEmojiUsersList || []
  const aperoWordsList = whatsappStats?.topAperoWordsList || []

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
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
              <Link 
                href="/bureau/tresorerie"
                className="block bg-white border rounded-xl p-6 shadow-sm hover:border-purple-500 transition space-y-2 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-800 group-hover:text-purple-700 transition">💰 Gestion de la Trésorerie</h3>
                  <span className="text-xs text-purple-700 font-medium">Accéder →</span>
                </div>
                <p className="text-xs text-gray-600">
                  Saisie des recettes, des dépenses, bilans par événement et ajout des justificatifs (photos/PDF).
                </p>
              </Link>

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

              <Link 
                href="/admin/whatsapp"
                className="block bg-purple-50 border border-purple-200 rounded-xl p-6 shadow-sm hover:border-purple-500 transition space-y-2 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-purple-900 group-hover:text-purple-700 transition">📊 Gérer les stats WhatsApp</h3>
                  <span className="text-xs text-purple-700 font-medium">Importer un fichier →</span>
                </div>
                <p className="text-xs text-purple-700">
                  Importer un nouvel export `.txt` pour mettre à jour et cumuler les statistiques du bureau.
                </p>
              </Link>
            </div>

            {/* Widget des Statistiques WhatsApp cumulées (Top 3 et Indicateurs) */}
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span>📈</span> Le Baromètre WhatsApp du Bureau (Cumulé)
              </h2>

              {whatsappStats ? (
                <div className="space-y-6">
                  {/* Chiffres clés */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-center">
                      <p className="text-[10px] text-purple-600 font-bold uppercase">Messages totaux</p>
                      <p className="text-xl font-extrabold text-purple-900 mt-0.5">{whatsappStats.totalMessages}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-center">
                      <p className="text-[10px] text-amber-600 font-bold uppercase">🍻 Compteur Apéro</p>
                      <p className="text-xl font-extrabold text-amber-900 mt-0.5">{whatsappStats.aperoCount}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                      <p className="text-[10px] text-blue-600 font-bold uppercase">🏫 Mentions de l'école</p>
                      <p className="text-xl font-extrabold text-blue-900 mt-0.5">{whatsappStats.citeCount}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">❓ Questions</p>
                      <p className="text-xl font-extrabold text-emerald-900 mt-0.5">{whatsappStats.questionCount}</p>
                    </div>
                  </div>

                  {/* Top 3 : Bavards & Emojis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top 3 Bavards */}
                    <div className="bg-gray-50 p-4 rounded-xl border space-y-2">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🏆</span> Top 3 des plus gros bavards
                      </h3>
                      <div className="space-y-1.5">
                        {bavardsList.length > 0 ? (
                          bavardsList.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border">
                              <span className="font-semibold text-gray-800">{index + 1}. {item.name}</span>
                              <span className="font-extrabold text-purple-700">{item.count} msgs</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 italic">Aucune donnée disponible</p>
                        )}
                      </div>
                    </div>

                    {/* Top 3 Emojis */}
                    <div className="bg-gray-50 p-4 rounded-xl border space-y-2">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span>👑</span> Top 3 Rois/Reines des Emojis
                      </h3>
                      <div className="space-y-1.5">
                        {emojiList.length > 0 ? (
                          emojiList.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border">
                              <span className="font-semibold text-gray-800">{index + 1}. {item.name}</span>
                              <span className="font-extrabold text-purple-700">{item.count} emojis</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 italic">Aucune donnée disponible</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top 3 Variantes du mot Apéro */}
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-2">
                    <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🍻</span> Top 3 des mots "Apéro" & Variantes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {aperoWordsList.length > 0 ? (
                        aperoWordsList.map((word: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-amber-200">
                            <span className="font-semibold text-gray-800 capitalize">"{word.keyword}"</span>
                            <span className="font-extrabold text-amber-800">{word.count} fois</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 italic col-span-3">Aucune variante détectée</p>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  Aucune statistique disponible pour le moment. Importe un premier fichier `.txt` via le bouton de gestion ci-dessus !
                </p>
              )}
            </div>

            {/* Section Notifications Push */}
            {canSendNotifications ? (
              <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4 pt-6 mt-6 border-t">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">🚀 Diffusion de notifications push</h2>
                  <p className="text-xs text-gray-600 mt-1">
                    Envoyez une alerte instantanée sur les téléphones des parents abonnés.
                  </p>
                </div>
                <SendNotificationForm />
              </div>
            ) : (
              <div className="bg-gray-50 border rounded-xl p-4 text-xs text-gray-500 italic">
                * Le module d'envoi de notifications push est réservé au bureau restreint (Admin, Trésorier, Secrétaire).
              </div>
            )}

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