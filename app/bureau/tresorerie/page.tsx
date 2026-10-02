import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import TreasuryManagement from "@/components/TreasuryManagement";

export default async function BureauTresoreriePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vérification du rôle (accès réservé au bureau / admin / tresorier)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "tresorier" && profile.role !== "bureau")) {
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
        <TreasuryManagement />
      </main>
    </div>
  );
}