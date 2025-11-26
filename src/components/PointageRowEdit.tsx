"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit2 } from "lucide-react";

interface PointageData {
  id_pointage: number;
  id_employe: string;
  date_pointage: string;
  pointage_arrive: string | null;
  pointage_pause: string | null;
  pointage_reprise: string | null;
  pointage_depart: string | null;
  justification_absence: string | null;
  justification_retard: string | null;
  statut_justification_absence: "en_attente" | "justifiee" | "rejetee" | null;
  statut_justification_retard: "en_attente" | "justifiee" | "rejetee" | null;
  retard_minutes: number;
  statut: "present" | "absent" | "weekend" | "conge";
}

interface FormDataType {
  pointage_arrive: string;
  pointage_pause: string;
  pointage_reprise: string;
  pointage_depart: string;
  justification_absence: string | null;
  justification_retard: string | null;
  statut_justification_absence: "en_attente" | "justifiee" | "rejetee" | null;
  statut_justification_retard: "en_attente" | "justifiee" | "rejetee" | null;
}

interface Props {
  pointage: PointageData;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  calculerHeures: (p: PointageData) => number;
  formatDuree: (h: number) => string;
}

export default function PointageRowEdit({
  pointage,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  calculerHeures,
  formatDuree,
}: Props) {
  const [formData, setFormData] = useState<FormDataType>({
    pointage_arrive: pointage.pointage_arrive || "",
    pointage_pause: pointage.pointage_pause || "",
    pointage_reprise: pointage.pointage_reprise || "",
    pointage_depart: pointage.pointage_depart || "",
    justification_absence: pointage.justification_absence || null,
    justification_retard: pointage.justification_retard || null,
    statut_justification_absence: pointage.statut_justification_absence || null,
    statut_justification_retard: pointage.statut_justification_retard || null,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/pointage/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_pointage: pointage.id_pointage,
          ...formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la sauvegarde");
      }

      alert("✅ Pointage mis à jour avec succès");
      onSave();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      console.error("Erreur:", err);
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  if (isEditing) {
    return (
      <tr className="bg-muted/50">
        <td className="px-3 py-3 text-sm font-medium">
          {formatDate(pointage.date_pointage)}
        </td>
        <td className="px-2 py-2">
          <Input
            type="time"
            value={formData.pointage_arrive}
            onChange={(e) =>
              setFormData({ ...formData, pointage_arrive: e.target.value })
            }
            className="h-8 text-xs"
          />
        </td>
        <td className="px-2 py-2">
          <Input
            type="time"
            value={formData.pointage_pause}
            onChange={(e) =>
              setFormData({ ...formData, pointage_pause: e.target.value })
            }
            className="h-8 text-xs"
          />
        </td>
        <td className="px-2 py-2">
          <Input
            type="time"
            value={formData.pointage_reprise}
            onChange={(e) =>
              setFormData({ ...formData, pointage_reprise: e.target.value })
            }
            className="h-8 text-xs"
          />
        </td>
        <td className="px-2 py-2">
          <Input
            type="time"
            value={formData.pointage_depart}
            onChange={(e) =>
              setFormData({ ...formData, pointage_depart: e.target.value })
            }
            className="h-8 text-xs"
          />
        </td>
        <td className="px-3 py-2 text-sm text-center">-</td>
        <td className="px-3 py-2 text-sm text-center">-</td>
        <td className="px-3 py-2 text-sm text-center">-</td>
        <td className="px-2 py-2">
          <div className="space-y-1">
            {pointage.justification_absence && (
              <select
                value={formData.statut_justification_absence || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    statut_justification_absence:
                      (e.target.value as
                        | "en_attente"
                        | "justifiee"
                        | "rejetee") || null,
                  })
                }
                className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Non traité</option>
                <option value="en_attente">En attente</option>
                <option value="justifiee">Justifiée</option>
                <option value="rejetee">Rejetée</option>
              </select>
            )}
            {pointage.justification_retard && (
              <select
                value={formData.statut_justification_retard || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    statut_justification_retard:
                      (e.target.value as
                        | "en_attente"
                        | "justifiee"
                        | "rejetee") || null,
                  })
                }
                className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Non traité</option>
                <option value="en_attente">En attente</option>
                <option value="justifiee">Justifiée</option>
                <option value="rejetee">Rejetée</option>
              </select>
            )}
          </div>
        </td>
        <td className="px-2 py-2">
          <div className="flex items-center gap-1">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="icon"
              variant="default"
              className="h-8 w-8 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              onClick={onCancel}
              disabled={saving}
              size="icon"
              variant="outline"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className={`hover:bg-muted/50 transition-colors ${
        pointage.statut === "weekend" ? "bg-muted/30" : ""
      }`}
    >
      <td className="px-3 py-3 text-sm font-medium">
        {formatDate(pointage.date_pointage)}
      </td>
      <td className="px-3 py-3 text-sm font-mono text-muted-foreground">
        {pointage.pointage_arrive || "----"}
      </td>
      <td className="px-3 py-3 text-sm font-mono text-muted-foreground">
        {pointage.pointage_pause || "----"}
      </td>
      <td className="px-3 py-3 text-sm font-mono text-muted-foreground">
        {pointage.pointage_reprise || "----"}
      </td>
      <td className="px-3 py-3 text-sm font-mono text-muted-foreground">
        {pointage.pointage_depart || "----"}
      </td>
      <td className="px-3 py-3 text-sm font-semibold">
        {formatDuree(calculerHeures(pointage))}
      </td>
      <td className="px-3 py-3 text-sm">
        {pointage.retard_minutes > 0 ? (
          <span
            className={`font-semibold ${
              pointage.retard_minutes > 15 ? "text-red-600" : "text-orange-600"
            }`}
          >
            {pointage.retard_minutes}min
          </span>
        ) : (
          <span className="text-green-600 text-xs">OK</span>
        )}
      </td>
      <td className="px-3 py-3 text-sm">
        <Badge
          variant={
            pointage.statut === "present"
              ? "success"
              : pointage.statut === "absent"
              ? "danger"
              : "secondary"
          }
          className="capitalize"
        >
          {pointage.statut === "present"
            ? "Présent"
            : pointage.statut === "absent"
            ? "Absent"
            : "Week-end"}
        </Badge>
      </td>
      <td className="px-3 py-3 text-xs">
        <div className="space-y-1">
          {pointage.justification_absence && (
            <Badge
              variant="outline"
              className={`w-full justify-center ${
                pointage.statut_justification_absence === "justifiee"
                  ? "border-green-500 text-green-700 bg-green-50"
                  : pointage.statut_justification_absence === "rejetee"
                  ? "border-red-500 text-red-700 bg-red-50"
                  : "border-yellow-500 text-yellow-700 bg-yellow-50"
              }`}
            >
              Abs: {pointage.statut_justification_absence || "En attente"}
            </Badge>
          )}
          {pointage.justification_retard && (
            <Badge
              variant="outline"
              className={`w-full justify-center ${
                pointage.statut_justification_retard === "justifiee"
                  ? "border-green-500 text-green-700 bg-green-50"
                  : pointage.statut_justification_retard === "rejetee"
                  ? "border-red-500 text-red-700 bg-red-50"
                  : "border-yellow-500 text-yellow-700 bg-yellow-50"
              }`}
            >
              Ret: {pointage.statut_justification_retard || "En attente"}
            </Badge>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-sm">
        <Button
          onClick={onEdit}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
