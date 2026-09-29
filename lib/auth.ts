import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, type Role } from "@/types/roles";

/** À appeler en tête de chaque page /parent et Server Action parent. */
export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** À appeler en tête de chaque page /admin et Server Action admin. */
export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !ADMIN_ROLES.includes(profile.role as Role)) {
    redirect("/parent/dashboard");
  }
  return { supabase, user, role: profile.role as Role };
}