"use client";

import { useState } from "react";
import { Ordinateur, OrdinateurEtat } from "@/types/ordinateur";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Laptop,
  Monitor,
  Smartphone,
  Server,
  HardDrive,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { DeleteOrdinateurItem } from "./DeleteOrdinateurItem";

interface OrdinateursListProps {
  initialOrdinateurs: Ordinateur[];
}

export function OrdinateursList({ initialOrdinateurs }: OrdinateursListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [etatFilter, setEtatFilter] = useState<string>("all");

  // Get unique types and etats for filters
  const types = Array.from(new Set(initialOrdinateurs.map((o) => o.type)));
  const etats = Array.from(new Set(initialOrdinateurs.map((o) => o.etat)));

  const filteredOrdinateurs = initialOrdinateurs.filter((ordinateur) => {
    const matchesSearch =
      ordinateur.code_inventaire
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      ordinateur.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ordinateur.modele.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ordinateur.employe &&
        `${ordinateur.employe.prenom_employe} ${ordinateur.employe.nom_employe}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === "all" || ordinateur.type === typeFilter;
    const matchesEtat = etatFilter === "all" || ordinateur.etat === etatFilter;

    return matchesSearch && matchesType && matchesEtat;
  });

  const getStatusColor = (status: OrdinateurEtat) => {
    switch (status) {
      case "Fonctionnel":
        return "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25";
      case "En panne":
        return "bg-red-500/15 text-red-500 hover:bg-red-500/25";
      case "En réparation":
        return "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25";
      case "Hors service":
        return "bg-gray-500/15 text-gray-500 hover:bg-gray-500/25";
      default:
        return "bg-gray-500/15 text-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Portable":
        return <Laptop className="w-4 h-4" />;
      case "Fixe":
        return <Monitor className="w-4 h-4" />;
      case "Tablette":
        return <Smartphone className="w-4 h-4" />;
      case "Serveur":
        return <Server className="w-4 h-4" />;
      default:
        return <HardDrive className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-[#1e1e2d] border border-white/10 rounded-lg shadow-sm">
      <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher par code, marque, modèle..."
            className="pl-9 bg-[#1a1a27] text-gray-400 border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-white/10 text-white bg-transparent hover:bg-white/5"
              >
                <Filter className="w-4 h-4 mr-2" />
                {typeFilter === "all" ? "Tous les types" : typeFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#1e1e2d] border-white/10 text-white"
            >
              <DropdownMenuLabel>Filtrer par type</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "all"}
                onCheckedChange={() => setTypeFilter("all")}
                className="hover:bg-white/10 cursor-pointer"
              >
                Tous les types
              </DropdownMenuCheckboxItem>
              {types.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={typeFilter === type}
                  onCheckedChange={() => setTypeFilter(type)}
                  className="hover:bg-white/10 cursor-pointer"
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-white/10 text-white bg-transparent hover:bg-white/5"
              >
                <Filter className="w-4 h-4 mr-2" />
                {etatFilter === "all" ? "Tous les états" : etatFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#1e1e2d] border-white/10 text-white"
            >
              <DropdownMenuLabel>Filtrer par état</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={etatFilter === "all"}
                onCheckedChange={() => setEtatFilter("all")}
                className="hover:bg-white/10 cursor-pointer"
              >
                Tous les états
              </DropdownMenuCheckboxItem>
              {etats.map((etat) => (
                <DropdownMenuCheckboxItem
                  key={etat}
                  checked={etatFilter === etat}
                  onCheckedChange={() => setEtatFilter(etat)}
                  className="hover:bg-white/10 cursor-pointer"
                >
                  {etat}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-white/5">
            <TableHead className="text-gray-400">Code inventaire</TableHead>
            <TableHead className="text-gray-400">Type</TableHead>
            <TableHead className="text-gray-400">Marque / Modèle</TableHead>
            <TableHead className="text-gray-400">OS</TableHead>
            <TableHead className="text-gray-400">État</TableHead>
            <TableHead className="text-gray-400">Affecté à</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrdinateurs.length === 0 ? (
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableCell colSpan={7} className="h-24 text-center text-gray-400">
                Aucun ordinateur trouvé.
              </TableCell>
            </TableRow>
          ) : (
            filteredOrdinateurs.map((ordinateur) => (
              <TableRow
                key={ordinateur.id_ordinateur}
                className="border-white/10 hover:bg-white/5 h-12"
              >
                <TableCell className="font-medium text-xs text-white">
                  {ordinateur.code_inventaire}
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    {getTypeIcon(ordinateur.type)}
                    {ordinateur.type}
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <div>
                    <div className="font-medium text-white text-sm">
                      {ordinateur.marque}
                    </div>
                    <div className="text-xs text-gray-400">
                      {ordinateur.modele}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-400 text-xs py-2">
                  {ordinateur.os}
                </TableCell>
                <TableCell className="py-2">
                  <Badge
                    className={`text-xs border-none ${getStatusColor(
                      ordinateur.etat
                    )}`}
                  >
                    {ordinateur.etat}
                  </Badge>
                </TableCell>
                <TableCell className="py-2">
                  {ordinateur.employe ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                        {ordinateur.employe.prenom_employe[0]}
                        {ordinateur.employe.nom_employe[0]}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white">
                          {ordinateur.employe.prenom_employe}{" "}
                          {ordinateur.employe.nom_employe}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-xs">Non affecté</span>
                  )}
                </TableCell>
                <TableCell className="py-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-[#1e1e2d] border-white/10 text-white"
                    >
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem className="hover:bg-white/10 cursor-pointer text-xs focus:bg-white/10 focus:text-white">
                        <Link
                          href={`/ordinateurs/${ordinateur.id_ordinateur}/details`}
                          className="flex items-center w-full"
                        >
                          <Eye className="w-3 h-3 mr-2" />
                          Voir détails
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-white/10 cursor-pointer text-xs focus:bg-white/10 focus:text-white">
                        <Link
                          href={`/ordinateurs/${ordinateur.id_ordinateur}`}
                          className="flex items-center w-full"
                        >
                          <Pencil className="w-3 h-3 mr-2" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DeleteOrdinateurItem id={ordinateur.id_ordinateur} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
