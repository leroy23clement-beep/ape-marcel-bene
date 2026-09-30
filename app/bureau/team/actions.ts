'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addTeamMember(formData: FormData) {
  const supabase = await createClient();

  // Vérification de sécurité (rôle bureau ou supérieur)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autorisé");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const allowedRoles = ['admin', 'president', 'secretaire', 'tresorier', 'bureau'];
  if (!profile || !allowedRoles.includes(profile.role?.toLowerCase())) {
    throw new Error("Accès refusé");
  }

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const roleTitle = formData.get("roleTitle") as string;
  const photoUrl = formData.get("photoUrl") as string;

  if (!firstName || !lastName || !roleTitle) {
    throw new Error("Veuillez remplir les champs obligatoires");
  }

  // Insertion dans la table bureau_members
  const { error } = await supabase.from("bureau_members").insert({
    first_name: firstName,
    last_name: lastName,
    role_title: roleTitle,
    photo_url: photoUrl || null,
  });

  if (error) {
    throw new Error("Erreur lors de l'ajout : " + error.message);
  }

  revalidatePath("/team");
  revalidatePath("/bureau/team");
}