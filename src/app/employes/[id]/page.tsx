
import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function EmployeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Vérifier que l'utilisateur est admin ou RH
  const { data: profil } = await supabase
    .from('profil_utilisateur')
    .select('role')
    .eq('id_profil', user.id)
    .single()

  if (!profil || !['admin', 'rh'].includes(profil.role)) {
    redirect('/dashboard')
  }

  // Récupérer l'employé
  const { data: employe } = await supabase
    .from('employe')
    .select(`
      *,
      profil_utilisateur (
        role,
        est_actif,
        derniere_connexion
      )
    `)
    .eq('id_employe', id)
    .single()

  if (!employe) {
    notFound()
  }

  const profilUser = employe.profil_utilisateur?.[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/employes" className="text-blue-600 hover:text-blue-800">
                ← Retour
              </Link>
              <h1 className="text-xl font-bold">Détails de l'employé</h1>
            </div>
            <Link
              href={`/employes/${id}/modifier`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Modifier
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* En-tête avec statut */}
          <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {employe.prenom_employe} {employe.nom_employe}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{employe.email_employe}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              employe.statut_employe === 'actif' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {employe.statut_employe}
            </span>
          </div>

          {/* Informations personnelles */}
          <div className="px-6 py-6">
            <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Prénom</dt>
                <dd className="mt-1 text-sm text-gray-900">{employe.prenom_employe}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Nom</dt>
                <dd className="mt-1 text-sm text-gray-900">{employe.nom_employe}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{employe.email_employe}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                <dd className="mt-1 text-sm text-gray-900">{employe.tel_employe || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Poste</dt>
                <dd className="mt-1 text-sm text-gray-900">{employe.post_employe || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Département</dt>
                <dd className="mt-1 text-sm text-gray-900">{employe.departement_employe || '-'}</dd>
              </div>
            </dl>
          </div>

          {/* Informations de compte */}
          {profilUser && (
            <div className="px-6 py-6 bg-gray-50 border-t">
              <h3 className="text-lg font-semibold mb-4">Compte utilisateur</h3>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Rôle</dt>
                  <dd className="mt-1">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                      {profilUser.role}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Statut du compte</dt>
                  <dd className="mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      profilUser.est_actif 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {profilUser.est_actif ? 'Actif' : 'Inactif'}
                    </span>
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Dernière connexion</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profilUser.derniere_connexion 
                      ? new Date(profilUser.derniere_connexion).toLocaleString('fr-FR')
                      : 'Jamais connecté'}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Métadonnées */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <dl className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <dt className="font-medium">Créé le</dt>
                <dd className="mt-1">{new Date(employe.created_at).toLocaleString('fr-FR')}</dd>
              </div>
              <div>
                <dt className="font-medium">Modifié le</dt>
                <dd className="mt-1">{new Date(employe.updated_at).toLocaleString('fr-FR')}</dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  )
}