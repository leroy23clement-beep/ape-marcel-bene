import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { updateProfile } from "@/lib/actions/profile";
import { addChild } from "@/lib/actions/children";

const ROLE_LABELS: Record<string, string> = {
  parent: "Parent d'élève",
  membre_codir: "Membre du CODIR",
  president: "Président(e)",
  vice_president: "Vice-Président(e)",
  secretaire: "Secrétaire",
  vice_secretaire: "Vice-Secrétaire",
  tresorier: "Trésorier(e)",
  vice_tresorier: "Vice-Trésorier(e)",
  admin: "Administrateur",
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, households(*)")
    .eq("id", user.id)
    .single();

  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("household_id", profile?.household_id ?? "");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-4xl p-6 space-y-8">
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gérez vos informations personnelles, votre rôle et la composition de votre foyer.
          </p>
        </header>

        {/* Informations Personnelles */}
        <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-lg font-semibold text-gray-800">Informations Personnelles</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              {ROLE_LABELS[profile?.role ?? "parent"] || profile?.role}
            </span>
          </div>

          <form action={updateProfile} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Prénom</label>
              <input
                type="text"
                name="first_name"
                defaultValue={profile?.first_name ?? ""}
                placeholder="Votre prénom"
                className="w-full text-sm p-2.5 rounded-lg border bg-white focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Nom</label>
              <input
                type="text"
                name="last_name"
                defaultValue={profile?.last_name ?? ""}
                placeholder="Votre nom"
                className="w-full text-sm p-2.5 rounded-lg border bg-white focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Email (non modifiable)</label>
              <input
                type="email"
                disabled
                value={user.email ?? ""}
                className="w-full text-sm p-2.5 rounded-lg border bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Téléphone</label>
              <input
                type="tel"
                name="phone"
                defaultValue={profile?.phone ?? ""}
                placeholder="06 00 00 00 00"
                className="w-full text-sm p-2.5 rounded-lg border bg-white focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </section>

        {/* Section Enfants du foyer */}
        <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">Enfants du foyer</h2>

          {/* Liste des enfants existants */}
          <div className="space-y-2">
            {children && children.length > 0 ? (
              children.map((child) => (
                <div key={child.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{child.first_name} {child.last_name}</p>
                    {child.class_level && (
                      <p className="text-xs text-gray-500">Classe : {child.class_level}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">Aucun enfant enregistré dans le foyer pour le moment.</p>
            )}
          </div>

          {/* Formulaire d'ajout d'enfant */}
          <div className="pt-4 border-t space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Ajouter un enfant</h3>
            <form action={addChild} className="grid gap-3 md:grid-cols-3">
              <input
                type="text"
                name="first_name"
                required
                placeholder="Prénom"
                className="text-sm p-2.5 rounded-lg border bg-white"
              />
              <input
                type="text"
                name="last_name"
                required
                placeholder="Nom"
                className="text-sm p-2.5 rounded-lg border bg-white"
              />
              <input
                type="text"
                name="class_level"
                placeholder="Classe (ex: PS, CP, CM2)"
                className="text-sm p-2.5 rounded-lg border bg-white"
              />
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="bg-gray-900 hover:bg-black text-white text-xs font-medium px-4 py-2 rounded-lg transition"
                >
                  Ajouter l'enfant
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}