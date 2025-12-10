"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Eye, MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Ouvrir le menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link
            href={`/employes/${employeeId}`}
            className="flex items-center cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4" />
            Voir détails
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={`/employes/${employeeId}/modifier`}
            className="flex items-center cursor-pointer"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleToggleStatut}
          disabled={loading}
          className="flex items-center cursor-pointer"
        >
          <Power className="mr-2 h-4 w-4" />
          {statut === "actif" ? "Désactiver" : "Activer"}
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center text-red-600 focus:text-red-600 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
