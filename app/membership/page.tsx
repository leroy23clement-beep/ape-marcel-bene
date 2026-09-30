import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { updateMembershipStatus } from "@/lib/actions/membership";

export default async function MembershipPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isTresorerie = ["tresorier", "vice_tresorier", "president", "admin"].includes(profile?.role ?? "");
  const currentSchoolYear = "2026-2027";

  // Toutes les adhésions / dons (visible pour la trésorerie)
  const { data: allMemberships } = isTresorerie
    ? await supabase
        .from("memberships")
        .select("*, profiles(first_name, last_name)")
        .eq("school_year", currentSchoolYear)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-4xl p-6 space-y-8">
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Soutenir l'Association (Dons)</h1>
          <p className="text-sm text-gray-600 mt-1">
            Participez aux projets de l'école et aidez-nous à financer les activités et sorties des enfants.
          </p>
        </header>

        {/* Section Redirection HelloAsso */}
        <section className="bg-white border rounded-xl p-8 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
            ❤️
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Faire un don en ligne via HelloAsso</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Les dons recueillis servent directement à organiser les événements (comme la fête de l'école) et à acheter du matériel pédagogique pour les élèves.
            </p>
          </div>

          <div className="pt-2">
            <a
              href="https://www.helloasso.com/associations/association-de-parents-d-eleves-de-l-ecole-marcel-bene-muizon/formulaires/1" // Remplace par ton lien HelloAsso exact
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-6 py-3 rounded-xl transition shadow-sm cursor-pointer"
            >
              Accéder à notre page de don HelloAsso ↗
            </a>
          </div>

          <p className="text-xs text-gray-400">
            Paiement 100% sécurisé via la plateforme HelloAsso.
          </p>
        </section>

        {/* Espace Trésorerie : Gestion des versements / dons */}
        {isTresorerie && (
          <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800">
              Gestion de la trésorerie — Dons {currentSchoolYear}
            </h2>

            <div className="divide-y text-sm">
              {allMemberships && allMemberships.length > 0 ? (
                allMemberships.map((m) => (
                  <div key={m.id} className="py-3 flex justify-between items-center gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {m.profiles?.first_name} {m.profiles?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {m.amount.toFixed(2)} € — via {m.payment_method}
                      </p>
                    </div>

                    <form action={updateMembershipStatus} className="flex items-center gap-2">
                      <input type="hidden" name="membershipId" value={m.id} />
                      <select
                        name="status"
                        defaultValue={m.status}
                        className="text-xs p-1.5 rounded-lg border bg-white text-gray-900"
                      >
                        <option value="pending">En attente</option>
                        <option value="validated">Validé</option>
                        <option value="rejected">Refusé</option>
                      </select>
                      <button
                        type="submit"
                        className="bg-purple-700 hover:bg-purple-800 text-white text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        Mettre à jour
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic py-2">Aucun don enregistré pour le moment.</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}