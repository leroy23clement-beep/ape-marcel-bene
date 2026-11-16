import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Navbar from "@/components/Navbar";
import { updateUserRole, updateAssociationStats } from "@/lib/actions/admin";
import { ALL_ROLES } from "@/types/roles";
import AdminFormFeedback from "@/components/AdminFormFeedback";
import ExportCSVButton from "@/components/ExportCSVButton";

// Libellés des rôles : la liste des valeurs vient de `types/roles.ts`, source
// unique. Avant, cet écran proposait des rôles que les autres pages ne
// reconnaissaient pas (ex. « vice_president » n'ouvrait aucun accès).
const ROLE_LABELS: Record<string, string> = {
  parent: "Parent d'élève",
  membre_codir: "Membre du CODIR",
  bureau: "Membre du bureau",
  president: "Président(e)",
  vice_president: "Vice-Président(e)",
  secretaire: "Secrétaire",
  vice_secretaire: "Vice-Secrétaire",
  tresorier: "Trésorier(e)",
  vice_tresorier: "Vice-Trésorier(e)",
  admin: "Administrateur",
}

const ROLES = ALL_ROLES.filter((role) => role !== "parent").map((role) => ({
  value: role,
  label: ROLE_LABELS[role] ?? role,
}))

/** Enveloppe l'action pour rediriger avec le résultat (affiché par AdminFormFeedback). */
async function updateAssociationStatsAction(formData: FormData) {
  "use server"
  const result = await updateAssociationStats(formData)
  revalidatePath("/admin")
  redirect(result.ok ? "/admin?ok=1" : `/admin?error=${encodeURIComponent(result.error ?? "Erreur")}`)
}

async function updateUserRoleAction(formData: FormData) {
  "use server"
  const result = await updateUserRole(formData)
  revalidatePath("/admin")
  redirect(result.ok ? "/admin?ok=1" : `/admin?error=${encodeURIComponent(result.error ?? "Erreur")}`)
}

export default async function AdminPage({
  searchParams,
}: {
  // Next 16 : `searchParams` est une Promise. On s'en sert pour réafficher le
  // résultat des formulaires (`?ok=1` / `?error=...`).
  searchParams?: Promise<{ ok?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {}
  const formState = { ok: params.ok === "1", error: params.error }
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as any;

  if (!profile || (profile.role !== "president" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  // Récupération des membres
  const { data: membersData } = await supabase
    .from("profiles")
    .select("*")
    .order("last_name", { ascending: true });

  const members = (membersData || []) as any[];

  // Récupération des statistiques actuelles de l'association
  const { data: stats } = await supabase
    .from("association_stats")
    .select("*")
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email ?? ""} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-4xl p-6 space-y-6">
        <AdminFormFeedback state={formState} />
        <header className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Administration & Bureau CODIR</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gérez la composition du bureau, les finances et attribuez les rôles.
            </p>
          </div>

          <ExportCSVButton members={members ?? []} />
        </header>

        {/* Section Gestion des Indicateurs Financiers */}
        <section className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800 text-base">Indicateurs financiers de l'association</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Ces montants s'afficheront directement sur le tableau de bord des familles.
            </p>
          </div>

          <form action={updateAssociationStatsAction} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Bénéfices Manifestations (€)
              </label>
              <input
                type="number"
                step="0.01"
                name="totalProfits"
                defaultValue={stats?.total_profits ?? 0}
                required
                className="w-full p-2 border rounded-lg text-sm text-gray-900 focus:outline-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Dépensé pour les écoles (€)
              </label>
              <input
                type="number"
                step="0.01"
                name="totalSchoolExpenses"
                defaultValue={stats?.total_school_expenses ?? 0}
                required
                className="w-full p-2 border rounded-lg text-sm text-gray-900 focus:outline-purple-600"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="bg-black hover:bg-gray-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition cursor-pointer"
              >
                Mettre à jour les chiffres
              </button>
            </div>
          </form>
        </section>

        {/* Section Liste des membres */}
        <section className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="font-semibold text-gray-800 text-sm">Liste des membres ({members?.length ?? 0})</h2>
          </div>

          <div className="divide-y">
            {members && members.length > 0 ? (
              members.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {member.first_name && member.last_name
                        ? `${member.first_name} ${member.last_name}`
                        : "Nom non renseigné"}
                    </p>
                    <p className="text-xs text-gray-500">{member.id}</p>
                  </div>

                  <form action={updateUserRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={member.id} />
                    <select
                      name="role"
                      defaultValue={member.role}
                      className="text-xs p-2 rounded-lg border bg-white focus:outline-purple-600 text-gray-900"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-medium px-3 py-2 rounded-lg transition cursor-pointer"
                    >
                      Modifier
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <p className="p-4 text-sm text-gray-500 italic">Aucun membre enregistré.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}