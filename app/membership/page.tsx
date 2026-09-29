import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { submitMembership, updateMembershipStatus } from "@/lib/actions/membership";

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

  // Adhésion de l'utilisateur courant
  const { data: myMembership } = await supabase
    .from("memberships")
    .select("*")
    .eq("user_id", user.id)
    .eq("school_year", currentSchoolYear)
    .maybeSingle();

  // Toutes les adhésions (visible pour la trésorerie)
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
          <h1 className="text-2xl font-bold text-gray-900">Adhésion & Cotisation APE</h1>
          <p className="text-sm text-gray-600 mt-1">
            L'adhésion est facultative. Elle permet de soutenir financièrement les activités et sorties organisées pour les enfants.
          </p>
        </header>

        {/* Statut ou Formulaire d'adhésion */}
        <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800">
            Votre adhésion pour l'année {currentSchoolYear}
          </h2>

          {myMembership ? (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex justify-between items-center">
              <div>
                <p className="font-semibold text-emerald-900 text-sm">
                  {myMembership.status === "validated" ? "✓ Adhésion validée" : "⏳ Adhésion en attente de règlement"}
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Montant : {myMembership.amount.toFixed(2)} € ({myMembership.payment_method})
                </p>
              </div>
              <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
                {myMembership.status === "validated" ? "Adhérent" : "En cours"}
              </span>
            </div>
          ) : (
            <form action={submitMembership} className="space-y-4 max-w-lg">
              <input type="hidden" name="schoolYear" value={currentSchoolYear} />

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Montant de la cotisation libre (€)</label>
                <input
                  type="number"
                  name="amount"
                  defaultValue="5.00"
                  min="1"
                  step="0.5"
                  className="w-full text-sm p-2.5 rounded-lg border bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Moyen de règlement</label>
                <select name="paymentMethod" className="w-full text-sm p-2.5 rounded-lg border bg-white">
                  <option value="helloasso">Paiement en ligne (HelloAsso)</option>
                  <option value="chèque">Chèque (à l'ordre de l'APE)</option>
                  <option value="espèces">Espèces</option>
                  <option value="virement">Virement bancaire</option>
                </select>
              </div>

              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
              >
                Adhérer à l'association
              </button>
            </form>
          )}
        </section>

        {/* Espace Trésorerie : Gestion des adhésions */}
        {isTresorerie && (
          <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800">
              Gestion de la trésorerie — Adhésions {currentSchoolYear}
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
                        className="text-xs p-1.5 rounded-lg border bg-white"
                      >
                        <option value="pending">En attente</option>
                        <option value="validated">Validé</option>
                        <option value="rejected">Refusé</option>
                      </select>
                      <button
                        type="submit"
                        className="bg-purple-700 hover:bg-purple-800 text-white text-xs px-3 py-1.5 rounded-lg transition"
                      >
                        Mettre à jour
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic py-2">Aucune adhésion enregistrée pour cette année.</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}