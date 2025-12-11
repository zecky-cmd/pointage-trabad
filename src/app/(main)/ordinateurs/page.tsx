import { getOrdinateurs } from "@/app/actions/ordinateurs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Monitor, Plus } from "lucide-react";
import Link from "next/link";
import { OrdinateurEtat } from "@/types/ordinateur";
import { OrdinateursList } from "@/components/ordinateurs/OrdinateursList";

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
              <p className="text-xl text-white font-bold">{total}</p>
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
              <p className="text-xl text-white font-bold">{disponibles}</p>
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
              <p className="text-xl text-white font-bold">{affectes}</p>
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
              <p className="text-xl text-white font-bold">{enPanne}</p>
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
              <p className="text-xl text-white font-bold">{enReparation}</p>
              <p className="text-xs text-gray-400">En réparation</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Table */}
      <OrdinateursList initialOrdinateurs={ordinateurs} />
    </div>
  );
}

function Users(props: React.SVGProps<SVGSVGElement>) {
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
