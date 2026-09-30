import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { addChild } from "@/lib/actions/children";
import Navbar from "@/components/Navbar";
import Link from "next/link";

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

  // Récupération des prochains événements à venir
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(3);

  // Récupération des ventes en cours (table products)
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  // Récupération des statistiques financières de l'association depuis Supabase
  const { data: stats } = await supabase
    .from("association_stats")
    .select("*")
    .single();

  // Calcul du bénéfice historique (Fête des enfants : 5206.50 € de recettes - 2104.94 € de dépenses)
  const feteEnfantsProfit = 5206.50 - 2104.94; // 3101.56 €
  
  // Total global des bénéfices (on additionne la base de données s'il y a d'autres événements + l'événement historique)
  const dbProfits = stats?.total_profits ?? 0;
  const totalProfits = dbProfits + feteEnfantsProfit;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de navigation */}
      <Navbar 
        userEmail={user.email} 
        firstName={profile?.first_name} 
        role={profile?.role} 
      />

      <div className="mx-auto max-w-4xl p-6 flex flex-col space-y-6">
        
        {/* 1. Indicateurs Financiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Bloc Bénéfices Cliquable */}
          <Link 
            href="/dashboard/profits"
            className="rounded-xl border bg-white p-5 shadow-sm flex items-center justify-between hover:border-purple-500 transition cursor-pointer group"
          >
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider group-hover:text-purple-700 transition">
                Bénéfices Manifestations (Année) ↗
              </p>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                {totalProfits.toFixed(2)} €
              </p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-700 rounded-full text-lg">
              💶
            </div>
          </Link>

          <div className="rounded-xl border bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dépensé pour les écoles
              </p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats?.total_school_expenses ? `${stats.total_school_expenses} €` : "0 €"}
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full text-lg">
              🏫
            </div>
          </div>
        </div>

        {/* 2. Boutique & Ventes en cours */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="font-semibold text-gray-800 text-lg">
              Boutique & Ventes en cours
            </h2>
            <Link 
              href="/shop" 
              className="text-xs font-medium text-purple-700 hover:underline"
            >
              Voir la boutique ↗
            </Link>
          </div>

          <div className="space-y-3">
            {products && products.length > 0 ? (
              products.map((product) => (
                <Link
                  key={product.id}
                  href="/shop"
                  className="block p-4 bg-gray-50 border rounded-lg space-y-2 hover:border-purple-500 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 whitespace-nowrap">
                      {product.price ? (typeof product.price === 'number' ? `${product.price.toFixed(2)} €` : product.price) : ""}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">
                Aucune vente en cours pour le moment.
              </p>
            )}
          </div>
        </div>

        {/* 3. Prochains Événements */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="font-semibold text-gray-800 text-lg">
              Prochains Événements
            </h2>
            <Link 
              href="/events" 
              className="text-xs font-medium text-purple-700 hover:underline"
            >
              Voir les événements ↗
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events#event-${event.id}`}
                  className="block p-3 bg-gray-50 border rounded-lg space-y-1 hover:bg-gray-100 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm text-gray-900">{event.title}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      {new Date(event.event_date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  {event.location && (
                    <p className="text-xs text-gray-500">📍 {event.location}</p>
                  )}
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">
                Aucun événement à venir pour le moment.
              </p>
            )}
          </div>
        </div>

        {/* 4. Mon Foyer & Enfants */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">
            Mon Foyer & Enfants
          </h2>

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
                className="p-2 border rounded-md text-sm text-gray-900"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Nom"
                defaultValue={profile?.last_name ?? ""}
                required
                className="p-2 border rounded-md text-sm text-gray-900"
              />
            </div>
            <select
              name="className"
              required
              className="w-full p-2 border rounded-md text-sm bg-white text-gray-900"
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
              className="w-full bg-black text-white text-sm py-2 rounded-md hover:bg-gray-800 transition cursor-pointer"
            >
              + Enregistrer l'enfant
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}