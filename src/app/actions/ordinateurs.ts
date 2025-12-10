"use server";

import { createClient } from "@/utils/supabase/server";
import { Ordinateur } from "@/types/ordinateur";
import { revalidatePath } from "next/cache";

export async function getOrdinateurs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ordinateurs")
    .select(
      `
      *,
      employe:affecte_a (
        nom_employe,
        prenom_employe
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching ordinateurs:", error);
    // Returning empty array or throwing specific error to avoid crashing entire page with "{}"
    throw new Error(`Erreur récupération ordinateurs: ${error.message}`);
  }

  return data as Ordinateur[];
}

// fonction de recuperation d'un ordinateur par id
export async function getOrdinateurById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ordinateurs")
    .select(
      `
      *,
      employe:affecte_a (
        id_employe,
        nom_employe,
        prenom_employe
      )
    `
    )
    .eq("id_ordinateur", id)
    .single();

  if (error) {
    console.error("Error fetching ordinateur:", error);
    throw new Error(`Erreur récupération ordinateur: ${error.message}`);
  }

  return data as Ordinateur;
}

// fonction de creation d'un ordinateur
export async function createOrdinateur(formData: Partial<Ordinateur>) {
  const supabase = await createClient();

  // Ensure affecte_a is number or null
  if (formData.affecte_a) {
    if (typeof formData.affecte_a === "string") {
      const parsed = parseInt(formData.affecte_a);
      formData.affecte_a = isNaN(parsed) ? null : parsed;
    }
    // If it's already a number, we leave it. If not string or number, we might want null.
  }

  const { data, error } = await supabase
    .from("ordinateurs")
    .insert([formData])
    .select()
    .single();

  if (error) {
    console.error("Error creating ordinateur:", error);
    throw new Error(`Erreur création: ${error.message}`);
  }

  // Log initial history if assigned immediately
  if (formData.affecte_a) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const authorName =
      user?.user_metadata?.full_name || user?.email || "Système";

    const { error: historyError } = await supabase
      .from("equipement_historique")
      .insert([
        {
          id_ordinateur: data.id_ordinateur,
          id_employe: formData.affecte_a,
          type_action: "affectation",
          date_debut: new Date().toISOString(),
          commentaire: "Affectation initiale",
          cree_par: user?.id,
          auteur: authorName,
        },
      ]);

    if (historyError) {
      console.error("Error creating initial history:", historyError);
      // We don't throw here to avoid blocking creation if logging fails, but it's worth noting
    }
  }

  revalidatePath("/ordinateurs");
  return data;
}

// fonction de mise à jour d'un ordinateur
export async function updateOrdinateur(
  id: string,
  formData: Partial<Ordinateur>
) {
  const supabase = await createClient();

  // Fetch current state to compare assignment
  const { data: current, error: fetchError } = await supabase
    .from("ordinateurs")
    .select("affecte_a, date_affectation")
    .eq("id_ordinateur", id)
    .single();

  if (fetchError) {
    throw new Error(`Erreur pré-mise à jour: ${fetchError.message}`);
  }

  // Ensure affecte_a is number or null
  if (formData.affecte_a) {
    if (typeof formData.affecte_a === "string") {
      const parsed = parseInt(formData.affecte_a);
      formData.affecte_a = isNaN(parsed) ? null : parsed;
    }
  }

  // Check for assignment change
  const oldAssignee = current.affecte_a;
  const newAssignee = formData.affecte_a;

  // Update history if assignment changed
  if (oldAssignee !== newAssignee) {
    // 1. Close old assignment if exists
    if (oldAssignee) {
      // Find open history record
      await supabase
        .from("equipement_historique")
        .update({
          date_fin: new Date().toISOString(),
          type_action: "restitution", // or just close it
        })
        .eq("id_ordinateur", id)
        .eq("id_employe", oldAssignee)
        .is("date_fin", null);
    }

    // 2. Create new assignment if exists
    if (newAssignee) {
      // Get current user for history
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const authorName =
        user?.user_metadata?.full_name || user?.email || "Système";

      await supabase.from("equipement_historique").insert([
        {
          id_ordinateur: id,
          id_employe: newAssignee,
          type_action: "affectation",
          date_debut: new Date().toISOString(),
          commentaire: "Changement d'affectation",
          cree_par: user?.id,
          auteur: authorName,
        },
      ]);
    }
  }

  // Update ordinateur
  const { data, error } = await supabase
    .from("ordinateurs")
    .update(formData)
    .eq("id_ordinateur", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating ordinateur:", error);
    throw new Error(`Erreur mise à jour: ${error.message}`);
  }

  revalidatePath("/ordinateurs");
  revalidatePath(`/ordinateurs/${id}`);
  return data;
}

// fonction de suppression d'un ordinateur
export async function deleteOrdinateur(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("ordinateurs")
    .delete()
    .eq("id_ordinateur", id);

  if (error) {
    console.error("Error deleting ordinateur:", error);
    throw new Error(`Erreur suppression: ${error.message}`);
  }

  revalidatePath("/ordinateurs");
  return { success: true };
}
// historiques des t'affectations des outils
export async function getHistorique(id_ordinateur: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("equipement_historique")
    .select(
      `
      *,
      employe:id_employe (
        nom_employe,
        prenom_employe
      )
    `
    )
    .eq("id_ordinateur", id_ordinateur)
    .order("date_debut", { ascending: false });

  if (error) {
    console.error("Error fetching historique:", error);
    return [];
  }

  return data;
}

export async function getCurrentEmployee() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Get profilelinked to user
  const { data: profile } = await supabase
    .from("profil_utilisateur")
    .select("id_employe")
    .eq("id_profil", user.id)
    .single();

  if (!profile?.id_employe) {
    return user.user_metadata?.full_name || user.email;
  }

  // 2. Get employee details
  const { data: employee } = await supabase
    .from("employe")
    .select("nom_employe, prenom_employe")
    .eq("id_employe", profile.id_employe)
    .single();

  if (employee) {
    return `${employee.nom_employe} ${employee.prenom_employe}`;
  }

  return user.user_metadata?.full_name || user.email;
}
