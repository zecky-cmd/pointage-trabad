'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
// import Link from 'next/link'
import PointageRowEdit from '@/components/PointageRowEdit'
import Navigation from '@/components/navigation/Nav'
// import { exportRapportPDF, exportEmployeExcel } from '@/utils/exports'

export default function DetailEmployePage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [employe, setEmploye]: any = useState(null)
  const [moisSelectionne, setMoisSelectionne] = useState('')
  const [pointages, setPointages] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const moisUrl = searchParams.get('mois')
    if (moisUrl) {
      setMoisSelectionne(moisUrl)
    } else {
      const now = new Date()
      setMoisSelectionne(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    }
    loadData()
  }, [searchParams])

  useEffect(() => {
    if (moisSelectionne && employe) {
      loadPointagesMois()
    }
  }, [moisSelectionne, employe])

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

      const { data: emp } = await supabase
        .from('employe')
        .select('*')
        .eq('id_employe', params.id)
        .single()

      setEmploye(emp)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPointagesMois = async () => {
    const [annee, mois] = moisSelectionne.split('-')
    const premierJour = `${annee}-${mois}-01`
    const dernierJour = new Date(parseInt(annee), parseInt(mois), 0).getDate()
    const dernierJourDate = `${annee}-${mois}-${dernierJour}`

    const { data } = await supabase
      .from('pointage')
      .select('*')
      .eq('id_employe', params.id)
      .gte('date_pointage', premierJour)
      .lte('date_pointage', dernierJourDate)
      .order('date_pointage', { ascending: false })

    setPointages(data || [])
    calculerStats(data || [])
  }

  const calculerStats = (pointagesData: any[]) => {
    let totalHeures = 0
    let totalRetard = 0
    let joursPresent = 0
    let joursAbsent = 0
    let absencesJustifiees = 0
    let retardsSignificatifs = 0
    let retardsJustifies = 0

    pointagesData.forEach(p => {
      if (p.statut === 'present') {
        joursPresent++
        totalHeures += calculerHeuresTravaillees(p)
      }
      if (p.statut === 'absent') {
        joursAbsent++
        if (p.statut_justification_absence === 'justifiee') absencesJustifiees++
      }
      if (p.retard_minutes > 0) {
        totalRetard += p.retard_minutes
        if (p.retard_minutes > 15) {
          retardsSignificatifs++
          if (p.statut_justification_retard === 'justifiee') retardsJustifies++
        }
      }
    })

    const heuresTheoriques = (joursPresent + absencesJustifiees) * 8
    const heuresAbsencesNonJustifiees = (joursAbsent - absencesJustifiees) * 8

    setStats({
      totalHeures: formatDuree(totalHeures),
      joursPresent,
      joursAbsent,
      absencesJustifiees,
      totalRetard: formatDuree(totalRetard / 60),
      retardsSignificatifs,
      retardsJustifies,
      heuresPayables: formatDuree(heuresTheoriques),
      heuresAbsencesNonJustifiees: formatDuree(heuresAbsencesNonJustifiees),
      retardsJustifiesHeures: formatDuree((retardsJustifies * 15) / 60),
      retardsNonJustifiesHeures: formatDuree(((retardsSignificatifs - retardsJustifies) * 15) / 60),
    })
  }

  const calculerHeuresTravaillees = (pointage: any) => {
    if (!pointage.pointage_arrive || !pointage.pointage_depart) return 0
    const arrive = new Date(`2000-01-01T${pointage.pointage_arrive}`)
    const depart = new Date(`2000-01-01T${pointage.pointage_depart}`)
    let heures = (depart.getTime() - arrive.getTime()) / (1000 * 60 * 60)

    if (pointage.pointage_pause && pointage.pointage_reprise) {
      const pause = new Date(`2000-01-01T${pointage.pointage_pause}`)
      const reprise = new Date(`2000-01-01T${pointage.pointage_reprise}`)
      heures -= (reprise.getTime() - pause.getTime()) / (1000 * 60 * 60)
    } else {
      heures -= 1
    }
    return Math.max(0, heures)
  }

  const formatDuree = (heures: number) => {
    const h = Math.floor(heures)
    const m = Math.round((heures - h) * 60)
    return `${h}h${String(m).padStart(2, '0')}`
  }

  const handleSavePointage = async () => {
    await loadPointagesMois()
    setEditingId(null)
  }

  const exportPDF = async () => {
    const { exportRapportPDF } = await import('@/utils/exports')
    exportRapportPDF(employe, moisSelectionne, pointages, stats)
  }

  const exportExcel = async () => {
    const { exportEmployeExcel } = await import('@/utils/exports')
    exportEmployeExcel(employe, pointages, moisSelectionne, stats)
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation href="/pointage/admin" />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                {employe?.prenom_employe?.[0]}{employe?.nom_employe?.[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Détail du mois pour {employe?.prenom_employe} {employe?.nom_employe}</h1>
                <p className="text-gray-600">{employe?.post_employe}</p>
                <p className="text-sm text-gray-500 mt-1">Horaires de travail : 8h30 - 17h30 (8h de travail effectif)</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <input
                type="month"
                value={moisSelectionne}
                onChange={(e) => setMoisSelectionne(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              />
              <button onClick={exportPDF} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                📄 Exporter PDF
              </button>
              <button onClick={exportExcel} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                📊 Exporter Excel
              </button>
            </div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Heures Travaillées</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalHeures}</p>
              <p className="text-xs text-gray-500">Heures effectives</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Absences Justifiées</p>
              <p className="text-2xl font-bold text-green-600">{stats.absencesJustifiees * 8}h00</p>
              <p className="text-xs text-gray-500">Heures payées</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Absences Non Justifiées</p>
              <p className="text-2xl font-bold text-red-600">{stats.heuresAbsencesNonJustifiees}</p>
              <p className="text-xs text-gray-500">Heures non payées</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Payable</p>
              <p className="text-2xl font-bold text-green-600">{stats.heuresPayables}</p>
              <p className="text-xs text-gray-500">Pour rémunération</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Retards Justifiés</p>
              <p className="text-2xl font-bold text-green-600">{stats.retardsJustifiesHeures}</p>
              <p className="text-xs text-gray-500">Heures récupérées</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Retards Non Justifiés</p>
              <p className="text-2xl font-bold text-red-600">{stats.retardsNonJustifiesHeures}</p>
              <p className="text-xs text-gray-500">Heures déduites</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Retards</p>
              <p className="text-2xl font-bold text-orange-600">{stats.totalRetard}</p>
              <p className="text-xs text-gray-500">{stats.retardsSignificatifs} jours de retard</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrivée</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pause</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reprise</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Départ</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heures</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retard</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Justification</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pointages.map((p) => (
                <PointageRowEdit
                  key={p.id_pointage}
                  pointage={p}
                  isEditing={editingId === p.id_pointage}
                  onEdit={() => setEditingId(p.id_pointage)}
                  onSave={handleSavePointage}
                  onCancel={() => setEditingId(null)}
                  calculerHeures={calculerHeuresTravaillees}
                  formatDuree={formatDuree}
                />
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}