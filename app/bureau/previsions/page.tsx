import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ForecastsManagement from "@/components/ForecastsManagement";

export default async function BureauPrevisionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
        <ForecastsManagement />
      </main>
    </div>
  );
}