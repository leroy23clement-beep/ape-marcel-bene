import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { updateUserRole } from "@/lib/actions/admin";
import ExportCSVButton from "@/components/ExportCSVButton";

const ROLES = [
  { value: "parent", label: "Parent d'élève" },
  { value: "membre_codir", label: "Membre du CODIR" },
  { value: "president", label: "Président(e)" },
  { value: "vice_president", label: "Vice-Président(e)" },
  { value: "secretaire", label: "Secrétaire" },
  { value: "vice_secretaire", label: "Vice-Secrétaire" },
  { value: "tresorier", label: "Trésorier(e)" },
  { value: "vice_tresorier", label: "Vice-Trésorier(e)" },
  { value: "admin", label: "Administrateur" },
];

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "president" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .order("last_name", { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-4xl p-6 space-y-6">
        <header className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Administration & Bureau CODIR</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gérez la composition du bureau et attribuez les rôles des utilisateurs inscrits.
            </p>
          </div>

          <ExportCSVButton members={members ?? []} />
        </header>

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

                  <form action={updateUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={member.id} />
                    <select
                      name="role"
                      defaultValue={member.role}
                      className="text-xs p-2 rounded-lg border bg-white focus:outline-purple-600"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
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