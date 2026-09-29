import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createProduct, createOrder } from "@/lib/actions/shop";

export default async function ShopPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isBureau = profile?.role && profile.role !== "parent";

  // Produits en vente
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  // Commandes de l'utilisateur
  const { data: userOrders } = await supabase
    .from("orders")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={user.email} firstName={profile?.first_name} role={profile?.role} />

      <main className="mx-auto max-w-4xl p-6 space-y-8">
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Boutique & Ventes APE</h1>
          <p className="text-sm text-gray-600 mt-1">
            Commandez vos articles ou accédez aux ventes en ligne pour soutenir les projets de l'école.
          </p>
        </header>

        {/* Formulaire d'ajout réservé au Bureau */}
        {isBureau && (
          <section className="bg-purple-50/50 border border-purple-200 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
              <span>🛍️</span> Ajouter un produit / Une vente
            </h2>

            <form action={createProduct} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Nom du produit / de la vente</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="ex: Vente de Jus de Pomme, Tickets Tombola..."
                  className="w-full text-sm p-2.5 rounded-lg border bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Prix unitaire (€)</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  placeholder="0.00"
                  className="w-full text-sm p-2.5 rounded-lg border bg-white"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-gray-700">Lien du site de vente externe (optionnel)</label>
                <input
                  type="url"
                  name="external_link"
                  placeholder="ex: https://www.helloasso.com/associations/ape/evenements/..."
                  className="w-full text-sm p-2.5 rounded-lg border bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Date de début de vente</label>
                <input
                  type="date"
                  name="start_date"
                  className="w-full text-sm p-2.5 rounded-lg border bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Date de fin de vente</label>
                <input
                  type="date"
                  name="end_date"
                  className="w-full text-sm p-2.5 rounded-lg border bg-white"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Informations sur la livraison, consignes, dates de retrait..."
                  className="w-full text-sm p-2.5 rounded-lg border bg-white"
                />
              </div>

              <div className="md:col-span-2 flex justify-end pt-2 border-t border-purple-200">
                <button
                  type="submit"
                  className="bg-purple-700 hover:bg-purple-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  Publier la vente
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Catalogue des ventes */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Ventes en cours</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products && products.length > 0 ? (
              products.map((product) => (
                <div key={product.id} className="bg-white border rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900 text-base">{product.name}</h3>
                      {product.price > 0 && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                          {product.price.toFixed(2)} €
                        </span>
                      )}
                    </div>

                    {(product.start_date || product.end_date) && (
                      <p className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded w-fit border border-purple-200">
                        🗓️ {product.start_date ? `Du ${new Date(product.start_date).toLocaleDateString("fr-FR")}` : ""} 
                        {product.end_date ? ` au ${new Date(product.end_date).toLocaleDateString("fr-FR")}` : ""}
                      </p>
                    )}

                    {product.description && (
                      <p className="text-xs text-gray-600 leading-relaxed">{product.description}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t">
                    {product.external_link ? (
                      <a
                        href={product.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex justify-center items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-medium py-2.5 rounded-lg transition"
                      >
                        🔗 Accéder au site de commande ↗
                      </a>
                    ) : (
                      <form action={createOrder} className="flex items-center gap-2">
                        <input type="hidden" name="productId" value={product.id} />
                        <input
                          type="number"
                          name="quantity"
                          min="1"
                          defaultValue="1"
                          className="w-16 text-xs p-2 border rounded-lg focus:outline-emerald-600 text-center bg-white"
                          required
                        />
                        <button
                          type="submit"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-2 rounded-lg transition"
                        >
                          Commander en ligne
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-white border rounded-xl p-8 text-center text-gray-500 text-sm">
                Aucune vente en cours pour le moment.
              </div>
            )}
          </div>
        </section>

        {/* Historique des commandes directes */}
        {userOrders && userOrders.length > 0 && (
          <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Mes commandes directes</h2>
            <div className="divide-y text-sm">
              {userOrders.map((order) => (
                <div key={order.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{order.products?.name}</p>
                    <p className="text-xs text-gray-500">Quantité : {order.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{order.total_price?.toFixed(2)} €</p>
                    <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {order.status === "pending" ? "En attente de règlement" : "Payée"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}