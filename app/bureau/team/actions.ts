'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addTeamMember(formData: FormData) {
  try {
    const supabase = await createClient();

    // Vérification de l'utilisateur connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Utilisateur non authentifié." };
    }

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const roleTitle = formData.get("roleTitle") as string;
    const photoFile = formData.get("photoFile") as File;

    if (!firstName || !lastName || !roleTitle) {
      return { success: false, error: "Veuillez remplir les champs obligatoires (Prénom, Nom, Rôle)." };
    }

    let photoUrl = null;

    // Gestion de l'upload de la photo si un fichier est présent et valide
    if (photoFile && photoFile.size > 0 && photoFile.name && photoFile.name !== "undefined") {
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("team-photos")
        .upload(fileName, photoFile);

      if (uploadError) {
        return { success: false, error: "Erreur Storage : " + uploadError.message };
      }

      const { data: publicUrlData } = supabase.storage
        .from("team-photos")
        .getPublicUrl(fileName);

      photoUrl = publicUrlData.publicUrl;
    }

    // Insertion dans la table bureau_members
    const { error: insertError } = await supabase.from("bureau_members").insert({
      first_name: firstName,
      last_name: lastName,
      role_title: roleTitle,
      photo_url: photoUrl,
    });

    if (insertError) {
      return { success: false, error: "Erreur Insertion Base de données : " + insertError.message };
    }

    revalidatePath("/about");
    revalidatePath("/bureau/team");

    return { success: true };
  } catch (err: any) {
    console.error("ERREUR LORS DE L'AJOUT DU MEMBRE:", err.message);
    return { success: false, error: err.message || "Une erreur interne est survenue." };
  }
}