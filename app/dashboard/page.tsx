import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { addChild } from "@/lib/actions/children";
import Navbar from "@/components/Navbar";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Profil & Foyer
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, households(*)")
    .eq("id", user.id)
    .single();

  // Liste des enfants du foyer
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("household_id", profile?.household_id ?? "");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de navigation */}
      <Navbar 
  userEmail={user.email} 
  firstName={profile?.first_name} 
  role={profile?.role} 
/>

      <div className="mx-auto max-w-4xl p-6 space-y-6">
        <main className="grid gap-6 md:grid-cols-2">
          {/* Section Foyer & Enfants */}
          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">
              Mon Foyer & Enfants
            </h2>

            {/* Liste des enfants */}
            <div className="space-y-2">
              {children && children.length > 0 ? (
                children.map((child) => (
                  <div
                    key={child.id}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {child.first_name} {child.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Classe : {child.class_name}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Aucun enfant enregistré pour le moment.
                </p>
              )}
            </div>

            {/* Formulaire rapide d'ajout */}
            <form action={addChild} className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700">
                Ajouter un enfant
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="firstName"
                  placeholder="Prénom"
                  required
                  className="p-2 border rounded-md text-sm"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Nom"
                  defaultValue={profile?.last_name ?? ""}
                  required
                  className="p-2 border rounded-md text-sm"
                />
              </div>
              <select
                name="className"
                required
                className="w-full p-2 border rounded-md text-sm bg-white"
              >
                <option value="">Sélectionner la classe...</option>
                <option value="TPS">TPS</option>
                <option value="PS">PS</option>
                <option value="MS">MS</option>
                <option value="GS">GS</option>
                <option value="CP">CP</option>
                <option value="CE1">CE1</option>
                <option value="CE2">CE2</option>
                <option value="CM1">CM1</option>
                <option value="CM2">CM2</option>
              </select>
              <button
                type="submit"
                className="w-full bg-black text-white text-sm py-2 rounded-md hover:bg-gray-800 transition"
              >
                + Enregistrer l'enfant
              </button>
            </form>
          </div>

          {/* Section Prochains Événements */}
          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">
              Prochains Événements
            </h2>
            <p className="text-sm text-gray-500">
              Consultez le calendrier des activités de l'APE.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}