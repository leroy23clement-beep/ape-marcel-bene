import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function ProfitsDetailsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Récupération des événements futurs depuis Supabase
  const { data: dbEvents } = await supabase
    .from("events")
    .select("id, title, event_date, revenue, expenses")
    .order("event_date", { ascending: false });

  // Événement historique (Fête des enfants du 26 septembre 2026)
  const manualEvent = {
    id: "fete-enfants-2026",
    title: "Fête des enfants",
    event_date: "2026-09-26",
    revenue: 5206.50,
    expenses: 2104.94,
  };

  // On combine l'événement manuel et ceux de la base de données
  const events = [manualEvent, ...(dbEvents || [])];

  // Calcul du total cumulé des bénéfices
  const totalProfits = events.reduce((acc, ev) => {
    return acc + ((ev.revenue || 0) - (ev.expenses || 0));
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <div className="mx-auto max-w-4xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Détail des bénéfices par manifestation</h1>
          <Link href="/dashboard" className="text-sm font-medium text-purple-700 hover:underline">
            ← Retour au tableau de bord
          </Link>
        </div>

        {/* Encadré récapitulatif du total */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-purple-900">Bénéfice total cumulé :</span>
          <span className="text-lg font-bold text-purple-700">+ {totalProfits.toFixed(2)} €</span>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 font-semibold text-xs uppercase tracking-wider text-gray-600 grid grid-cols-4 gap-4">
            <span>Événement</span>
            <span className="text-right">Recettes</span>
            <span className="text-right">Dépenses</span>
            <span className="text-right">Bénéfice net</span>
          </div>

          <div className="divide-y divide-gray-200">
            {events.map((event) => {
              const rev = event.revenue || 0;
              const exp = event.expenses || 0;
              const net = rev - exp;

              return (
                <div key={event.id} className="p-4 grid grid-cols-4 gap-4 items-center text-sm">
                  <div>
                    <p className="font-bold text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {event.event_date ? new Date(event.event_date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      }) : "Date non renseignée"}
                    </p>
                  </div>
                  <span className="text-right text-gray-700 font-medium">{rev.toFixed(2)} €</span>
                  <span className="text-right text-red-600 font-medium">- {exp.toFixed(2)} €</span>
                  <span className="text-right text-purple-700 font-bold bg-purple-50 py-1 px-2 rounded">
                    + {net.toFixed(2)} €
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}