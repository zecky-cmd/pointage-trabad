import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import {
  Clock,
  Users,
  FileText,
  Upload,
  Briefcase,
  Plus,
  ChevronRight,
  LayoutDashboard,
  Mail,
  Building,
  UserCircle,
} from "lucide-react";
import LiveEmployeeStatus from "@/components/LiveEmployeeStatus";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Récupérer l'utilisateur connecté
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Récupérer le profil et les informations de l'employé
  const { data: profil } = await supabase
    .from("profil_utilisateur")
    .select(
      `
      *,
      employe:id_employe (
        prenom_employe,
        nom_employe,
        email_employe,
        post_employe,
        departement_employe
      )
    `
    )
    .eq("id_profil", user.id)
    .single();

  // Compter les justifications en attente (Admin/RH seulement)
  let nbJustifications = 0;
  if (profil && ["admin", "rh"].includes(profil.role)) {
    const { count } = await supabase
      .from("pointage")
      .select("*", { count: "exact", head: true })
      .or(
        "statut_justification_absence.eq.en_attente,statut_justification_retard.eq.en_attente"
      );

    nbJustifications = count || 0;
  }

  // Si pas d'employé lié, afficher un message
  if (!profil?.id_employe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-destructive mb-4">
            Profil incomplet
          </h2>
          <p className="text-foreground mb-4">
            Votre compte n&apos;est pas lié à un employé. Contactez
            l&apos;administrateur.
          </p>
          <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg mb-6">
            Email: {user.email}
            <br />
            User ID: {user.id}
            <br />
            Profil ID: {profil?.id_profil || "Non trouvé"}
            <br />
            ID Employé: {profil?.id_employe || "NULL"}
          </p>
          <LogoutButton />
        </div>
      </div>
    );
  }

  const isAdmin = ["admin", "rh"].includes(profil?.role || "");

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Glassmorphism Header */}
      <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Trabad Pointage
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-sm font-semibold text-foreground">
                  {profil?.employe?.prenom_employe}{" "}
                  {profil?.employe?.nom_employe}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
                  {profil?.role}
                </span>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary/20 to-secondary flex items-center justify-center border border-border/50 shadow-sm">
                <span className="text-sm font-bold text-primary">
                  {profil?.employe?.prenom_employe?.charAt(0)}
                  {profil?.employe?.nom_employe?.charAt(0)}
                </span>
              </div>
              <div className="pl-2 border-l border-border">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero / Welcome Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-background to-secondary/20 border border-border/50 p-8 sm:p-10 shadow-sm">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
              Bonjour,{" "}
              <span className="text-primary">
                {profil?.employe?.prenom_employe}
              </span>{" "}
              👋
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Bienvenue sur votre espace personnel. Gérez vos pointages,
              consultez vos rapports et accédez à vos informations en un clic.
            </p>
          </div>
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-secondary/20 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
        </div>

        {/* Live Status Board (Admin/RH Only) */}
        {isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 bg-primary rounded-full"></div>
              <h3 className="text-xl font-bold text-foreground">
                Suivi en temps réel
              </h3>
            </div>
            <div className="bg-card/50 border border-border/50 rounded-2xl p-6 backdrop-blur-sm">
              <LiveEmployeeStatus />
            </div>
          </div>
        )}

        {/* Info Cards Grid (Bento Box Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Email Card */}
          <div className="group bg-card hover:bg-accent/5 border border-border rounded-2xl p-5 transition-all duration-300 hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Email Professionnel
              </p>
              <p
                className="text-sm font-semibold text-foreground truncate"
                title={profil?.employe?.email_employe || user.email}
              >
                {profil?.employe?.email_employe || user.email}
              </p>
            </div>
          </div>

          {/* Position Card */}
          <div className="group bg-card hover:bg-accent/5 border border-border rounded-2xl p-5 transition-all duration-300 hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Poste Actuel
              </p>
              <p className="text-sm font-semibold text-foreground truncate">
                {profil?.employe?.post_employe || "Non défini"}
              </p>
            </div>
          </div>

          {/* Department Card */}
          <div className="group bg-card hover:bg-accent/5 border border-border rounded-2xl p-5 transition-all duration-300 hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Building className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Département
              </p>
              <p className="text-sm font-semibold text-foreground truncate">
                {profil?.employe?.departement_employe || "Non défini"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="h-6 w-1 bg-primary rounded-full"></div>
            <h3 className="text-xl font-bold text-foreground">
              Actions Rapides
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Main Action - Time Tracking */}
            <Link
              href="/pointage"
              className="col-span-1 sm:col-span-2 group relative overflow-hidden bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl p-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <Clock className="w-24 h-24" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="p-3 bg-white/10 w-fit rounded-xl backdrop-blur-sm mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-1">
                    Gérer mes pointages
                  </h4>
                  <p className="text-primary-foreground/80 text-sm">
                    Enregistrez vos entrées et sorties
                  </p>
                </div>
                <div className="mt-4 flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  Accéder <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>

            <Link
              href="/pointage/rapport"
              className="group relative bg-card hover:bg-accent/5 border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:-translate-y-1"
            >
              <div className="p-3 bg-red-500/10 text-red-600 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-foreground text-lg mb-1">
                Mes Rapports
              </h4>
              <p className="text-sm text-muted-foreground">
                Consultez votre historique
              </p>
            </Link>

            {/* Admin Actions */}
            {isAdmin && (
              <>
                <Link
                  href="/pointage/justifications"
                  className="group relative bg-card hover:bg-accent/5 border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:border-orange-500/30 hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-orange-500/10 text-orange-600 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      <FileText className="w-6 h-6" />
                    </div>
                    {nbJustifications > 0 && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground animate-pulse">
                        {nbJustifications}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground text-lg mb-1">
                    Justifications
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Demandes en attente
                  </p>
                </Link>

                <Link
                  href="/pointage/admin"
                  className="group relative bg-card hover:bg-accent/5 border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:border-purple-500/30 hover:-translate-y-1"
                >
                  <div className="p-3 bg-purple-500/10 text-purple-600 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-foreground text-lg mb-1">
                    Vue Admin
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Supervision globale
                  </p>
                </Link>

                <Link
                  href="/pointage/import"
                  className="group relative bg-card hover:bg-accent/5 border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:border-blue-500/30 hover:-translate-y-1"
                >
                  <div className="p-3 bg-blue-500/10 text-blue-600 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-foreground text-lg mb-1">
                    Import
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Données externes
                  </p>
                </Link>

                <Link
                  href="/employes"
                  className="group relative bg-card hover:bg-accent/5 border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:border-green-500/30 hover:-translate-y-1"
                >
                  <div className="p-3 bg-green-500/10 text-green-600 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-foreground text-lg mb-1">
                    Employés
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Gestion d&apos;équipe
                  </p>
                </Link>

                <Link
                  href="/employes/nouveau"
                  className="group relative bg-card hover:bg-accent/5 border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:border-cyan-500/30 hover:-translate-y-1"
                >
                  <div className="p-3 bg-cyan-500/10 text-cyan-600 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-foreground text-lg mb-1">
                    Nouveau
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Créer un profil
                  </p>
                </Link>
                <Link
                  href="/pointage/admin/jours-feries"
                  className="group relative bg-card hover:bg-accent/5 border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:border-red-500/30 hover:-translate-y-1"
                >
                  <div className="p-3 bg-red-500/10 text-red-600 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-foreground text-lg mb-1">
                    Jours fériés
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Gérez les calendriers
                  </p>
                </Link>

                <Link
                  href="pointage/detail"
                  className="group relative bg-card hover:bg-accent/5 border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:border-red-500/30 hover:-translate-y-1"
                >
                  <div className="p-3 bg-red-500/10 text-red-600 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-foreground text-lg mb-1">
                    Détails
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Gérez les rapports
                  </p>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Trabad Pointage. Tous droits réservés.
          </p>
        </div>
      </main>
    </div>
  );
}
