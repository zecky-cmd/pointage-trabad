"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmployeeActionsProps {
  employeeId: number;
  statut: "actif" | "inactif";
  isAdmin: boolean;
}

export default function EmployeeActions({
  employeeId,
  statut,
  isAdmin,
}: EmployeeActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleToggleStatut = async () => {
    if (
      !confirm(
        `Voulez-vous vraiment ${
          statut === "actif" ? "désactiver" : "activer"
        } cet employé ?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/employees/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          newStatus: statut === "actif" ? "inactif" : "actif",
        }),
      });

      if (!response.ok) throw new Error("Erreur");

      router.refresh();
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);
      alert("Erreur lors du changement de statut");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "⚠️ ATTENTION : Voulez-vous vraiment SUPPRIMER cet employé ? Cette action est irréversible !"
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/employees/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });

      if (!response.ok) throw new Error("Erreur");

      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" asChild title="Voir">
        <Link href={`/employes/${employeeId}`}>
          <Eye className="h-4 w-4 text-blue-600" />
        </Link>
      </Button>

      <Button variant="ghost" size="icon" asChild title="Modifier">
        <Link href={`/employes/${employeeId}/modifier`}>
          <Pencil className="h-4 w-4 text-green-600" />
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleStatut}
        disabled={loading}
        title={statut === "actif" ? "Désactiver" : "Activer"}
        className={statut === "actif" ? "text-orange-600" : "text-green-600"}
      >
        <Power className="h-4 w-4" />
      </Button>

      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={loading}
          title="Supprimer"
          className="text-red-600 hover:text-red-900 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
