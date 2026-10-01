'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

export default function FinancePage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [productsSummary, setProductsSummary] = useState<any[]>([])
  const [totalGlobalRevenue, setTotalGlobalRevenue] = useState(0)
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

      // Vérification des droits bureau
      if (profileData?.role === 'parent') {
        window.location.href = '/dashboard'
        return
      }

      fetchFinancialData()
    }
    loadData()
  }, [])

  const fetchFinancialData = async () => {
    setLoading(true)

    // 1. Récupérer tous les produits / ventes
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    // 2. Récupérer toutes les commandes
    const { data: orders, error: ordError } = await supabase
      .from('orders')
      .select('*')

    if (prodError || ordError) {
      console.error("Erreur chargement données financières", prodError || ordError)
      setLoading(false)
      return
    }

    let globalRev = 0

    // 3. Croiser les données pour calculer les totaux par produit/manifestation
    const summary = (products || []).map((product) => {
      // Filtrer les commandes pour ce produit
      const productOrders = (orders || []).filter(o => o.product_id === product.id)
      
      const totalQuantity = productOrders.reduce((acc, order) => acc + (order.quantity || 0), 0)
      const totalRevenue = productOrders.reduce((acc, order) => acc + (order.total_price || (order.quantity * product.price) || 0), 0)

      globalRev += totalRevenue

      return {
        ...product,
        totalQuantity,
        totalRevenue,
        orderCount: productOrders.length
      }
    })

    setProductsSummary(summary)
    setTotalGlobalRevenue(globalRev)
    setLoading(false)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-5xl p-6 space-y-8">
        <header className="border-b pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bilan Financier & Bénéfices</h1>
            <p className="text-sm text-gray-600 mt-1">
              Récapitulatif du chiffre d'affaires et des volumes générés par chaque manifestation.
            </p>
          </div>
          <button
            onClick={fetchFinancialData}
            className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-2 rounded-lg font-medium transition cursor-pointer"
          >
            🔄 Actualiser
          </button>
        </header>

        {/* Indicateur Global */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chiffre d'affaires Global</span>
            <div className="text-3xl font-extrabold text-emerald-600">
              {totalGlobalRevenue.toFixed(2)} €
            </div>
            <p className="text-xs text-gray-400">Total cumulé de l'ensemble des ventes enregistrées.</p>
          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Manifestations / Ventes suivies</span>
            <div className="text-3xl font-extrabold text-purple-700">
              {productsSummary.length}
            </div>
            <p className="text-xs text-gray-400">Nombre total d'événements ou produits référencés.</p>
          </div>
        </div>

        {/* Tableau détaillé par manifestation */}
        <section className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-800 text-sm">Détail par manifestation</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Calcul des données financières...</div>
          ) : productsSummary.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/70 border-b text-xs text-gray-500 uppercase">
                    <th className="p-4 font-semibold">Manifestation / Produit</th>
                    <th className="p-4 font-semibold text-center">Prix unitaire</th>
                    <th className="p-4 font-semibold text-center">Articles vendus</th>
                    <th className="p-4 font-semibold text-right">Chiffre d'affaires</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {productsSummary.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500 line-clamp-1">{item.description || "Aucune description"}</div>
                      </td>
                      <td className="p-4 text-center font-medium text-gray-700">
                        {item.price ? `${item.price.toFixed(2)} €` : 'Gratuit / Externe'}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                          {item.totalQuantity} unités
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-emerald-600 text-base">
                        {item.totalRevenue.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-400 italic">
              Aucune donnée financière pour le moment.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}