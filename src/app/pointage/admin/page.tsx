"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/navigation/Nav";

export default function RapportMensuelPage() {
  const [loading, setLoading] = useState(true);
  const [employe, setEmploye] = useState<any>(null);
  const [moisSelectionne, setMoisSelectionne] = useState("");
  const [pointages, setPointages] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Définir le mois actuel par défaut
    const now = new Date();
    const moisActuel = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    setMoisSelectionne(moisActuel);
    loadData();
  }, []);

  useEffect(() => {
    if (moisSelectionne && employe) {
      loadPointagesMois();
    }
  }, [moisSelectionne, employe]);

  const loadData = async () => {
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
        .select(
          `
          id_employe,
          employe:id_employe (
            id_employe,
            prenom_employe,
            nom_employe,
            post_employe
          )
        `
        )
        .eq("id_profil", user.id)
        .single();

      setEmploye(profil?.employe);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPointagesMois = async () => {
    if (!employe) return;

    const [annee, mois] = moisSelectionne.split("-");
    const premierJour = `${annee}-${mois}-01`;
    const dernierJour = new Date(parseInt(annee), parseInt(mois), 0).getDate();
    const dernierJourDate = `${annee}-${mois}-${dernierJour}`;

    const { data } = await supabase
      .from("pointage")
      .select("*")
      .eq("id_employe", employe.id_employe)
      .gte("date_pointage", premierJour)
      .lte("date_pointage", dernierJourDate)
      .order("date_pointage", { ascending: false });

    setPointages(data || []);
    calculerStats(data || []);
  };

  const calculerStats = (pointagesData: any[]) => {
    let totalHeures = 0;
    let totalRetard = 0;
    let joursPresent = 0;
    let joursAbsent = 0;
    let absencesJustifiees = 0;
    let retardsSignificatifs = 0;
    let retardsJustifies = 0;

    pointagesData.forEach((p) => {
      if (p.statut === "present") {
        joursPresent++;
        const heures = calculerHeuresTravaillees(p);
        totalHeures += heures;
      }
      if (p.statut === "absent") {
        joursAbsent++;
        if (p.statut_justification_absence === "justifiee") {
          absencesJustifiees++;
        }
      }
      if (p.retard_minutes > 0) {
        totalRetard += p.retard_minutes;
        if (p.retard_minutes > 15) {
          retardsSignificatifs++;
          if (p.statut_justification_retard === "justifiee") {
            retardsJustifies++;
          }
        }
      }
    });

    const heuresTheoriques = (joursPresent + absencesJustifiees) * 8;
    const heuresAbsencesNonJustifiees = (joursAbsent - absencesJustifiees) * 8;
    const heuresPayables = heuresTheoriques;

    setStats({
      totalHeures: formatDuree(totalHeures),
      joursPresent,
      joursAbsent,
      absencesJustifiees,
      totalRetard: formatDuree(totalRetard / 60),
      retardsSignificatifs,
      retardsJustifies,
      heuresPayables: formatDuree(heuresPayables),
      heuresAbsencesNonJustifiees: formatDuree(heuresAbsencesNonJustifiees),
    });
  };

  const calculerHeuresTravaillees = (pointage: any) => {
    if (!pointage.pointage_arrive || !pointage.pointage_depart) return 0;

    const arrive = new Date(`2000-01-01T${pointage.pointage_arrive}`);
    const depart = new Date(`2000-01-01T${pointage.pointage_depart}`);
    let heures = (depart.getTime() - arrive.getTime()) / (1000 * 60 * 60);

    if (pointage.pointage_pause && pointage.pointage_reprise) {
      const pause = new Date(`2000-01-01T${pointage.pointage_pause}`);
      const reprise = new Date(`2000-01-01T${pointage.pointage_reprise}`);
      const dureePause =
        (reprise.getTime() - pause.getTime()) / (1000 * 60 * 60);
      heures -= dureePause;
    } else {
      heures -= 1; // Déduire 1h si pas de pause
    }

    return Math.max(0, heures);
  };

  const formatDuree = (heures: number) => {
    const h = Math.floor(heures);
    const m = Math.round((heures - h) * 60);
    return `${h}h${String(m).padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation href="/pointage" label=" ← Retour au pointage" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Rapport Mensuel de Pointage
              </h1>
              <p className="text-gray-600 mt-1">
                {employe?.prenom_employe} {employe?.nom_employe} -{" "}
                {employe?.post_employe}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Horaires de travail : 8h30 - 17h30 (8h de travail effectif)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mois
              </label>
              <input
                type="month"
                value={moisSelectionne}
                onChange={(e) => setMoisSelectionne(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Heures Travaillées</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalHeures}
              </p>
              <p className="text-xs text-gray-500">
                {stats.joursPresent} jours travaillés
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Retards</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.totalRetard}
              </p>
              <p className="text-xs text-gray-500">
                {stats.retardsSignificatifs} jours de retard
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Absences</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.joursAbsent}
              </p>
              <p className="text-xs text-gray-500">
                {stats.absencesJustifiees} justifiées
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Payable</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.heuresPayables}
              </p>
              <p className="text-xs text-gray-500">Rémunération</p>
            </div>
          </div>
        )}

        {/* Tableau des pointages */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Arrivée
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pause
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reprise
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Départ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Heures
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Retard
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pointages.map((p) => (
                <tr
                  key={p.id_pointage}
                  className={p.statut === "weekend" ? "bg-gray-50" : ""}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatDate(p.date_pointage)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                    {p.pointage_arrive || "----"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                    {p.pointage_pause || "----"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                    {p.pointage_reprise || "----"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                    {p.pointage_depart || "----"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                    {formatDuree(calculerHeuresTravaillees(p))}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {p.retard_minutes > 0 ? (
                      <span
                        className={
                          p.retard_minutes > 15
                            ? "text-red-600 font-semibold"
                            : "text-orange-600"
                        }
                      >
                        {p.retard_minutes}min
                      </span>
                    ) : (
                      <span className="text-green-600">À l'heure</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        p.statut === "present"
                          ? "bg-green-100 text-green-800"
                          : p.statut === "absent"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {p.statut === "present"
                        ? "Présent"
                        : p.statut === "absent"
                        ? "Absent"
                        : "Week-end"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pointages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucun pointage pour ce mois
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
