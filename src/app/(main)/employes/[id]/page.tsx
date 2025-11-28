import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Calendar,
  Shield,
  Activity,
  ArrowLeft,
  Pencil,
} from "lucide-react";

// Types pour les données
interface ProfilUtilisateur {
  role: string;
  est_actif: boolean;
  derniere_connexion: string | null;
}

interface Employe {
  id_employe: string;
  prenom_employe: string;
  nom_employe: string;
  email_employe: string;
  tel_employe: string | null;
  post_employe: string | null;
  departement_employe: string | null;
  statut_employe: "actif" | "inactif";
  created_at: string;
  updated_at: string;
  profil_utilisateur?: ProfilUtilisateur[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vérifier que l'utilisateur est admin ou RH
  const { data: profil } = await supabase
    .from("profil_utilisateur")
    .select("role")
    .eq("id_profil", user.id)
    .single();

  if (!profil || !["admin", "rh"].includes(profil.role)) {
    redirect("/dashboard");
  }

  // Récupérer l'employé
  const { data: employe } = await supabase
    .from("employe")
    .select(
      `
      *,
      profil_utilisateur (
        role,
        est_actif,
        derniere_connexion
      )
    `
    )
    .eq("id_employe", id)
    .single();

  if (!employe) {
    notFound();
  }

  // Cast avec le type approprié
  const employeData = employe as unknown as Employe;
  const profilUser = employeData.profil_utilisateur?.[0];

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/employes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Détails de l&apos;employé
          </h1>
        </div>
        <Button asChild>
          <Link href={`/employes/${id}/modifier`}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Carte Principale */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-2xl">
                {employeData.prenom_employe} {employeData.nom_employe}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                {employeData.email_employe}
              </CardDescription>
            </div>
            <Badge
              variant={
                employeData.statut_employe === "actif" ? "success" : "danger"
              }
              className="capitalize"
            >
              {employeData.statut_employe}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {employeData.tel_employe || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {employeData.post_employe || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {employeData.departement_employe || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Créé le{" "}
                  {new Date(employeData.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations Compte */}
        {profilUser ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Compte Utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rôle</span>
                <Badge variant="info" className="capitalize">
                  {profilUser.role}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Statut du compte
                </span>
                <Badge variant={profilUser.est_actif ? "success" : "danger"}>
                  {profilUser.est_actif ? "Actif" : "Inactif"}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" />
                  Dernière connexion
                </span>
                <p className="text-sm font-medium">
                  {profilUser.derniere_connexion
                    ? new Date(profilUser.derniere_connexion).toLocaleString(
                        "fr-FR"
                      )
                    : "Jamais connecté"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg text-muted-foreground">
                Aucun compte utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cet employé n&apos;a pas de compte utilisateur associé pour
                accéder à l&apos;application.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Métadonnées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Métadonnées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Création
                </span>
                <p className="text-sm font-medium">
                  {new Date(employeData.created_at).toLocaleString("fr-FR")}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Dernière modification
                </span>
                <p className="text-sm font-medium">
                  {new Date(employeData.updated_at).toLocaleString("fr-FR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
