'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ForecastsManagement() {
  const supabase = createClient()
  const [items, setItems] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [attendees, setAttendees] = useState<number>(100)
  const [loading, setLoading] = useState(true)

  const defaultRatios: Record<string, number> = {
    Buvette: 0.7,
    Restauration: 0.5,
    Fournitures: 0.2,
  }

  useEffect(() => {
    async function loadData() {
      // Récupération des articles et des achats (avec dates de péremption)
      const { data: itemsData } = await supabase.from('inventory_items').select('*').order('name', { ascending: true })
      const { data: purchasesData } = await supabase.from('inventory_purchases').select('*').order('expiration_date', { ascending: true })
      
      if (itemsData) setItems(itemsData)
      if (purchasesData) setPurchases(purchasesData)
      setLoading(false)
    }
    loadData()
  }, [supabase])

  // Fonction pour trouver la date de péremption la plus proche pour un article donné
  const getNearestExpiration = (itemId: string) => {
    const itemPurchases = purchases.filter(p => p.item_id === itemId && p.expiration_date)
    if (itemPurchases.length === 0) return null
    return itemPurchases[0].expiration_date // Déjà trié par ordre croissant
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500 text-sm">Calcul des prévisions intelligentes...</div>
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Assistant Prévisions & Péremptions</h1>
        <p className="text-sm text-gray-600 mt-1">
          Estimez vos besoins de commande en fonction des participants et suivez les dates limites de consommation.
        </p>
      </header>

      {/* Simulateur */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-3">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Nombre de participants attendus (enfants + parents)
        </label>
        <div className="flex gap-4 items-center">
          <input
            type="number"
            min="10"
            value={attendees}
            onChange={(e) => setAttendees(parseInt(e.target.value, 10) || 0)}
            className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-xs text-gray-500 italic">Mise à jour en temps réel</span>
        </div>
      </div>

      {/* Tableau des recommandations et péremptions */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <span>🤖</span> Recommandations & Analyse des Stocks pour {attendees} personnes
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="pb-3">Article</th>
                <th className="pb-3">Catégorie</th>
                <th className="pb-3 text-center">Stock Actuel</th>
                <th className="pb-3 text-center">Prochaine Péremption</th>
                <th className="pb-3 text-center">Besoin Estimé</th>
                <th className="pb-3 text-right">À Commander</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500 italic">
                    Ajoutez d'abord des articles dans la Réserve pour afficher les prévisions.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const ratio = defaultRatios[item.category] || 0.5
                  const totalNeeded = Math.ceil(attendees * ratio)
                  const toOrder = Math.max(0, totalNeeded - item.current_stock)
                  const nearestExp = getNearestExpiration(item.id)

                  // Vérification si la péremption est proche (dans les 30 prochains jours par exemple)
                  let isExpiringSoon = false
                  if (nearestExp) {
                    const expDate = new Date(nearestExp)
                    const today = new Date()
                    const diffTime = expDate.getTime() - today.getTime()
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    if (diffDays <= 30) isExpiringSoon = true
                  }

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-3 font-semibold text-gray-900">{item.name}</td>
                      <td className="py-3 text-gray-600">{item.category}</td>
                      <td className="py-3 text-center text-gray-600">{item.current_stock} {item.unit}</td>
                      <td className="py-3 text-center">
                        {nearestExp ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${isExpiringSoon ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
                            {new Date(nearestExp).toLocaleDateString('fr-FR')}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Aucune</span>
                        )}
                      </td>
                      <td className="py-3 text-center font-bold text-gray-800">{totalNeeded}</td>
                      <td className="py-3 text-right">
                        {toOrder > 0 ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                            +{toOrder} {item.unit}
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Stock suffisant
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}