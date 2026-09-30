import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

export default async function MembershipPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

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
              href="https://www.helloasso.com/associations/association-de-parents-d-eleves-de-l-ecole-marcel-bene-muizon/formulaires/1"
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
      </main>
    </div>
  );
}