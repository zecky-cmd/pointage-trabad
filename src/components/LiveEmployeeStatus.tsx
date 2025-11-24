"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Clock, Coffee, Home, AlertCircle, CheckCircle2 } from "lucide-react";
import { Pointage, Employee } from "@/types/export";

interface EmployeeStatus {
  id_employe: string;
  prenom_employe: string;
  nom_employe: string;
  post_employe: string;
  departement_employe: string;
  status: "not_arrived" | "working" | "pause" | "departed";
  last_action_time: string | null;
  avatar_color?: string;
}

export default function LiveEmployeeStatus() {
  const [employees, setEmployees] = useState<EmployeeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const getStatus = (pointage: Pointage | null): EmployeeStatus["status"] => {
    if (!pointage) return "not_arrived";
    if (pointage.pointage_depart) return "departed";
    if (pointage.pointage_pause && !pointage.pointage_reprise) return "pause";
    if (pointage.pointage_arrive) return "working";
    return "not_arrived";
  };

  const getLastActionTime = (pointage: Pointage | null): string | null => {
    if (!pointage) return null;
    if (pointage.pointage_depart) return pointage.pointage_depart;
    if (pointage.pointage_reprise) return pointage.pointage_reprise;
    if (pointage.pointage_pause) return pointage.pointage_pause;
    if (pointage.pointage_arrive) return pointage.pointage_arrive;
    return null;
  };

  const fetchEmployeesAndStatus = useCallback(async () => {
    try {
      // 1. Get all employees
      const { data: employeesData, error: empError } = await supabase
        .from("employe")
        .select(
          "id_employe, prenom_employe, nom_employe, post_employe, departement_employe"
        )
        .order("nom_employe");

      if (empError) throw empError;

      // 2. Get today's pointages
      const today = new Date().toISOString().split("T")[0];
      const { data: pointagesData, error: pointError } = await supabase
        .from("pointage")
        .select("*")
        .eq("date_pointage", today);

      if (pointError) throw pointError;

      // 3. Merge data
      // Cast the data to the correct types since Supabase returns any[] by default for untyped queries
      const employees = (employeesData || []) as Employee[];
      const pointages = (pointagesData || []) as Pointage[];

      const mergedData: EmployeeStatus[] = employees.map((emp) => {
        const pointage = pointages.find((p) => p.id_employe === emp.id_employe);

        return {
          ...emp,
          departement_employe: emp.departement_employe || "",
          status: getStatus(pointage || null),
          last_action_time: getLastActionTime(pointage || null),
          avatar_color: `hsl(${Math.random() * 360}, 70%, 50%)`, // Random color for avatar
        };
      });

      setEmployees(mergedData);
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEmployeesAndStatus();

    // Realtime subscription
    const channel = supabase
      .channel("public:pointage")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pointage" },
        (payload) => {
          console.log("Change received!", payload);
          // Refresh data on any change to pointage table
          fetchEmployeesAndStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEmployeesAndStatus, supabase]);

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Chargement du suivi en temps réel...
      </div>
    );
  }

  const stats = {
    total: employees.length,
    working: employees.filter((e) => e.status === "working").length,
    pause: employees.filter((e) => e.status === "pause").length,
    departed: employees.filter((e) => e.status === "departed").length,
    not_arrived: employees.filter((e) => e.status === "not_arrived").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg text-green-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {stats.working}
            </p>
            <p className="text-xs text-green-600/80 font-medium uppercase">
              Au travail
            </p>
          </div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg text-orange-600">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              {stats.pause}
            </p>
            <p className="text-xs text-orange-600/80 font-medium uppercase">
              En pause
            </p>
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-600">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {stats.departed}
            </p>
            <p className="text-xs text-blue-600/80 font-medium uppercase">
              Partis
            </p>
          </div>
        </div>
        <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-gray-500/20 rounded-lg text-gray-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-400">
              {stats.not_arrived}
            </p>
            <p className="text-xs text-gray-600/80 font-medium uppercase">
              Non arrivés
            </p>
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {employees.map((emp) => (
          <div
            key={emp.id_employe}
            className={`
              relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:shadow-md
              ${
                emp.status === "working"
                  ? "bg-card border-green-500/30 hover:border-green-500/50"
                  : ""
              }
              ${
                emp.status === "pause"
                  ? "bg-card border-orange-500/30 hover:border-orange-500/50"
                  : ""
              }
              ${
                emp.status === "departed"
                  ? "bg-card/50 border-border opacity-75"
                  : ""
              }
              ${
                emp.status === "not_arrived"
                  ? "bg-card/30 border-border opacity-60"
                  : ""
              }
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center border border-border">
                  <span className="text-sm font-bold text-primary">
                    {emp.prenom_employe.charAt(0)}
                    {emp.nom_employe.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground line-clamp-1">
                    {emp.prenom_employe} {emp.nom_employe}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {emp.post_employe}
                  </p>
                </div>
              </div>
              <div
                className={`
                h-3 w-3 rounded-full shadow-sm
                ${emp.status === "working" ? "bg-green-500 animate-pulse" : ""}
                ${emp.status === "pause" ? "bg-orange-500 animate-pulse" : ""}
                ${emp.status === "departed" ? "bg-blue-500" : ""}
                ${emp.status === "not_arrived" ? "bg-gray-300" : ""}
              `}
              />
            </div>

            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border/50">
              <span className="text-muted-foreground font-medium">
                {emp.status === "working" && "Au travail"}
                {emp.status === "pause" && "En pause"}
                {emp.status === "departed" && "Journée terminée"}
                {emp.status === "not_arrived" && "Absent"}
              </span>
              {emp.last_action_time && (
                <span className="flex items-center gap-1 text-foreground/80 font-mono bg-accent/10 px-1.5 py-0.5 rounded">
                  <Clock className="w-3 h-3" />
                  {emp.last_action_time.substring(0, 5)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
