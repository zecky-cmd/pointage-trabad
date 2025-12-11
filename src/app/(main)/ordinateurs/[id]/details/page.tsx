"use client";

import { createClient } from "@/utils/supabase/client";
import { getHistorique, getOrdinateurById } from "@/app/actions/ordinateurs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Pencil,
  Monitor,
  Calendar,
  User,
  FileText,
  Shield,
  HardDrive,
  Hash,
  History,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, use } from "react";
import { toast } from "react-toastify";
import { Ordinateur, EquipementHistorique } from "@/types/ordinateur";
import { ContractPrint } from "@/components/ordinateurs/ContractPrint";
import { useReactToPrint } from "react-to-print";

// Helper components for display
interface DetailRowProps {
  icon: React.ElementType;
  label: string;
  value?: string | number | null;
  className?: string;
}

const DetailRow = ({ icon: Icon, label, value, className }: DetailRowProps) => (
  <div
    className={`flex items-start gap-3 p-3 rounded-lg bg-[#1a1a27] border border-white/5 ${className}`}
  >
    <div className="p-2 rounded-md bg-white/5 text-blue-400">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-medium text-white mt-1">
        {value || <span className="text-gray-600 italic">Non spécifié</span>}
      </p>
    </div>
  </div>
);

export default function ComputerDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [ordinateur, setOrdinateur] = useState<Ordinateur | null>(null);
  const [historique, setHistorique] = useState<EquipementHistorique[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState<string>("");

  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Contrat_${ordinateur?.code_inventaire || "Materiel"}`,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          console.log("user", user);
          const name = user.user_metadata?.full_name || "";
          setAdminName(name);
        }

        const [data, historyData] = await Promise.all([
          getOrdinateurById(id),
          getHistorique(id),
        ]);
        setOrdinateur(data);
        setHistorique(historyData || []);
      } catch {
        toast.error("Erreur lors du chargement des détails");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading)
    return (
      <div className="p-8 text-center text-gray-400">
        Chargement des détails...
      </div>
    );
  if (!ordinateur)
    return (
      <div className="p-8 text-center text-red-400">Ordinateur non trouvé</div>
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Fonctionnel":
        return "bg-emerald-500/15 text-emerald-500 border-emerald-500/20";
      case "En panne":
        return "bg-red-500/15 text-red-500 border-red-500/20";
      case "En réparation":
        return "bg-amber-500/15 text-amber-500 border-amber-500/20";
      default:
        return "bg-gray-500/15 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hidden Contract Component for Printing */}
      <div style={{ display: "none" }}>
        <ContractPrint
          ref={componentRef}
          ordinateur={ordinateur}
          date={new Date().toLocaleDateString()}
          adminName={adminName}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ordinateurs">
            <Button variant="ghost" size="icon" className="hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {ordinateur.code_inventaire}
              <Badge
                className={`text-sm font-normal border ${getStatusColor(
                  ordinateur.etat
                )}`}
              >
                {ordinateur.etat}
              </Badge>
            </h1>
            <p className="text-gray-400">
              {ordinateur.marque} {ordinateur.modele}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {ordinateur.employe && (
            <Button
              onClick={() => handlePrint && handlePrint()}
              className="bg-black/50 hover:bg-black/75 text-white border border-black/10"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
          )}
          <Link href={`/ordinateurs/${ordinateur.id_ordinateur}`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Pencil className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#1e1e2d] text-white/80 border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-500" />
              Informations Matériel
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailRow
                icon={Hash}
                label="Numéro de Série"
                value={ordinateur.numero_serie}
              />
              <DetailRow
                icon={HardDrive}
                label="Type"
                value={ordinateur.type}
              />
              <DetailRow icon={Monitor} label="OS" value={ordinateur.os} />
              <DetailRow
                icon={Calendar}
                label="Processeur"
                value={ordinateur.processeur}
              />
              <DetailRow icon={HardDrive} label="RAM" value={ordinateur.ram} />
              <DetailRow
                icon={HardDrive}
                label="Disque Dur"
                value={ordinateur.disque_dur}
              />
              <DetailRow
                icon={Calendar}
                label="Date d'acquisition"
                value={
                  ordinateur.date_acquisition
                    ? new Date(ordinateur.date_acquisition).toLocaleDateString()
                    : null
                }
              />
            </div>
          </Card>

          {/* History Section */}
          <Card className="bg-[#1e1e2d] border-white/10 p-6">
            <h2 className="text-lg text-white/80 font-semibold mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-orange-500" />
              Historique des Affectations
            </h2>
            <div className="space-y-4">
              {historique.length > 0 ? (
                historique.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-start gap-4 p-3 bg-[#1a1a27] rounded-lg border border-white/5"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-xs ring-1 ring-orange-500/20">
                      {h.employe?.prenom_employe?.[0] || "?"}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-white">
                          {h.type_action === "affectation"
                            ? "Affecté à"
                            : h.type_action}{" "}
                          : {h.employe?.prenom_employe} {h.employe?.nom_employe}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(h.date_debut).toLocaleDateString()}
                        </span>
                      </div>
                      {h.date_fin && (
                        <p className="text-xs text-gray-400 mt-1">
                          Restitué le{" "}
                          {new Date(h.date_fin).toLocaleDateString()}
                        </p>
                      )}
                      {h.commentaire && (
                        <p className="text-xs text-gray-500 italic mt-1">
                          &quot;{h.commentaire}&quot;
                        </p>
                      )}
                      {h.auteur && (
                        <p className="text-xs text-gray-400 mt-1">
                          Par :{" "}
                          <span className="text-gray-300">{h.auteur}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic text-center py-4">
                  Aucun historique disponible.
                </p>
              )}
            </div>
          </Card>

          <Card className="bg-[#1e1e2d] text-white/80 border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Notes & Commentaires
            </h2>
            <p className="text-gray-300 leading-relaxed bg-[#1a1a27] p-4 rounded-lg border border-white/5 min-h-[100px]">
              {ordinateur.commentaire || "Aucun commentaire enregistré."}
            </p>
          </Card>
        </div>

        {/* Side Column (Image & Assignment & Security) */}
        <div className="space-y-6">
          {/* Image Card */}
          <Card className="bg-[#1e1e2d] border-white/10 p-6 flex flex-col items-center text-center">
            <div className="w-full aspect-video bg-[#1a1a27] rounded-lg border border-white/5 flex items-center justify-center mb-4 overflow-hidden relative group">
              {ordinateur.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ordinateur.image_url}
                  alt="Ordinateur"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Monitor className="w-16 h-16 text-gray-600" />
              )}
            </div>
            <p className="text-sm text-gray-500">Image du produit</p>
          </Card>

          {/* Assignment Card */}
          <Card className="bg-[#1e1e2d] text-white/80 border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" />
              Affectation
            </h2>
            {ordinateur.employe ? (
              <div className="bg-[#1a1a27] rounded-lg p-4 border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                    {ordinateur.employe.prenom_employe[0]}
                    {ordinateur.employe.nom_employe[0]}
                  </div>
                  <div>
                    <p className="font-bold text-white">
                      {ordinateur.employe.prenom_employe}{" "}
                      {ordinateur.employe.nom_employe}
                    </p>
                    <p className="text-xs text-emerald-400">
                      Actuellement assigné
                    </p>
                  </div>
                </div>
                {ordinateur.date_affectation && (
                  <p className="text-xs text-gray-500 mt-2">
                    Depuis le:{" "}
                    {new Date(ordinateur.date_affectation).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-[#1a1a27] rounded-lg p-4 border border-white/5 text-center">
                <p className="text-gray-500">Non assigné</p>
              </div>
            )}
          </Card>

          {/* Security Card */}
          {ordinateur.password && (
            <Card className="bg-[#1e1e2d] border-white/10 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Sécurité
              </h2>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-xs text-red-400 uppercase font-bold mb-1">
                  Mot de passe Admin
                </p>
                <p className="font-mono text-white tracking-wider">
                  {ordinateur.password}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
