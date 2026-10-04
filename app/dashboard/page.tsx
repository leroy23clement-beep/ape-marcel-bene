import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { addChild } from "@/lib/actions/children";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import HolidayCountdown from "@/components/HolidayCountdown";
import ApeEventCountdown from "@/components/ApeEventCountdown";

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

  // Récupération des prochains événements à venir (pour afficher les dates dans les comptes à rebours)
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(3);

  // Prochain événement APE spécifique pour le bloc de compte à rebours
  const nextApeEvent = upcomingEvents && upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  // Récupération des ventes en cours (table products)
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  // Récupération des actualités de l'école
  const { data: schoolNotices } = await supabase
    .from("school_notices")
    .select("*")
    .order("notice_date", { ascending: false });

  // Récupération de toutes les transactions financières réelles
  const { data: transactions } = await supabase
    .from("transactions")
    .select("type, amount");

  // Calculs dynamiques basés sur la table transactions (en prenant en compte toutes les variantes de casse et libellés)
  const totalRecettes = transactions
    ?.filter((t) => t.type === 'Recette' || t.type === 'recette' || t.type === 'income' || t.type === 'Recette (Entrée)')
    .reduce((acc, t) => acc + Number(t.amount), 0) ?? 0;

  const totalDepenses = transactions
    ?.filter((t) => t.type === 'Dépense' || t.type === 'depense' || t.type === 'expense' || t.type === 'Dépense (Sortie)')
    .reduce((acc, t) => acc + Number(t.amount), 0) ?? 0;

  const soldeGlobal = totalRecettes - totalDepenses;

  // Fonction utilitaire pour formater joliment la date en français
  const formatDateFr = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de navigation */}
      <Navbar 
        userEmail={user.email} 
        firstName={profile?.first_name} 
        role={profile?.role} 
      />

      <div className="mx-auto max-w-7xl p-6 flex flex-col space-y-6">
        
        {/* Encadré de présentation APE */}
        <div className="rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-6 shadow-md flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="bg-purple-600 text-purple-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider border border-purple-400">
              Association des Parents d'Élèves
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              APE Marcel Béné, ensemble pour les enfants
            </h1>
            <p className="text-purple-100 text-sm max-w-xl">
              Une association loi 1901 à but non lucratif. Pour financer les projets pédagogiques, les sorties et les équipements des écoles de Muizon, grâce à l'implication de tous !
            </p>
          </div>
          <Link
            href="/about"
            className="bg-white text-purple-800 hover:bg-purple-50 font-semibold px-6 py-3 rounded-xl shadow transition text-sm whitespace-nowrap cursor-pointer"
          >
            Découvrir l'association →
          </Link>
        </div>

        {/* Comptes à rebours avec ajout explicite des dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Bloc 1 : Prochain rendez-vous (Vacances / Général) */}
          <div className="bg-purple-900 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-purple-300">Prochain rendez-vous</span>
              <h3 className="text-lg font-extrabold mt-1">Vacances de la Toussaint 🎃</h3>
              <p className="text-xs text-purple-200 mt-0.5 capitalize">
                📅 Du samedi 18 octobre au lundi 3 novembre 2026
              </p>
            </div>
            <HolidayCountdown />
          </div>

          {/* Bloc 2 : Prochain événement APE dynamique */}
          <div className="bg-emerald-800 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">Prochain événement APE</span>
              <h3 className="text-lg font-extrabold mt-1">
                {nextApeEvent ? nextApeEvent.title : "Aucun événement prévu"}
              </h3>
              {nextApeEvent && (
                <p className="text-xs text-emerald-100 mt-0.5 capitalize">
                  📅 {formatDateFr(nextApeEvent.event_date)} {nextApeEvent.location ? `• 📍 ${nextApeEvent.location}` : ""}
                </p>
              )}
            </div>
            <ApeEventCountdown />
          </div>

        </div>

        {/* 1. Indicateurs Financiers dynamiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Solde Net Global cliquable vers la trésorerie détaillée */}
          <Link 
            href="/bureau/tresorerie"
            className="rounded-xl border bg-white p-5 shadow-sm flex items-center justify-between hover:border-purple-500 transition cursor-pointer group"
          >
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider group-hover:text-purple-700 transition">
                Solde Net Global ↗
              </p>
              <p className={`text-2xl font-bold mt-1 ${soldeGlobal >= 0 ? 'text-purple-700' : 'text-orange-600'}`}>
                {soldeGlobal.toFixed(2)} €
              </p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-700 rounded-full text-lg">
              💶
            </div>
          </Link>

          {/* Total Recettes */}
          <div className="rounded-xl border bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Recettes
              </p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {totalRecettes.toFixed(2)} €
              </p>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-full text-lg">
              📈
            </div>
          </div>

          {/* Total Dépenses */}
          <div className="rounded-xl border bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Dépenses
              </p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {totalDepenses.toFixed(2)} €
              </p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-full text-lg">
              📉
            </div>
          </div>
        </div>

        {/* Disposition en 3 colonnes pour la suite du contenu */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* COLONNE 1 : Prochains Événements */}
          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="font-semibold text-gray-800 text-base">
                Prochains Événements
              </h2>
              <Link 
                href="/events" 
                className="text-xs font-medium text-purple-700 hover:underline"
              >
                Voir tout ↗
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
                      <h3 className="font-bold text-xs text-gray-900">{event.title}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        {new Date(event.event_date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short"
                        })}
                      </span>
                    </div>
                    {event.location && (
                      <p className="text-[11px] text-gray-500">📍 {event.location}</p>
                    )}
                  </Link>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">
                  Aucun événement à venir.
                </p>
              )}
            </div>
          </div>

          {/* COLONNE 2 : Boutique & Ventes en cours */}
          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="font-semibold text-gray-800 text-base">
                Boutique & Ventes
              </h2>
              <Link 
                href="/shop" 
                className="text-xs font-medium text-purple-700 hover:underline"
              >
                Accéder ↗
              </Link>
            </div>

            <div className="space-y-3">
              {products && products.length > 0 ? (
                products.map((product) => (
                  <Link
                    key={product.id}
                    href="/shop"
                    className="block p-3 bg-gray-50 border rounded-lg space-y-1 hover:border-purple-500 transition cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-xs text-gray-900">{product.name}</h3>
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 whitespace-nowrap">
                        {product.price ? `${product.price.toFixed(2)} €` : ""}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-[11px] text-gray-500 line-clamp-1">{product.description}</p>
                    )}
                  </Link>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">
                  Aucune vente en cours.
                </p>
              )}
            </div>
          </div>

          {/* COLONNE 3 : Le coin de l'école (Infos & Rappels Dynamiques avec notice_date) */}
          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="font-semibold text-gray-800 text-base flex items-center gap-1.5">
                <span>🏫</span> Le coin de l'école
              </h2>
              {profile?.role !== 'parent' && (
                <Link href="/admin/school-notices" className="text-[11px] text-purple-700 hover:underline font-medium">
                  Gérer ⚙️
                </Link>
              )}
            </div>

            <div className="space-y-3 text-xs">
              {schoolNotices && schoolNotices.length > 0 ? (
                schoolNotices.map((notice) => (
                  <div 
                    key={notice.id} 
                    className={`p-3 border rounded-lg space-y-1.5 ${
                      notice.category === 'photo' ? 'bg-blue-50/60 border-blue-100 text-blue-900' :
                      notice.category === 'trip' ? 'bg-amber-50/60 border-amber-100 text-amber-900' :
                      'bg-purple-50/60 border-purple-100 text-purple-900'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold">{notice.title}</span>
                      {notice.notice_date && (
                        <span className="text-[10px] opacity-75 whitespace-nowrap font-medium">
                          📅 {new Date(notice.notice_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">{notice.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">
                  Aucune information scolaire pour le moment.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* 4. Mon Foyer & Enfants (En bas sur toute la largeur) */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">
            Mon Foyer & Enfants
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {children && children.length > 0 ? (
              children.map((child) => (
                <div
                  key={child.id}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {child.first_name} {child.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Classe : {child.class_name}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic col-span-full">
                Aucun enfant enregistré pour le moment.
              </p>
            )}
          </div>

          <form action={addChild} className="space-y-3 pt-4 border-t max-w-xl">
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