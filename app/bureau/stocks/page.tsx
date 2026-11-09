import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import StocksManagement from "@/components/StocksManagement";

export default async function BureauStocksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vérification du rôle (accès réservé au bureau / admin / tresorier / secretaire)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const allowedRoles = ["admin", "tresorier", "secretaire", "bureau", "president"];
  const userRole = profile?.role ? profile.role.toLowerCase() : "parent";

  if (!profile || !allowedRoles.includes(userRole)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userEmail={user.email} 
        firstName={profile?.first_name} 
        role={profile?.role} 
      />
      <main className="py-6">
        <StocksManagement />
      </main>
    </div>
  );
}