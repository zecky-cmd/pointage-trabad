"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PointageButton from "@/components/PointageButton";
import type { User } from "@supabase/supabase-js";
import type {
  Pointage,
  ServerTimeData,
  ProfilUtilisateur,
} from "@/types/pointage_btn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Calendar } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { isWithinRadius } from "@/utils/geolocation";

export default function PointagePage() {
  const [loading, setLoading] = useState(true);

  const [employeId, setEmployeId] = useState<number | null>(null);
  const [serverTime, setServerTime] = useState<string>("");
  const [serverDate, setServerDate] = useState<string>("");
  const [pointageJour, setPointageJour] = useState<Pointage | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const updateServerTime = useCallback(async () => {
    const { data } = await supabase.rpc("get_server_time");
    if (data && Array.isArray(data) && data.length > 0) {
      const timeData = data[0] as ServerTimeData;
      setServerTime(timeData.server_time);
      setServerDate(timeData.server_date);
    }
  }, [supabase]);

  const loadPointageJour = useCallback(
    async (empId: number) => {
      const { data: serverData } = await supabase.rpc("get_server_time");
      if (
        !serverData ||
        !Array.isArray(serverData) ||
        serverData.length === 0
      ) {
        console.error("Erreur: impossible de récupérer la date serveur");
        return;
      }

      const timeData = serverData[0] as ServerTimeData;
      const dateJour = timeData.server_date;

      const { data } = await supabase
        .from("pointage")
        .select("*")
        .eq("id_employe", empId)
        .eq("date_pointage", dateJour)
        .single();

      if (data) {
        setPointageJour(data as Pointage);
      }
    },
    [supabase]
  );

  const loadData = useCallback(async () => {
    try {
      // Récupérer l'utilisateur
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/login");
        return;
      }

      // Récupérer l'ID employé
      const { data: profil } = await supabase
        .from("profil_utilisateur")
        .select("id_employe")
        .eq("id_profil", currentUser.id)
        .single();

      if (!profil?.id_employe) {
        throw new Error("Employé non trouvé");
      }
      const profilData = profil as ProfilUtilisateur;
      setEmployeId(profilData.id_employe);

      // Récupérer l'heure serveur
      await updateServerTime();

      // Récupérer le pointage du jour
      await loadPointageJour(profilData.id_employe);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router, updateServerTime, loadPointageJour]);

  useEffect(() => {
    loadData();
    const interval = setInterval(updateServerTime, 1000);
    return () => clearInterval(interval);
  }, [loadData, updateServerTime]);

  const {
    latitude,
    longitude,
    error: geoError,
    loading: geoLoading,
  } = useGeolocation();

  const handlePointer = async (
    type: "arrive" | "pause" | "reprise" | "depart"
  ) => {
    try {
      if (!employeId) {
        alert("Erreur: ID employé introuvable");
        return;
      }

      // Geolocation Check
      const companyLat = parseFloat(process.env.NEXT_PUBLIC_COMPANY_LAT || "0");
      const companyLng = parseFloat(process.env.NEXT_PUBLIC_COMPANY_LNG || "0");
      const allowedRadius = parseFloat(
        process.env.NEXT_PUBLIC_ALLOWED_RADIUS_METERS || "100"
      );

      const currentLat = latitude;
      const currentLng = longitude;

      // Si la localisation n'est pas encore chargée, on essaie de la récupérer
      if (!currentLat || !currentLng) {
        // On pourrait forcer un rafraichissement ici si nécessaire,
        // mais useGeolocation devrait déjà le faire.
        // Si c'est critique, on peut bloquer.
        if (geoLoading) {
          alert("Veuillez patienter, localisation en cours...");
          return;
        }
        if (geoError) {
          alert("Erreur de localisation: " + geoError);
          return;
        }
      }

      if (companyLat && companyLng) {
        if (currentLat && currentLng) {
          const isAllowed = isWithinRadius(
            currentLat,
            currentLng,
            companyLat,
            companyLng,
            allowedRadius
          );
          if (!isAllowed) {
            alert(
              "Vous devez être dans les locaux de l'entreprise pour pointer."
            );
            return;
          }
        } else {
          // Si on a des coordonnées d'entreprise mais pas de position utilisateur
          alert(
            "Impossible de récupérer votre position pour vérifier la zone."
          );
          return;
        }
      }

      const response = await fetch("/api/pointage/pointer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          latitude: currentLat,
          longitude: currentLng,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Erreur lors du pointage");
        return;
      }

      // Rafraîchir le pointage
      await loadPointageJour(employeId);

      // Message de succès
      // alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} pointée à ${result.heure}`)
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du pointage");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 animate-pulse">Chargement...</div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* En-tête avec date et heure */}
      <Card className="border-none shadow-md bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-2 text-blue-100">
              <Calendar className="h-5 w-5" />
              <h2 className="text-xl font-medium capitalize">
                {serverDate && formatDate(serverDate)}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-200" />
              <p className="text-5xl font-mono font-bold tracking-wider">
                {serverTime}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille de pointage */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Pointer mes heures
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PointageButton
            type="arrive"
            label="Arrivée"
            icon="🏢"
            heurePointee={pointageJour?.pointage_arrive}
            serverTime={serverTime}
            pointageJour={pointageJour}
            onPointer={handlePointer}
          />

          <PointageButton
            type="pause"
            label="Pause"
            icon="☕"
            heurePointee={pointageJour?.pointage_pause}
            serverTime={serverTime}
            pointageJour={pointageJour}
            onPointer={handlePointer}
          />

          <PointageButton
            type="reprise"
            label="Reprise"
            icon="💼"
            heurePointee={pointageJour?.pointage_reprise}
            serverTime={serverTime}
            pointageJour={pointageJour}
            onPointer={handlePointer}
          />

          <PointageButton
            type="depart"
            label="Départ"
            icon="🏠"
            heurePointee={pointageJour?.pointage_depart}
            serverTime={serverTime}
            pointageJour={pointageJour}
            onPointer={handlePointer}
          />
        </div>

        {/* Afficher le retard si existe */}
        {pointageJour && pointageJour.retard_minutes > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <p className="text-orange-800 font-medium">
                  Retard de {pointageJour.retard_minutes} minutes détecté
                </p>
              </div>
              {pointageJour.retard_minutes > 15 &&
                !pointageJour.justification_retard && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                    asChild
                  >
                    <Link href="/pointage/rapport">Justifier</Link>
                  </Button>
                )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
