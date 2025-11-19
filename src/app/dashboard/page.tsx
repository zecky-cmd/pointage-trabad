import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import LogoutButton from "@/components/LogoutButton"
import Link from "next/link"
import { Clock, Users, FileText, Upload, Briefcase, Plus, ChevronRight } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  // Récupérer l'utilisateur connecté
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }
  // Récupérer le profil et les informations de l'employé
  const { data: profil } = await supabase
    .from("profil_utilisateur")
    .select(`
      *,
      employe:id_employe (
        prenom_employe,
        nom_employe,
        email_employe,
        post_employe,
        departement_employe
      )
    `)
    .eq("id_profil", user.id)
    .single()
  // Compter les justifications en attente (Admin/RH seulement)
  let nbJustifications = 0
  if (profil && ["admin", "rh"].includes(profil.role)) {
    const { count } = await supabase
      .from("pointage")
      .select("*", { count: "exact", head: true })
      .or("statut_justification_absence.eq.en_attente,statut_justification_retard.eq.en_attente")

    nbJustifications = count || 0
  }
  // Si pas d'employé lié, afficher un message
  if (!profil?.id_employe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-destructive mb-4">Profil incomplet</h2>
          <p className="text-foreground mb-4">Votre compte n&apos;est pas lié à un employé. Contactez l&apos;administrateur.</p>
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
    )
  }
  const isAdmin = ["admin", "rh"].includes(profil?.role || "")
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm">
                PT
              </div>
              <h1 className="text-lg font-bold text-foreground">Trabad Pointage</h1>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-foreground">
                  {profil?.employe?.prenom_employe } {profil?.employe?.nom_employe}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{profil?.role}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {profil?.employe?.prenom_employe?.charAt(0)}
                  {profil?.employe?.nom_employe?.charAt(0)}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Bienvenue, {profil?.employe?.prenom_employe || user.email} 
          </h2>
          <p className="text-muted-foreground">Gérez vos pointages et consultez vos informations professionnelles</p>
        </div>
        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Email Card */}
          <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Email</p>
            <p className="text-sm font-semibold text-foreground line-clamp-1">
              {profil?.employe?.email_employe || user.email}
            </p>
          </div>
          {/* Position Card */}
          <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Poste</p>
            <p className="text-sm font-semibold text-foreground">{profil?.employe?.post_employe || "Non défini"}</p>
          </div>
          {/* Department Card */}
          <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Département</p>
            <p className="text-sm font-semibold text-foreground">
              {profil?.employe?.departement_employe || "Non défini"}
            </p>
          </div>
          {/* Role Card */}
          <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Rôle</p>
            <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full capitalize">
              {profil?.role || "Non défini"}
            </div>
          </div>
        </div>
        {/* Quick Actions Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-foreground mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Main Action - Time Tracking */}
            <Link
              href="/pointage"
              className="group relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity"></div>
              <div className="relative">
                <Clock className="w-8 h-8 mb-3" />
                <h4 className="font-semibold text-lg mb-1">Gérer mes pointages</h4>
                <p className="text-sm opacity-90">Enregistrez vos heures</p>
              </div>
              <ChevronRight className="absolute bottom-3 right-3 w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </Link>
            {/* Admin Actions */}
            {isAdmin && (
              <>
                <Link
                  href="/pointage/justifications"
                  className="group relative bg-card border-2 border-orange-200 hover:border-orange-400 dark:border-orange-900 dark:hover:border-orange-700 rounded-xl p-6 hover:shadow-md transition-all duration-300"
                >
                  <div className="relative">
                    <FileText className="w-8 h-8 mb-3 text-orange-600 dark:text-orange-400" />
                    <h4 className="font-semibold text-foreground mb-1">Justifications</h4>
                    <p className="text-sm text-muted-foreground">Examinez les demandes</p>
                    {nbJustifications > 0 && (
                      <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                        {nbJustifications}
                      </div>
                    )}
                  </div>
                </Link>

                <Link
                  href="/pointage/admin"
                  className="group relative bg-card border-2 border-purple-200 hover:border-purple-400 dark:border-purple-900 dark:hover:border-purple-700 rounded-xl p-6 hover:shadow-md transition-all duration-300"
                >
                  <div className="relative">
                    <Clock className="w-8 h-8 mb-3 text-purple-600 dark:text-purple-400" />
                    <h4 className="font-semibold text-foreground mb-1">Rapports</h4>
                    <p className="text-sm text-muted-foreground">Consultez les analyses</p>
                  </div>
                </Link>
                <Link
                  href="/pointage/import"
                  className="group relative bg-card border-2 border-blue-200 hover:border-blue-400 dark:border-blue-900 dark:hover:border-blue-700 rounded-xl p-6 hover:shadow-md transition-all duration-300"
                >
                  <div className="relative">
                    <Upload className="w-8 h-8 mb-3 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-semibold text-foreground mb-1">Importer</h4>
                    <p className="text-sm text-muted-foreground">Historique pointages</p>
                  </div>
                </Link>
                <Link
                  href="/employes"
                  className="group relative bg-card border-2 border-green-200 hover:border-green-400 dark:border-green-900 dark:hover:border-green-700 rounded-xl p-6 hover:shadow-md transition-all duration-300"
                >
                  <div className="relative">
                    <Users className="w-8 h-8 mb-3 text-green-600 dark:text-green-400" />
                    <h4 className="font-semibold text-foreground mb-1">Employés</h4>
                    <p className="text-sm text-muted-foreground">Gérez vos équipes</p>
                  </div>
                </Link>
                <Link
                  href="/employes/nouveau"
                  className="group relative bg-card border-2 border-cyan-200 hover:border-cyan-400 dark:border-cyan-900 dark:hover:border-cyan-700 rounded-xl p-6 hover:shadow-md transition-all duration-300"
                >
                  <div className="relative">
                    <Plus className="w-8 h-8 mb-3 text-cyan-600 dark:text-cyan-400" />
                    <h4 className="font-semibold text-foreground mb-1">Créer</h4>
                    <p className="text-sm text-muted-foreground">Nouvel employé</p>
                  </div>
                </Link>
                <Link
                  href="/pointage/admin/jours-feries"
                  className="group relative bg-card border-2 border-red-200 hover:border-red-400 dark:border-red-900 dark:hover:border-red-700 rounded-xl p-6 hover:shadow-md transition-all duration-300"
                >
                  <div className="relative">
                    <Briefcase className="w-8 h-8 mb-3 text-red-600 dark:text-red-400" />
                    <h4 className="font-semibold text-foreground mb-1">Jours fériés</h4>
                    <p className="text-sm text-muted-foreground">Gérez les calendriers</p>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground py-6 border-t border-border">
          <p>© 2025 Trabad Pointage. Tous droits réservés.</p>
        </div>
      </main>
    </div>
  )
}
