"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import PointageRowEdit from "@/components/PointageRowEdit";
import Navigation from "@/components/navigation/Nav";
import type { Employee, Pointage, PointageStats } from "@/types/export";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  FileText,
  Download,
  User,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface ProfilUtilisateur {
  id_profil: string;
  role: "admin" | "rh" | "employe";
}

export default function DetailEmployePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [loading, setLoading] = useState<boolean>(true);
  const [employe, setEmploye] = useState<Employee | null>(null);
  const [moisSelectionne, setMoisSelectionne] = useState<string>("");
  const [pointages, setPointages] = useState<Pointage[]>([]);
  const [stats, setStats] = useState<PointageStats | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
    null
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const loadData = useCallback(async (): Promise<void> => {
    if (!resolvedParams) return;
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

      const { data: emp } = await supabase
        .from("employe")
        .select("*")
        .eq("id_employe", resolvedParams.id)
        .single();

      setEmploye(emp as Employee);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams, router, supabase]);

  const calculerHeuresTravaillees = (pointage: Pointage): number => {
    if (!pointage.pointage_arrive || !pointage.pointage_depart) return 0;
    const arrive = new Date(`2000-01-01T${pointage.pointage_arrive}`);
    const depart = new Date(`2000-01-01T${pointage.pointage_depart}`);
    let heures = (depart.getTime() - arrive.getTime()) / (1000 * 60 * 60);

    if (pointage.pointage_pause && pointage.pointage_reprise) {
      const pause = new Date(`2000-01-01T${pointage.pointage_pause}`);
      const reprise = new Date(`2000-01-01T${pointage.pointage_reprise}`);
      heures -= (reprise.getTime() - pause.getTime()) / (1000 * 60 * 60);
    } else {
      heures -= 1;
    }
    return Math.max(0, heures);
  };

  const formatDuree = (heures: number): string => {
    const h = Math.floor(heures);
    const m = Math.round((heures - h) * 60);
    return `${h}h${String(m).padStart(2, "0")}`;
  };

  const calculerStats = useCallback((pointagesData: Pointage[]): void => {
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
        totalHeures += calculerHeuresTravaillees(p);
      }
      if (p.statut === "absent") {
        joursAbsent++;
        if (p.statut_justification_absence === "justifiee")
          absencesJustifiees++;
      }
      if (p.retard_minutes > 0) {
        totalRetard += p.retard_minutes;
        if (p.retard_minutes > 15) {
          retardsSignificatifs++;
          if (p.statut_justification_retard === "justifiee") retardsJustifies++;
        }
      }
    });

    const heuresTheoriques = (joursPresent + absencesJustifiees) * 8;
    const heuresAbsencesNonJustifiees = (joursAbsent - absencesJustifiees) * 8;

    setStats({
      totalHeures: formatDuree(totalHeures),
      joursPresent,
      joursAbsent,
      absencesJustifiees,
      totalRetard: formatDuree(totalRetard / 60),
      retardsSignificatifs,
      retardsJustifies,
      heuresPayables: formatDuree(heuresTheoriques),
      heuresAbsencesNonJustifiees: formatDuree(heuresAbsencesNonJustifiees),
      retardsJustifiesHeures: formatDuree((retardsJustifies * 15) / 60),
      retardsNonJustifiesHeures: formatDuree(
        ((retardsSignificatifs - retardsJustifies) * 15) / 60
      ),
    });
  }, []);

  const loadPointagesMois = useCallback(async (): Promise<void> => {
    if (!moisSelectionne || !resolvedParams) return;
    const [annee, mois] = moisSelectionne.split("-");
    const premierJour = `${annee}-${mois}-01`;
    const dernierJour = new Date(
      Number.parseInt(annee),
      Number.parseInt(mois),
      0
    ).getDate();
    const dernierJourDate = `${annee}-${mois}-${dernierJour}`;

    const { data } = await supabase
      .from("pointage")
      .select("*")
      .eq("id_employe", resolvedParams.id)
      .gte("date_pointage", premierJour)
      .lte("date_pointage", dernierJourDate)
      .order("date_pointage", { ascending: false });

    const typedPointages = (data || []) as Pointage[];
    setPointages(typedPointages);
    calculerStats(typedPointages);
  }, [moisSelectionne, resolvedParams, supabase, calculerStats]);

  useEffect(() => {
    const moisUrl = searchParams.get("mois");
    if (moisUrl) {
      setMoisSelectionne(moisUrl);
    } else {
      const now = new Date();
      setMoisSelectionne(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (resolvedParams) {
      loadData();
    }
  }, [resolvedParams, loadData]);

  useEffect(() => {
    if (moisSelectionne && employe && resolvedParams) {
      loadPointagesMois();
    }
  }, [moisSelectionne, employe, resolvedParams, loadPointagesMois]);

  const handleSavePointage = async (): Promise<void> => {
    await loadPointagesMois();
    setEditingId(null);
  };

  const exportPDF = async (): Promise<void> => {
    if (!employe || !stats) return;
    try {
      const { exportRapportPDF } = await import("@/utils/exports");
      exportRapportPDF(employe, moisSelectionne, pointages, stats);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Erreur export PDF:", err.message);
      } else {
        console.error("Erreur export PDF:", err);
      }
    }
  };

  const exportExcel = async (): Promise<void> => {
    if (!employe || !stats) return;
    try {
      const { exportEmployeExcel } = await import("@/utils/exports");
      exportEmployeExcel(employe, pointages, moisSelectionne, stats);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Erreur export Excel:", err.message);
      } else {
        console.error("Erreur export Excel:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Chargement...
      </div>
    );
  }

  // return (
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/pointage/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Détail du mois
            </h1>
            <p className="text-muted-foreground">
              Gestion des pointages et statistiques mensuelles
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 space-y-0 pb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {employe?.prenom_employe?.[0]}
                {employe?.nom_employe?.[0]}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {employe?.prenom_employe} {employe?.nom_employe}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {employe?.post_employe}
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="month"
                  value={moisSelectionne}
                  onChange={(e) => setMoisSelectionne(e.target.value)}
                  className="w-full sm:w-40"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={exportPDF}
                  variant="outline"
                  className="flex-1 sm:flex-none gap-2"
                >
                  <FileText className="h-4 w-4 text-red-600" />
                  PDF
                </Button>
                <Button
                  onClick={exportExcel}
                  variant="outline"
                  className="flex-1 sm:flex-none gap-2"
                >
                  <Download className="h-4 w-4 text-green-600" />
                  Excel
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Heures Travaillées
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalHeures}
              </div>
              <p className="text-xs text-muted-foreground">
                Heures effectives
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Absences Justifiées
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.absencesJustifiees * 8}h00
              </div>
              <p className="text-xs text-muted-foreground">Heures payées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Absences Non Justifiées
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.heuresAbsencesNonJustifiees}
              </div>
              <p className="text-xs text-muted-foreground">
                Heures non payées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Payable
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.heuresPayables}
              </div>
              <p className="text-xs text-muted-foreground">
                Pour rémunération
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Retards Justifiés
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.retardsJustifiesHeures}
              </div>
              <p className="text-xs text-muted-foreground">
                Heures récupérées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Retards Non Justifiés
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.retardsNonJustifiesHeures}
              </div>
              <p className="text-xs text-muted-foreground">Heures déduites</p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Retards
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.totalRetard}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({stats.retardsSignificatifs} jours)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Retards significatifs {">"} 15min
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pointages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des pointages</CardTitle>
          <CardDescription>
            Détail quotidien des entrées et sorties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Arrivée
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Pause
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Reprise
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Départ
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Heures
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Retard
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Justification
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {pointages.map((p) => (
                    <PointageRowEdit
                      key={p.id_pointage}
                      pointage={p}
                      isEditing={editingId === p.id_pointage}
                      onEdit={() => setEditingId(p.id_pointage)}
                      onSave={handleSavePointage}
                      onCancel={() => setEditingId(null)}
                      calculerHeures={calculerHeuresTravaillees}
                      formatDuree={formatDuree}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
