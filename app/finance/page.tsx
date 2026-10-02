'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

export default function FinancePage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  // États du formulaire d'ajout de transaction
  const [type, setType] = useState('expense') // 'income' (Recette) ou 'expense' (Dépense)
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [eventId, setEventId] = useState('')
  
  const [eventsList, setEventsList] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Totaux globaux
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)

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

      fetchEvents()
      fetchTransactions()
    }
    loadData()
  }, [])

  async function fetchEvents() {
    const { data } = await supabase.from('events').select('id, title')
    if (data) setEventsList(data)
  }

  async function fetchTransactions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*, events(title)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Erreur chargement transactions", error)
    } else if (data) {
      setTransactions(data)
      
      // Calcul des totaux
      let income = 0
      let expense = 0
      data.forEach(t => {
        if (t.type === 'income' || t.type === 'Recette (Entrée)') {
          income += Number(t.amount) || 0
        } else {
          expense += Number(t.amount) || 0
        }
      })
      setTotalIncome(income)
      setTotalExpense(expense)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    // Insertion avec libellé et catégorie optionnels (envoyés en null si vides)
    const { error } = await supabase.from('transactions').insert([
      {
        type,
        amount: parseFloat(amount),
        title: title.trim() ? title.trim() : null,
        category: category.trim() ? category.trim() : null,
        event_id: eventId ? eventId : null,
      },
    ])

    setSubmitting(false)

    if (error) {
      alert("Erreur lors de l'enregistrement : " + error.message)
    } else {
      // Réinitialisation du formulaire
      setAmount('')
      setTitle('')
      setCategory('')
      setEventId('')
      // Rechargement des données
      fetchTransactions()
    }
  }

  if (!user) return null

  const netBalance = totalIncome - totalExpense

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-5xl p-6 space-y-8">
        <header className="border-b pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trésorerie & Finances - APE Marcel Béné</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gestion centralisée des recettes, des dépenses et du suivi budgétaire de l'association.
            </p>
          </div>
          <button
            onClick={fetchTransactions}
            className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-2 rounded-lg font-medium transition cursor-pointer"
          >
            🔄 Actualiser
          </button>
        </header>

        {/* Indicateurs Globaux */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Recettes</span>
            <div className="text-3xl font-extrabold text-emerald-600">
              {totalIncome.toFixed(2)} €
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Dépenses</span>
            <div className="text-3xl font-extrabold text-red-600">
              {totalExpense.toFixed(2)} €
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Solde Net Global</span>
            <div className={`text-3xl font-extrabold ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {netBalance.toFixed(2)} €
            </div>
          </div>
        </div>

        {/* Formulaire d'ajout de transaction */}
        <div className="bg-white border rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-extrabold text-gray-900">Ajouter une Recette ou une Dépense</h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Type de mouvement</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-gray-900 text-sm bg-white"
                >
                  <option value="expense">Dépense (Sortie)</option>
                  <option value="income">Recette (Entrée)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Libellé / Intitulé (optionnel)</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Ex: Achat matériel kermesse"
                  className="w-full p-2.5 border rounded-lg text-gray-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Montant (€) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  required
                  placeholder="0.00"
                  className="w-full p-2.5 border rounded-lg text-gray-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Catégorie (optionnel)</label>
                <input 
                  type="text" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  placeholder="Ex: Matériel, Subvention, Cotisation"
                  className="w-full p-2.5 border rounded-lg text-gray-900 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium text-gray-700 mb-1">Événement associé (optionnel)</label>
                <select 
                  value={eventId} 
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-gray-900 text-sm bg-white"
                >
                  <option value="">-- Aucun / Général --</option>
                  {eventsList.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold cursor-pointer disabled:opacity-50 text-sm"
              >
                {submitting ? 'Enregistrement en cours...' : 'Enregistrer la transaction'}
              </button>
            </div>
          </form>
        </div>

        {/* Historique des transactions */}
        <section className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-800 text-sm">Historique des Transactions</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Chargement des transactions...</div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/70 border-b text-xs text-gray-500 uppercase">
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Type</th>
                    <th className="p-4 font-semibold">Libellé / Catégorie</th>
                    <th className="p-4 font-semibold">Événement</th>
                    <th className="p-4 font-semibold text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((t) => {
                    const isIncome = t.type === 'income' || t.type === 'Recette (Entrée)'
                    return (
                      <tr key={t.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 text-xs text-gray-500">
                          {new Date(t.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isIncome ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {isIncome ? 'Recette' : 'Dépense'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{t.title || 'Sans libellé'}</div>
                          <div className="text-xs text-gray-500">{t.category || 'Aucune catégorie'}</div>
                        </td>
                        <td className="p-4 text-xs text-gray-600">
                          {t.events?.title || 'Général'}
                        </td>
                        <td className={`p-4 text-right font-bold text-base ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'}{Number(t.amount).toFixed(2)} €
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-400 italic">
              Aucune transaction enregistrée pour le moment.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}