"use client";

import { getOrdinateurById, updateOrdinateur } from "@/app/actions/ordinateurs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Ordinateur, OrdinateurEtat, OrdinateurType } from "@/types/ordinateur";
import { ArrowLeft, Save, Monitor, Cpu, HardDrive } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { createClient } from "@/utils/supabase/client";

export default function EditOrdinateurPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ordinateur, setOrdinateur] = useState<Ordinateur | null>(null);
  const [employes, setEmployes] = useState<
    { id_employe: number; nom_employe: string; prenom_employe: string }[]
  >([]);
  const [selectedType, setSelectedType] = useState("Portable");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getOrdinateurById(params.id);
        setOrdinateur(data);
        if (data && data.type) setSelectedType(data.type); // Set initial type

        const supabase = createClient();
        const { data: employesData } = await supabase
          .from("employe")
          .select("id_employe, nom_employe, prenom_employe");
        if (employesData) setEmployes(employesData);
      } catch (error) {
        toast.error("Erreur lors du chargement");
      }
    }
    loadData();
  }, [params.id]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const data: Partial<Ordinateur> = {
        code_inventaire: formData.get("code_inventaire") as string,
        marque: formData.get("marque") as string,
        modele: formData.get("modele") as string,
        numero_serie: formData.get("numero_serie") as string,
        type: formData.get("type") as OrdinateurType,
        etat: formData.get("etat") as OrdinateurEtat,
        os: formData.get("os") as string,
        processeur: formData.get("processeur") as string,
        ram: formData.get("ram") as string,
        disque_dur: formData.get("disque_dur") as string,
        image_url: formData.get("image_url") as string,
        password: formData.get("password") as string,
        commentaire: formData.get("commentaire") as string,
        date_acquisition: formData.get("date_acquisition")
          ? (formData.get("date_acquisition") as string)
          : undefined,
      };

      const affecte_a = formData.get("affecte_a");
      if (affecte_a && affecte_a !== "none") {
        data.affecte_a = Number(affecte_a);
        data.date_affectation = new Date().toISOString();
      } else {
        data.affecte_a = null;
        data.date_affectation = undefined; // undefined is compatible with optional string
        data.date_restitution = new Date().toISOString();
      }

      await updateOrdinateur(params.id, data);
      toast.success("Ordinateur mis à jour");
      router.push("/ordinateurs");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }

  if (!ordinateur)
    return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/ordinateurs">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Modifier Ordinateur</h1>
          <p className="text-xs text-gray-400">
            {ordinateur.code_inventaire} - {ordinateur.marque}{" "}
            {ordinateur.modele}
          </p>
        </div>
      </div>

      <Card className="bg-[#1e1e2d] border-white/10 p-5">
        <form action={handleSubmit} className="space-y-5">
          {/* Section: Identification */}
          <div>
            <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-blue-500" />
              Identification
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-xs">
                  Type *
                </Label>
                <Select
                  name="type"
                  required
                  defaultValue={ordinateur.type}
                  onValueChange={(val) => setSelectedType(val)}
                >
                  <SelectTrigger className="bg-[#1a1a27] border-white/10 h-9 text-sm">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Portable">Portable</SelectItem>
                    <SelectItem value="Fixe">Fixe</SelectItem>
                    <SelectItem value="Tablette">Tablette</SelectItem>
                    <SelectItem value="Serveur">Serveur</SelectItem>
                    <SelectItem value="Périphérique">Périphérique</SelectItem>
                    <SelectItem value="Téléphone">Téléphone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code_inventaire" className="text-xs">
                  Code Inventaire *
                </Label>
                <Input
                  id="code_inventaire"
                  name="code_inventaire"
                  defaultValue={ordinateur.code_inventaire}
                  required
                  className="bg-[#1a1a27] border-white/10 h-9 text-sm focus-visible:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="marque" className="text-xs">
                  Marque *
                </Label>
                <Input
                  id="marque"
                  name="marque"
                  defaultValue={ordinateur.marque}
                  required
                  className="bg-[#1a1a27] border-white/10 h-9 text-sm focus-visible:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modele" className="text-xs">
                  {selectedType === "Téléphone"
                    ? "Nom du téléphone *"
                    : "Modèle *"}
                </Label>
                <Input
                  id="modele"
                  name="modele"
                  defaultValue={ordinateur.modele}
                  required
                  className="bg-[#1a1a27] border-white/10 h-9 text-sm focus-visible:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="numero_serie" className="text-xs">
                  {selectedType === "Téléphone"
                    ? "IMEI / N° Série *"
                    : "N° Série *"}
                </Label>
                <Input
                  id="numero_serie"
                  name="numero_serie"
                  defaultValue={ordinateur.numero_serie}
                  required
                  className="bg-[#1a1a27] border-white/10 h-9 text-sm focus-visible:ring-blue-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date_acquisition" className="text-xs">
                  Date d&apos;acquisition
                </Label>
                <Input
                  type="date"
                  id="date_acquisition"
                  name="date_acquisition"
                  defaultValue={
                    ordinateur.date_acquisition
                      ? new Date(ordinateur.date_acquisition)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  className="bg-[#1a1a27] border-white/10 h-9 text-sm filter-white-icon"
                />
              </div>
            </div>
          </div>

          {/* Section: Spécifications */}
          <div>
            <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-500" />
              Spécifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {selectedType !== "Téléphone" && (
                <div className="space-y-1.5">
                  <Label htmlFor="processeur" className="text-xs">
                    Processeur
                  </Label>
                  <Input
                    id="processeur"
                    name="processeur"
                    defaultValue={ordinateur.processeur}
                    placeholder="ex: i7-1185G7"
                    className="bg-[#1a1a27] border-white/10 h-9 text-sm focus-visible:ring-purple-500/50"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="ram" className="text-xs">
                  RAM
                </Label>
                <Input
                  id="ram"
                  name="ram"
                  defaultValue={ordinateur.ram}
                  placeholder="ex: 16 Go"
                  className="bg-[#1a1a27] border-white/10 h-9 text-sm focus-visible:ring-purple-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="disque_dur" className="text-xs">
                  {selectedType === "Téléphone" ? "Stockage" : "Disque Dur"}
                </Label>
                <Input
                  id="disque_dur"
                  name="disque_dur"
                  defaultValue={ordinateur.disque_dur}
                  placeholder={
                    selectedType === "Téléphone"
                      ? "ex: 128 Go"
                      : "ex: 512 Go SSD"
                  }
                  className="bg-[#1a1a27] border-white/10 h-9 text-sm focus-visible:ring-purple-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="os" className="text-xs">
                  Système (OS)
                </Label>
                <Input
                  id="os"
                  name="os"
                  defaultValue={ordinateur.os}
                  className="bg-[#1a1a27] border-white/10 h-9 text-sm focus-visible:ring-purple-500/50"
                />
              </div>
            </div>
          </div>

          {/* Section: État & Autres */}
          <div>
            <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-500" />
              État & Divers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="etat" className="text-xs">
                  État *
                </Label>
                <Select name="etat" required defaultValue={ordinateur.etat}>
                  <SelectTrigger className="bg-[#1a1a27] border-white/10 h-9 text-sm">
                    <SelectValue placeholder="État" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fonctionnel">Fonctionnel</SelectItem>
                    <SelectItem value="En panne">En panne</SelectItem>
                    <SelectItem value="En réparation">En réparation</SelectItem>
                    <SelectItem value="Hors service">Hors service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="affecte_a" className="text-xs">
                  Affecté à
                </Label>
                <Select
                  name="affecte_a"
                  defaultValue={ordinateur.affecte_a?.toString() || "none"}
                >
                  <SelectTrigger className="bg-[#1a1a27] border-white/10 h-9 text-sm">
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Non affecté --</SelectItem>
                    {employes.map((emp) => (
                      <SelectItem
                        key={emp.id_employe}
                        value={emp.id_employe.toString()}
                      >
                        {emp.prenom_employe} {emp.nom_employe}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="image_url" className="text-xs">
                  Image URL
                </Label>
                <Input
                  id="image_url"
                  name="image_url"
                  defaultValue={ordinateur.image_url}
                  placeholder="https://..."
                  className="bg-[#1a1a27] border-white/10 h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">
                  Mdp Admin / PIN
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="text"
                  defaultValue={ordinateur.password}
                  className="bg-[#1a1a27] border-white/10 h-9 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="commentaire" className="text-xs">
              Commentaire
            </Label>
            <Textarea
              id="commentaire"
              name="commentaire"
              defaultValue={ordinateur.commentaire}
              className="bg-[#1a1a27] border-white/10 min-h-[80px] text-sm focus-visible:ring-blue-500/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
            <Link href="/ordinateurs">
              <Button
                type="button"
                variant="outline"
                className="border-white/10 h-9 bg-red-600 hover:bg-red/5 text-sm"
              >
                Annuler
              </Button>
            </Link>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 h-9 text-sm"
              disabled={loading}
            >
              <Save className="w-3.5 h-3.5 mr-2" />
              {loading ? "Mise à jour..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
