"use client";

import { Trash } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { deleteOrdinateur } from "@/app/actions/ordinateurs";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface DeleteOrdinateurItemProps {
  id: string;
}

export function DeleteOrdinateurItem({ id }: DeleteOrdinateurItemProps) {
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cet ordinateur ? cette action est irréversible."
      )
    ) {
      return;
    }

    try {
      await deleteOrdinateur(id);
      toast.success("Ordinateur supprimé avec succès");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression");
    }
  }

  return (
    <DropdownMenuItem
      className="hover:bg-red-500/20 text-red-500 cursor-pointer text-xs focus:bg-red-500/20 focus:text-red-500"
      onClick={handleDelete}
    >
      <Trash className="w-3 h-3 mr-2" />
      Supprimer
    </DropdownMenuItem>
  );
}
