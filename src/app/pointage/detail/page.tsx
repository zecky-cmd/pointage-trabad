
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/navigation/Nav'

export default function RapportAdminPage() {
  const [loading, setLoading] = useState(true)
  const [moisSelectionne, setMoisSelectionne] = useState('')
  const [employeStats, setEmployeStats] = useState<any[]>([])

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const now = new Date()
    const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setMoisSelectionne(moisActuel)
    loadData()
  }, [])

  useEffect(() => {
    if (moisSelectionne) {
      loadStats()
    }
  }, [moisSelectionne])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profil } = await supabase
        .from('profil_utilisateur')
        .select('role')
        .eq('id_profil', user.id)
        .single()

      if (!profil || !['admin', 'rh'].includes(profil.role)) {
        router.push('/dashboard')
        return
      }

      setLoading(false)
    } catch (error) {
      console.error('Erreur:', error)
      router.push('/dashboard')
    }
  }

  const loadStats = async () => {
    const [annee, mois] = moisSelectionne.split('-')

    const { data: stats } = await supabase
      .from('v_statistiques_pointage')
      .select('*')
      .eq('annee', parseInt(annee))
      .eq('mois', parseInt(mois))
      .order('nom_employe')

    setEmployeStats(stats || [])
  }

  const formatDuree = (heures: number) => {
    const h = Math.floor(heures)
    const m = Math.round((heures - h) * 60)
    return `${h}h${String(m).padStart(2, '0')}`
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation href='/dashboard' />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Rapport Mensuel de Pointage</h1>
              <p className="text-gray-600 mt-1">
                Horaires de travail : 8h30 - 17h30 (8h de travail effectif)
              </p>
            </div>
            <div className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mois</label>
                <input
                  type="month"
                  value={moisSelectionne}
                  onChange={(e) => setMoisSelectionne(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Heures Travaillées
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Retards
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre d'Absences
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employeStats.map((stat) => (
                <tr key={stat.id_employe}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                          {stat.prenom_employe[0]}{stat.nom_employe[0]}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {stat.prenom_employe} {stat.nom_employe}
                        </div>
                        <div className="text-sm text-gray-500">{stat.post_employe}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatDuree(stat.heures_travaillees)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {stat.jours_travailles} jours travaillés
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold ${
                      stat.total_retard_minutes > 0 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {formatDuree(stat.total_retard_minutes / 60)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {stat.nombre_retards} jours de retard
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {stat.nombre_absences}
                    </div>
                    <div className="text-sm text-gray-500">
                      {stat.absences_justifiees} justifiées
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/pointage/admin/${stat.id_employe}?mois=${moisSelectionne}`}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Détails
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {employeStats.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucune donnée pour ce mois
            </div>
          )}
        </div>
      </main>
    </div>
  )
}