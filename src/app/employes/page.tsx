import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EmployeeActions from '@/components/EmployeeActions'

export default async function EmployesPage() {
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

  // Récupérer tous les employés
  const { data: employes, error: employesError } = await supabase
    .from('employe')
    .select('*')
    .order('created_at', { ascending: false })

  // Récupérer tous les profils
  const { data: profils, error: profilsError } = await supabase
    .from('profil_utilisateur')
    .select('id_employe, role, est_actif, derniere_connexion')

  // Fusionner les données
  const employesAvecProfils = employes?.map(emp => ({
    ...emp,
    profil: profils?.find(p => p.id_employe === emp.id_employe) || null
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Retour
              </Link>
              <h1 className="text-xl font-bold">Gestion des Employés</h1>
            </div>
            <div className="flex items-center">
              <Link
                href="/employes/nouveau"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Nouvel Employé
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom Complet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Poste
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Département
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employesAvecProfils?.map((employe) => (
                <tr key={employe.id_employe}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {employe.prenom_employe} {employe.nom_employe}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{employe.email_employe}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{employe.post_employe || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{employe.departement_employe || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employe.profil ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {employe.profil.role}
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600">
                        Aucun compte
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employe.statut_employe === 'actif' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employe.statut_employe}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <EmployeeActions 
                      employeeId={employe.id_employe}
                      statut={employe.statut_employe}
                      isAdmin={profil?.role === 'admin'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!employesAvecProfils || employesAvecProfils.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun employé trouvé</p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}