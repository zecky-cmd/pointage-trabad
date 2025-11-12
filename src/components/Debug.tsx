
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Récupérer l'utilisateur connecté
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('User:', user?.id, user?.email)

  if (!user) {
    redirect('/login')
  }

  // Récupérer le profil et les informations de l'employé
  const { data: profil, error: profilError } = await supabase
    .from('profil_utilisateur')
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
    .eq('id_profil', user.id)
    .single()

  console.log('Profil:', profil)
  console.log('Erreur:', profilError)
  console.log('Employé:', profil?.employe)

  // Si pas d'employé lié, afficher un message
  if (!profil?.id_employe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Profil incomplet</h2>
          <p className="text-gray-700 mb-4">
            Votre compte n'est pas lié à un employé. Contactez l'administrateur.
          </p>
          <p className="text-sm text-gray-500">
            Email: {user.email}<br/>
            User ID: {user.id}<br/>
            Profil ID: {profil?.id_profil || 'Non trouvé'}<br/>
            ID Employé: {profil?.id_employe || 'NULL'}
          </p>
          <LogoutButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {profil?.employe?.prenom_employe || 'Prénom'} {profil?.employe?.nom_employe || 'Nom'}
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {profil?.role || 'N/A'}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">
              Bienvenue, {profil?.employe?.prenom_employe || user.email} !
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">Informations personnelles</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-600">Email</dt>
                    <dd className="text-sm font-medium">{profil?.employe?.email_employe || user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Poste</dt>
                    <dd className="text-sm font-medium">{profil?.employe?.post_employe || 'Non défini'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Département</dt>
                    <dd className="text-sm font-medium">{profil?.employe?.departement_employe || 'Non défini'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Rôle</dt>
                    <dd className="text-sm font-medium capitalize">{profil?.role || 'Non défini'}</dd>
                  </div>
                </dl>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">Actions rapides</h3>
                <div className="space-y-2">
                  <a
                    href="/pointage"
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Gérer mes pointages
                  </a>
                  {['admin', 'rh'].includes(profil?.role || '') && (
                    <a
                      href="/employes"
                      className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Gérer les employés
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}