import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import EmployeesList, { Employee } from "@/components/EmployeesList";

export default async function EmployesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vérifier que l'utilisateur est admin ou RH
  const { data: userProfil, error: userProfilError } = await supabase
    .from("profil_utilisateur")
    .select("role")
    .eq("id_profil", user.id)
    .single();

  if (
    userProfilError ||
    !userProfil ||
    !["admin", "rh"].includes(userProfil.role)
  ) {
    redirect("/dashboard");
  }

  // Récupérer tous les employés
  const { data: employes, error: employesError } = await supabase
    .from("employe")
    .select("*")
    .order("created_at", { ascending: false });

  if (employesError) {
    console.error(
      "Erreur lors de la récupération des employés:",
      employesError
    );
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <p className="text-red-600">Erreur lors du chargement des employés</p>
        </div>
      </div>
    );
  }

  // Récupérer tous les profils
  const { data: profils, error: profilsError } = await supabase
    .from("profil_utilisateur")
    .select("id_employe, role, est_actif, derniere_connexion");

  if (profilsError) {
    console.error("Erreur lors de la récupération des profils:", profilsError);
  }

  // Fusionner les données
  const employesAvecProfils = (employes || []).map((emp) => ({
    ...emp,
    profil: profils?.find((p) => p.id_employe === emp.id_employe) || null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestion des Employés
        </h1>
      </div>

      <EmployeesList
        employees={employesAvecProfils as Employee[]}
        userRole={userProfil.role}
      />
    </div>
  );
}
