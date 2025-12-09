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

// Get ordinateur by id
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

// Create ordinateur
export async function createOrdinateur(formData: any) {
  const supabase = await createClient();

  // Ensure affecte_a is number or null
  if (formData.affecte_a) {
    formData.affecte_a = parseInt(formData.affecte_a);
    if (isNaN(formData.affecte_a)) formData.affecte_a = null;
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

  revalidatePath("/ordinateurs");
  return data;
}

export async function updateOrdinateur(id: string, formData: any) {
  const supabase = await createClient();

  // Ensure affecte_a is number or null
  if (formData.affecte_a) {
    formData.affecte_a = parseInt(formData.affecte_a);
    if (isNaN(formData.affecte_a)) formData.affecte_a = null;
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

// Delete ordinateur
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
