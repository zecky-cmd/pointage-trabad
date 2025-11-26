"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/navigation/Nav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";

interface ProfilUtilisateur {
  id_profil: string;
  role: "admin" | "rh" | "employe";
}

interface EmployeStat {
  id_employe: string;
  prenom_employe: string;
  nom_employe: string;
  post_employe: string;
  heures_travaillees: number;
  jours_travailles: number;
  total_retard_minutes: number;
  nombre_retards: number;
  nombre_absences: number;
  absences_justifiees: number;
}

export default function RapportAdminPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [moisSelectionne, setMoisSelectionne] = useState<string>("");
  const [employeStats, setEmployeStats] = useState<EmployeStat[]>([]);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const now = new Date();
    const moisActuel = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    setMoisSelectionne(moisActuel);
    loadData();
  }, []);

  useEffect(() => {
    if (moisSelectionne) {
      loadStats();
    }
  }, [moisSelectionne]);

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

      if (!typedProfil || !["admin", "rh"].includes(typedProfil.role)) {
        router.push("/dashboard");
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      router.push("/dashboard");
    }
  };

  const loadStats = async (): Promise<void> => {
    const [annee, mois] = moisSelectionne.split("-");

    const { data: stats } = await supabase
      .from("v_statistiques_pointage")
      .select("*")
      .eq("annee", Number.parseInt(annee))
      .eq("mois", Number.parseInt(mois))
      .order("nom_employe");

    setEmployeStats((stats as EmployeStat[]) || []);
  };

  const formatDuree = (heures: number): string => {
    const h = Math.floor(heures);
    const m = Math.round((heures - h) * 60);
    return `${h}h${String(m).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navigation href="/dashboard" />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Rapport Mensuel de Pointage
              </CardTitle>
              <CardDescription>
                Horaires de travail : 8h30 - 17h30 (8h de travail effectif)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                type="month"
                value={moisSelectionne}
                onChange={(e) => setMoisSelectionne(e.target.value)}
                className="w-full sm:w-48"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Employé
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Heures Travaillées
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Retards
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Absences
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                    {employeStats.map((stat: EmployeStat) => (
                      <tr
                        key={stat.id_employe}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {stat.prenom_employe[0]}
                                {stat.nom_employe[0]}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-foreground">
                                {stat.prenom_employe} {stat.nom_employe}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {stat.post_employe}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatDuree(stat.heures_travaillees)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {stat.jours_travailles} jours travaillés
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div
                              className={`flex items-center gap-2 text-sm font-semibold ${
                                stat.total_retard_minutes > 0
                                  ? "text-red-600"
                                  : "text-foreground"
                              }`}
                            >
                              {stat.total_retard_minutes > 0 && (
                                <AlertTriangle className="h-4 w-4" />
                              )}
                              {formatDuree(stat.total_retard_minutes / 60)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {stat.nombre_retards} retards
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              {stat.nombre_absences > 0 ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {stat.nombre_absences}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {stat.absences_justifiees} justifiées
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/pointage/admin/${stat.id_employe}?mois=${moisSelectionne}`}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Détails
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {employeStats.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">
                  Aucune donnée
                </h3>
                <p className="text-muted-foreground mt-1">
                  Aucun pointage trouvé pour le mois sélectionné.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
