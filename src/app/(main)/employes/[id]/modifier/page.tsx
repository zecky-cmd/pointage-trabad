"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Types pour les rôles
type RoleType = "admin" | "rh" | "employe";
// Interface pour le formulaire
interface EmployeFormData {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  poste: string;
  departement: string;
  role: RoleType;
}
// Interface pour les données de l'employé depuis Supabase
interface Employe {
  id_employe: string;
  prenom_employe: string;
  nom_employe: string;
  email_employe: string;
  tel_employe: string | null;
  post_employe: string | null;
  departement_employe: string | null;
  profil_utilisateur?: ProfilUtilisateur[];
}
// Interface pour le profil utilisateur
interface ProfilUtilisateur {
  role: RoleType;
}
// Interface pour les props de la page
interface ModifierEmployePageProps {
  params: {
    id: string;
  };
}
export default function ModifierEmployePage({
  params,
}: ModifierEmployePageProps) {
  const [formData, setFormData] = useState<EmployeFormData>({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    poste: "",
    departement: "",
    role: "employe",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const router = useRouter();
  const supabase = createClient();
  useEffect(() => {
    loadEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEmployee = async (): Promise<void> => {
    try {
      const { data: employe, error: empError } = await supabase
        .from("employe")
        .select(
          `
          *,
          profil_utilisateur (role)
        `
        )
        .eq("id_employe", params.id)
        .single();

      if (empError) throw empError;
      if (!employe) throw new Error("Employé non trouvé");

      const employeTyped = employe as Employe;

      setFormData({
        prenom: employeTyped.prenom_employe,
        nom: employeTyped.nom_employe,
        email: employeTyped.email_employe,
        telephone: employeTyped.tel_employe || "",
        poste: employeTyped.post_employe || "",
        departement: employeTyped.departement_employe || "",
        role: employeTyped.profil_utilisateur?.[0]?.role || "employe",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Mettre à jour l'employé
      const { error: empError } = await supabase
        .from("employe")
        .update({
          prenom_employe: formData.prenom,
          nom_employe: formData.nom,
          email_employe: formData.email,
          tel_employe: formData.telephone,
          post_employe: formData.poste,
          departement_employe: formData.departement,
        })
        .eq("id_employe", params.id);

      if (empError) throw empError;

      // 2. Mettre à jour le rôle dans profil_utilisateur
      const { error: roleError } = await supabase
        .from("profil_utilisateur")
        .update({ role: formData.role })
        .eq("id_employe", params.id);

      if (roleError) {
        console.warn("Erreur mise à jour rôle:", roleError);
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/employes");
      }, 1500);
    } catch (err: unknown) {
      console.error("Erreur complète:", err);
      let message = "Une erreur est survenue";

      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "object" && err !== null && "message" in err) {
        message = String((err as { message: unknown }).message);
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof EmployeFormData,
    value: string
  ): void => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRoleChange = (value: string): void => {
    setFormData({ ...formData, role: value as RoleType });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href={`/employes/${params.id}`}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <span>←</span> Retour
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Modifier l&apos;employé</h1>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            Employé modifié avec succès ! Redirection...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Prénom *
              </label>
              <input
                type="text"
                required
                value={formData.prenom}
                onChange={(e) => handleInputChange("prenom", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom *
              </label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={(e) => handleInputChange("telephone", e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Poste
              </label>
              <input
                type="text"
                value={formData.poste}
                onChange={(e) => handleInputChange("poste", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Département
              </label>
              <input
                type="text"
                value={formData.departement}
                onChange={(e) =>
                  handleInputChange("departement", e.target.value)
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rôle *
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="employe">Employé</option>
              <option value="rh">RH</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Link
              href={`/employes/${params.id}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
