'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TreasuryWidget() {
  const [solde, setSolde] = useState<number>(0);
  const [totalRecettes, setTotalRecettes] = useState<number>(0);

  useEffect(() => {
    async function fetchSummary() {
      const { data, error } = await supabase.from('transactions').select('type, amount');
      if (!error && data) {
        const recettes = data.filter((t) => t.type === 'recette').reduce((acc, t) => acc + t.amount, 0);
        const depenses = data.filter((t) => t.type === 'depense').reduce((acc, t) => acc + t.amount, 0);
        setTotalRecettes(recettes);
        setSolde(recettes - depenses);
      }
    }
    fetchSummary();
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
      <div>
        <h3 className="text-lg font-semibold">Trésorerie APE Marcel Béné</h3>
        <p className="text-blue-100 text-sm">Transparence et suivi en temps réel de l'année scolaire</p>
      </div>
      <div className="flex gap-6">
        <div className="bg-white/10 px-4 py-2 rounded-xl text-center">
          <p className="text-xs text-blue-200">Solde Actuel</p>
          <p className="text-xl font-bold">{solde.toFixed(2)} €</p>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-xl text-center">
          <p className="text-xs text-blue-200">Total Recettes</p>
          <p className="text-xl font-bold">{totalRecettes.toFixed(2)} €</p>
        </div>
      </div>
    </div>
  );
}