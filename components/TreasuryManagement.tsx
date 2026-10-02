'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client'; // Utilisation du client standard

interface Transaction {
  id: string;
  type: 'recette' | 'depense';
  title: string;
  amount: number;
  category: string;
  event_name?: string;
  receipt_url?: string;
  date: string;
}

export default function TreasuryManagement() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États du formulaire
  const [type, setType] = useState<'recette' | 'depense'>('recette');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [eventName, setEventName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Erreur chargement transactions:', error);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !category) return;

    setSubmitting(true);
    let receiptUrl = '';

    try {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('bureau-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('bureau-documents')
          .getPublicUrl(filePath);

        receiptUrl = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase.from('transactions').insert([
        {
          type,
          title,
          amount: parseFloat(amount),
          category,
          event_name: eventName || 'Général',
          receipt_url: receiptUrl,
          date: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      setTitle('');
      setAmount('');
      setCategory('');
      setEventName('');
      setFile(null);
      fetchTransactions();
    } catch (error) {
      console.error('Erreur lors de l’ajout :', error);
      alert('Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalRecettes = transactions
    .filter((t) => t.type === 'recette')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalDepenses = transactions
    .filter((t) => t.type === 'depense')
    .reduce((acc, t) => acc + t.amount, 0);

  const soldeGlobal = totalRecettes - totalDepenses;

  const eventsSummary = transactions.reduce((acc: any, t) => {
    const ev = t.event_name || 'Général';
    if (!acc[ev]) acc[ev] = { recettes: 0, depenses: 0 };
    if (t.type === 'recette') acc[ev].recettes += t.amount;
    else acc[ev].depenses += t.amount;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Trésorerie & Finances - APE Marcel Béné</h1>
      </div>

      {/* Tableau de bord Global */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 border border-green-200 p-6 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-green-600">Total Recettes</p>
          <p className="text-3xl font-bold text-green-700">{totalRecettes.toFixed(2)} €</p>
        </div>
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-red-600">Total Dépenses</p>
          <p className="text-3xl font-bold text-red-700">{totalDepenses.toFixed(2)} €</p>
        </div>
        <div className={`p-6 rounded-xl shadow-sm border ${soldeGlobal >= 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
          <p className="text-sm font-medium">Solde Net Global</p>
          <p className="text-3xl font-bold">{soldeGlobal.toFixed(2)} €</p>
        </div>
      </div>

      {/* Formulaire de Saisie */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Ajouter une Recette ou une Dépense</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type de mouvement</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'recette' | 'depense')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-gray-900 bg-white"
            >
              <option value="recette">Recette (Entrée)</option>
              <option value="depense">Dépense (Sortie)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Libellé / Intitulé</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Achat matériel kermesse"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Montant (€)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Catégorie</label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="ex: Matériel, Subvention, Cotisation"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Événement associé (Optionnel)</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="ex: Fête des Enfants 2026"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Justificatif (Photo ou PDF)</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition cursor-pointer"
            >
              {submitting ? 'Enregistrement en cours...' : 'Enregistrer la transaction'}
            </button>
          </div>
        </form>
      </div>

      {/* Bilan détaillé par Événement */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Bilan détaillé par Événement</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Événement</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Recettes (€)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Dépenses (€)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Résultat Net (€)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.keys(eventsSummary).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Aucune donnée financière enregistrée.</td>
                </tr>
              ) : (
                Object.entries(eventsSummary).map(([evName, data]: [string, any]) => {
                  const net = data.recettes - data.depenses;
                  return (
                    <tr key={evName}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{evName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-semibold">+{data.recettes.toFixed(2)} €</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-red-600 font-semibold">-{data.depenses.toFixed(2)} €</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {net.toFixed(2)} €
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historique Complet */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Historique des Transactions</h2>
        {loading ? (
          <p className="text-gray-500">Chargement...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie / Événement</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Justificatif</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(t.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${t.type === 'recette' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {t.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {t.category} <span className="text-xs text-gray-400">({t.event_name})</span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${t.type === 'recette' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'recette' ? '+' : '-'}{t.amount.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      {t.receipt_url ? (
                        <a href={t.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Voir fichier
                        </a>
                      ) : (
                        <span className="text-gray-400">Aucun</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}