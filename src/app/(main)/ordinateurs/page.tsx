import { getOrdinateurs } from "@/app/actions/ordinateurs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dropdown-menu";
import {
  Monitor,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash,
  Laptop,
  Smartphone,
  Server,
  HardDrive,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { Ordinateur, OrdinateurEtat } from "@/types/ordinateur";

export default async function OrdinateursPage() {
  const ordinateurs = await getOrdinateurs();

  // Metrics
  const total = ordinateurs.length;
  const disponibles = ordinateurs.filter(
    (o) => !o.affecte_a && o.etat === "Fonctionnel"
  ).length;
  const affectes = ordinateurs.filter((o) => o.affecte_a).length;
  const enPanne = ordinateurs.filter((o) => o.etat === "En panne").length;
  const enReparation = ordinateurs.filter(
    (o) => o.etat === "En réparation"
  ).length;

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="w-8 h-8 text-blue-500" />
            Parc Informatique
          </h1>
          <p className="text-gray-400">
            Gestion des ordinateurs et affectations
          </p>
        </div>
        <Link href="/ordinateurs/nouveau">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nouvel ordinateur
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-3 bg-[#1e1e2d] border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Monitor className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{total}</p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-[#1e1e2d] border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Monitor className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{disponibles}</p>
              <p className="text-xs text-gray-400">Disponibles</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-[#1e1e2d] border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Monitor className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{affectes}</p>
              <p className="text-xs text-gray-400">Affectés</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-[#1e1e2d] border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Monitor className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{enPanne}</p>
              <p className="text-xs text-gray-400">En panne</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 bg-[#1e1e2d] border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Monitor className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{enReparation}</p>
              <p className="text-xs text-gray-400">En réparation</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="bg-[#1e1e2d] border-white/10">
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par code, marque, modèle..."
              className="pl-9 bg-[#1a1a27] border-white/10"
            />
          </div>
          <div className="flex gap-2">
            {/* Filters placeholders - functionality to be added */}
            <Button variant="outline" className="border-white/10 text-black">
              Tous les types
            </Button>
            <Button variant="outline" className="border-white/10 text-black">
              Tous les états
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-white/30 hover:bg-white/5">
              <TableHead>Code inventaire</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Marque / Modèle</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>État</TableHead>
              <TableHead>Affecté à</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordinateurs.map((ordinateur) => (
              <TableRow
                key={ordinateur.id_ordinateur}
                className="border-white/10 hover:bg-white/5 h-12"
              >
                <TableCell className="font-medium text-xs">
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
                    className={`text-xs ${getStatusColor(ordinateur.etat)}`}
                  >
                    {ordinateur.etat}
                  </Badge>
                </TableCell>
                <TableCell className="py-2">
                  {ordinateur.employe ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">
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
                        className="h-6 w-6 hover:bg-white/10"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-white border-white/10"
                    >
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem className="hover:bg-white/10 cursor-pointer text-xs">
                        <Link
                          href={`/ordinateurs/${ordinateur.id_ordinateur}/details`}
                          className="flex items-center w-full"
                        >
                          <Eye className="w-3 h-3 mr-2" />
                          Voir détails
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-white/10 cursor-pointer text-xs">
                        <Link
                          href={`/ordinateurs/${ordinateur.id_ordinateur}`}
                          className="flex items-center w-full"
                        >
                          <Pencil className="w-3 h-3 mr-2" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-red-500/20 text-red-500 cursor-pointer text-xs">
                        <Trash className="w-3 h-3 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Users(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
