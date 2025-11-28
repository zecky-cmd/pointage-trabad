"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation/Nav";

interface JourFerie {
  id_ferie: number;
  date_ferie: string;
  libelle: string;
}

interface FormData {
  date_ferie: string;
  libelle: string;
}

interface ProfilUtilisateur {
  id_profil: string;
  role: string;
}

interface SupabaseError {
  message: string;
}

export default function JoursFeriesPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [joursFeries, setJoursFeries] = useState<JourFerie[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    date_ferie: "",
    libelle: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profil } = await supabase
        .from("profil_utilisateur")
        .select("role")
        .eq("id_profil", user.id)
        .single();

      const typedProfil = profil as ProfilUtilisateur | null;
      if (!typedProfil || typedProfil.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      await loadJoursFeries();
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadJoursFeries = async (): Promise<void> => {
    const { data } = await supabase
      .from("jours_feries")
      .select("*")
      .order("date_ferie", { ascending: true });

    setJoursFeries((data as JourFerie[]) || []);
  };

  const openModal = (jourFerie?: JourFerie): void => {
    if (jourFerie) {
      setEditingId(jourFerie.id_ferie);
      setFormData({
        date_ferie: jourFerie.date_ferie,
        libelle: jourFerie.libelle,
      });
    } else {
      setEditingId(null);
      setFormData({ date_ferie: "", libelle: "" });
    }
    setShowModal(true);
  };

  const closeModal = (): void => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ date_ferie: "", libelle: "" });
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    try {
      if (editingId) {
        // Modification
        const { error } = await supabase
          .from("jours_feries")
          .update(formData)
          .eq("id_ferie", editingId);

        if (error) throw error;
        alert("✅ Jour férié modifié avec succès");
      } else {
        // Création
        const { error } = await supabase
          .from("jours_feries")
          .insert([formData]);

        if (error) throw error;
        alert("✅ Jour férié ajouté avec succès");
      }

      await loadJoursFeries();
      closeModal();
    } catch (error) {
      const supabaseError = error as SupabaseError;
      alert(`Erreur: ${supabaseError.message}`);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (!confirm("Voulez-vous vraiment supprimer ce jour férié ?")) return;

    try {
      const { error } = await supabase
        .from("jours_feries")
        .delete()
        .eq("id_ferie", id);

      if (error) throw error;

      alert("✅ Jour férié supprimé");
      await loadJoursFeries();
    } catch (error) {
      const supabaseError = error as SupabaseError;
      alert(`Erreur: ${supabaseError.message}`);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getAnnee = (dateStr: string): number => {
    return new Date(dateStr).getFullYear();
  };

  const joursFeriesParAnnee: Record<string, JourFerie[]> = joursFeries.reduce(
    (acc, jf) => {
      const annee = getAnnee(jf.date_ferie).toString();
      if (!acc[annee]) acc[annee] = [];
      acc[annee].push(jf);
      return acc;
    },
    {} as Record<string, JourFerie[]>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Jours Fériés</h1>
            <p className="text-gray-600 mt-1">
              Gérer les jours fériés pour le calcul des pointages
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Ajouter un jour férié
          </button>
        </div>
      </div>

      {Object.keys(joursFeriesParAnnee)
        .sort((a, b) => Number.parseInt(b) - Number.parseInt(a))
        .map((annee) => (
          <div key={annee} className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-lg font-semibold">Année {annee}</h2>
            </div>
            <div className="divide-y">
              {joursFeriesParAnnee[annee].map((jf: JourFerie) => (
                <div
                  key={jf.id_ferie}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{jf.libelle}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(jf.date_ferie)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openModal(jf)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(jf.id_ferie)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      {joursFeries.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">Aucun jour férié configuré</p>
          <button
            onClick={() => openModal()}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Ajouter le premier jour férié
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">
              {editingId ? "Modifier" : "Ajouter"} un jour férié
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_ferie}
                    onChange={(e) =>
                      setFormData({ ...formData, date_ferie: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Libellé *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fête de l'indépendance"
                    value={formData.libelle}
                    onChange={(e) =>
                      setFormData({ ...formData, libelle: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingId ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
