"use client";

import { Ordinateur, OrdinateurEtat, OrdinateurType } from "@/types/ordinateur";

import { createOrdinateur } from "@/app/actions/ordinateurs";
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
import { ArrowLeft, Save, Monitor, Cpu, HardDrive } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

export default function NouveauOrdinateurPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("Portable");

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

      await createOrdinateur(data);
      toast.success("Ordinateur créé avec succès");
      router.push("/ordinateurs");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

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
          <h1 className="text-xl font-bold">Nouvel Ordinateur</h1>
          <p className="text-xs text-gray-400">Ajouter un nouvel équipement</p>
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
                <Label htmlFor="type" className="text-xs text-white/75">
                  Type *
                </Label>
                <Select
                  name="type"
                  required
                  defaultValue="Portable"
                  onValueChange={(val) => setSelectedType(val)}
                >
                  <SelectTrigger className="bg-[#1a1a27] text-white/80 border-white/10 h-9 text-sm">
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
                <Label htmlFor="code_inventaire" className="text-xs text-white/75">
                  Code Inventaire *
                </Label>
                <Input
                  id="code_inventaire"
                  name="code_inventaire"
                  placeholder="ex: PC-001"
                  required
                  className="bg-[#1a1a27] border-white/10 h-9 text-white/70 text-sm focus-visible:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="marque" className="text-xs text-white/75">
                  Marque *
                </Label>
                <Input
                  id="marque"
                  name="marque"
                  placeholder="ex: Dell, Samsung"
                  required
                  className="bg-[#1a1a27] border-white/10 h-9 text-white/70 text-sm focus-visible:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modele" className="text-xs text-white/75">
                  {selectedType === "Téléphone"
                    ? "Nom du téléphone *"
                    : "Modèle *"}
                </Label>
                <Input
                  id="modele"
                  name="modele"
                  placeholder={
                    selectedType === "Téléphone"
                      ? "ex: Galaxy S21"
                      : "ex: Latitude 5520"
                  }
                  required
                  className="bg-[#1a1a27] border-white/10 h-9 text-white/70 text-sm focus-visible:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="numero_serie" className="text-xs text-white/75">
                  {selectedType === "Téléphone"
                    ? "IMEI / N° Série *"
                    : "N° Série *"}
                </Label>
                <Input
                  id="numero_serie"
                  name="numero_serie"
                  required
                  className="bg-[#1a1a27] border-white/10 h-9 text-white/70 text-sm focus-visible:ring-blue-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date_acquisition" className="text-xs text-white/75">
                  Date d&apos;acquisition
                </Label>
                <Input
                  type="date"
                  id="date_acquisition"
                  name="date_acquisition"
                  className="bg-[#1a1a27] border-white/10 h-9 text-white/70 text-sm focus-visible:ring-blue-500/50"
                />
              </div>
            </div>
          </div>

          {/* Section: Spécifications Techniques */}
          <div>
            <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-500" />
              Spécifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {selectedType !== "Téléphone" && (
                <div className="space-y-1.5">
                  <Label htmlFor="processeur" className="text-xs text-white/75">
                    Processeur
                  </Label>
                  <Input
                    id="processeur"
                    name="processeur"
                    placeholder="ex: i7-1185G7"
                    className="bg-[#1a1a27] border-white/10 h-9 text-white/70 text-sm focus-visible:ring-purple-500/50"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="ram" className="text-xs text-white/75">
                  RAM
                </Label>
                <Input
                  id="ram"
                  name="ram"
                  placeholder="ex: 16 Go"
                  className="bg-[#1a1a27] border-white/50 h-9 text-white/70 text-sm focus-visible:ring-purple-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="disque_dur" className="text-xs text-white/75">
                  {selectedType === "Téléphone" ? "Stockage" : "Disque Dur"}
                </Label>
                <Input
                  id="disque_dur"
                  name="disque_dur"
                  placeholder={
                    selectedType === "Téléphone"
                      ? "ex: 128 Go"
                      : "ex: 512 Go SSD"
                  }
                  className="bg-[#1a1a27] border-white/10 h-9 text-white/70 text-sm focus-visible:ring-purple-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="os" className="text-xs text-white/75">
                  Système (OS)
                </Label>
                <Input
                  id="os"
                  name="os"
                  placeholder={
                    selectedType === "Téléphone"
                      ? "ex: Android 13"
                      : "ex: Windows 11 Pro"
                  }
                  className="bg-[#1a1a27] border-white/10 h-9 text-white/70 text-sm focus-visible:ring-purple-500/50"
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
                <Label htmlFor="etat" className="text-xs text-white/75">
                  État *
                </Label>
                <Select name="etat" required defaultValue="Fonctionnel">
                  <SelectTrigger className="bg-[#1a1a27] text-white/80 border-white/10 h-9 text-sm">
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
                <Label htmlFor="image_url" className="text-xs text-white/75">
                  Image URL
                </Label>
                <Input
                  id="image_url"
                  name="image_url"
                  placeholder="https://..."
                  className="bg-[#1a1a27] border-white/10 h-9 text-white/70 text-sm focus-visible:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-white/75">
                  Mdp Admin / PIN
                </Label>
                <Input
                  id="password"
                  name="password"
                  className="bg-[#1a1a27] border-white/10 h-9 text-white/70 text-sm focus-visible:ring-blue-500/50"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="commentaire" className="text-xs text-white/75">
              Commentaire
            </Label>
            <Textarea
              id="commentaire"
              name="commentaire"
              className="bg-[#1a1a27] border-white/10 min-h-[80px] text-white/70 placeholder:text-white/50 text-sm focus-visible:ring-blue-500/50"
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
              {loading ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
