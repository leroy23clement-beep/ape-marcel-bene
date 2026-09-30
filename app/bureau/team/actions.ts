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
  const photoFile = formData.get("photoFile") as File;

  if (!firstName || !lastName || !roleTitle) {
    throw new Error("Veuillez remplir les champs obligatoires");
  }

  let photoUrl = null;

  // Gestion de l'upload de la photo si un fichier est présent
  if (photoFile && photoFile.size > 0 && photoFile.name !== "undefined") {
    const fileExt = photoFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("team-photos")
      .upload(filePath, photoFile);

    if (uploadError) {
      throw new Error("Erreur lors de l'upload de la photo : " + uploadError.message);
    }

    // Récupération de l'URL publique de l'image
    const { data: publicUrlData } = supabase.storage
      .from("team-photos")
      .getPublicUrl(filePath);

    photoUrl = publicUrlData.publicUrl;
  }

  // Insertion dans la table bureau_members
  const { error } = await supabase.from("bureau_members").insert({
    first_name: firstName,
    last_name: lastName,
    role_title: roleTitle,
    photo_url: photoUrl,
  });

  if (error) {
    throw new Error("Erreur lors de l'ajout : " + error.message);
  }

  revalidatePath("/team");
  revalidatePath("/about");
  revalidatePath("/bureau/team");
}