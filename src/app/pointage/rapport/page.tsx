"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import JustificationModal from "@/components/JustificationModal"
import Navigation from "@/components/navigation/Nav"

export default function RapportMensuelPage() {
  // ------- start  --------------
  const [loading, setLoading] = useState(true)
  const [employe, setEmploye] = useState<any>(null)
  const [moisSelectionne, setMoisSelectionne] = useState("")
  const [pointages, setPointages] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  // ---------- end -------------------------------------------------------
  const [showJustificationModal, setShowJustificationModal] = useState(false)
  const [selectedPointage, setSelectedPointage] = useState<any>(null)
  const [justificationType, setJustificationType] = useState<"retard" | "absence">("retard")

  // ------------ start-------------------------------------------
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const now = new Date()
    const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    setMoisSelectionne(moisActuel)
    loadData()
  }, [])

  useEffect(() => {
    if (moisSelectionne && employe) {
      loadPointagesMois()
    }
  }, [moisSelectionne, employe])
// --------------- end ---------------------------
  const loadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: profil } = await supabase
        .from("profil_utilisateur")
        .select(`
          id_employe,
          employe:id_employe (
            id_employe,
            prenom_employe,
            nom_employe,
            post_employe
          )
        `)
        .eq("id_profil", user.id)
        .single()

      setEmploye(profil?.employe)
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadPointagesMois = async () => {
    if (!employe) return

    const [annee, mois] = moisSelectionne.split("-")
    const premierJour = `${annee}-${mois}-01`
    const dernierJour = new Date(Number.parseInt(annee), Number.parseInt(mois), 0).getDate()
    const dernierJourDate = `${annee}-${mois}-${dernierJour}`

    const { data } = await supabase
      .from("pointage")
      .select("*")
      .eq("id_employe", employe.id_employe)
      .gte("date_pointage", premierJour)
      .lte("date_pointage", dernierJourDate)
      .order("date_pointage", { ascending: false })

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

    pointagesData.forEach((p) => {
      if (p.statut === "present") {
        joursPresent++
        const heures = calculerHeuresTravaillees(p)
        totalHeures += heures
      }
      if (p.statut === "absent") {
        joursAbsent++
        if (p.statut_justification_absence === "justifiee") {
          absencesJustifiees++
        }
      }
      if (p.retard_minutes > 0) {
        totalRetard += p.retard_minutes
        if (p.retard_minutes > 15) {
          retardsSignificatifs++
        }
      }
    })

    const heuresTheoriques = (joursPresent + absencesJustifiees) * 8
    const heuresAbsencesNonJustifiees = (joursAbsent - absencesJustifiees) * 8
    const heuresPayables = heuresTheoriques;

    setStats({
      totalHeures: formatDuree(totalHeures),
      joursPresent,
      joursAbsent,
      absencesJustifiees,
      totalRetard: formatDuree(totalRetard / 60),
      retardsSignificatifs,
      heuresPayables: formatDuree(heuresPayables),
      heuresAbsencesNonJustifiees: formatDuree(heuresAbsencesNonJustifiees),
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
      const dureePause = (reprise.getTime() - pause.getTime()) / (1000 * 60 * 60)
      heures -= dureePause
    } else {
      heures -= 1
    }

    return Math.max(0, heures)
  }

  const formatDuree = (heures: number) => {
    const h = Math.floor(heures)
    const m = Math.round((heures - h) * 60)
    return `${h}h${String(m).padStart(2, "0")}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
  }

  const openJustificationModal = (pointage: any, type: "retard" | "absence") => {
    setSelectedPointage(pointage)
    setJustificationType(type)
    setShowJustificationModal(true)
  }

  const handleSubmitJustification = async (type: "retard" | "absence", justification: string) => {
    try {
      const response = await fetch("/api/pointage/justification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_pointage: selectedPointage.id_pointage,
          type,
          justification,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur")
      }

      alert("✅ Justification envoyée avec succès. Elle sera examinée par un administrateur.")
      await loadPointagesMois()
    } catch (error: any) {
      alert(`Erreur: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navigation href="/pointage" />
      <main className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Rapport Mensuel de Pointage</h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                {employe?.prenom_employe} {employe?.nom_employe} • {employe?.post_employe}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">Horaires : 8h30 - 17h30 (8h effectif)</p>
            </div>
            <div className="flex flex-col gap-2 min-w-fit">
              <label className="text-sm font-medium text-gray-700">Sélectionner un mois</label>
              <input
                type="month"
                value={moisSelectionne}
                onChange={(e) => setMoisSelectionne(e.target.value)}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              label="Heures Travaillées"
              value={stats.totalHeures}
              subtext={`${stats.joursPresent} jours travaillés`}
              colorClass="bg-blue-50 border-l-4 border-blue-500"
              valueClass="text-blue-600"
            />
            <StatCard
              label="Total Retards"
              value={stats.totalRetard}
              subtext={`${stats.retardsSignificatifs} jours de retard`}
              colorClass="bg-orange-50 border-l-4 border-orange-500"
              valueClass="text-orange-600"
            />
            <StatCard
              label="Absences"
              value={stats.joursAbsent}
              subtext={`${stats.absencesJustifiees} justifiées`}
              colorClass="bg-red-50 border-l-4 border-red-500"
              valueClass="text-red-600"
            />
            <StatCard
              label="Total Payable"
              value={stats.heuresPayables}
              subtext="Rémunération"
              colorClass="bg-green-50 border-l-4 border-green-500"
              valueClass="text-green-600"
            />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Arrivée</th>
                  <th className="hidden sm:table-cell px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Pause
                  </th>
                  <th className="hidden sm:table-cell px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Reprise
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Départ</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Heures</th>
                  <th className="hidden md:table-cell px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Retard
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Statut</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Justif.</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {pointages.map((p) => (
                  <tr
                    key={p.id_pointage}
                    className={p.statut === "weekend" ? "bg-gray-50" : "hover:bg-blue-50 transition-colors"}
                  >
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {formatDate(p.date_pointage)}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-600">
                      {p.pointage_arrive || "—"}
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-600">
                      {p.pointage_pause || "—"}
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-600">
                      {p.pointage_reprise || "—"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-600">
                      {p.pointage_depart || "—"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm font-bold text-blue-600">
                      {formatDuree(calculerHeuresTravaillees(p))}
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm">
                      {p.retard_minutes > 0 ? (
                        <span
                          className={
                            p.retard_minutes > 15 ? "text-red-600 font-semibold" : "text-orange-600 font-medium"
                          }
                        >
                          {p.retard_minutes}m
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">À l'heure</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          p.statut === "present"
                            ? "bg-green-100 text-green-700"
                            : p.statut === "absent"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {p.statut === "present" ? "Présent" : p.statut === "absent" ? "Absent" : "W.E"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs space-y-1">
                      {p.statut === "absent" && (
                        <div>
                          {p.justification_absence ? (
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                p.statut_justification_absence === "justifiee"
                                  ? "bg-green-100 text-green-700"
                                  : p.statut_justification_absence === "rejetee"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {p.statut_justification_absence === "justifiee"
                                ? "✓"
                                : p.statut_justification_absence === "rejetee"
                                  ? "✗"
                                  : "⏳"}
                            </span>
                          ) : (
                            <button
                              onClick={() => openJustificationModal(p, "absence")}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                            >
                              Just.
                            </button>
                          )}
                        </div>
                      )}

                      {p.retard_minutes > 15 && (
                        <div>
                          {p.justification_retard ? (
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                p.statut_justification_retard === "justifiee"
                                  ? "bg-green-100 text-green-700"
                                  : p.statut_justification_retard === "rejetee"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {p.statut_justification_retard === "justifiee"
                                ? "✓"
                                : p.statut_justification_retard === "rejetee"
                                  ? "✗"
                                  : "⏳"}
                            </span>
                          ) : (
                            <button
                              onClick={() => openJustificationModal(p, "retard")}
                              className="text-orange-600 hover:text-orange-800 hover:underline font-medium transition-colors"
                            >
                              Ret.
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pointages.length === 0 && <div className="text-center py-12 text-gray-500">Aucun pointage pour ce mois</div>}
        </div>

        <JustificationModal
          isOpen={showJustificationModal}
          onClose={() => setShowJustificationModal(false)}
          onSubmit={handleSubmitJustification}
          type={justificationType}
          date={selectedPointage?.date_pointage || ""}
        />
      </main>
    </div>
  )
}

function StatCard({ label, value, subtext, colorClass, valueClass }: any) {
  return (
    <div className={`${colorClass} rounded-lg p-4 sm:p-5 transition-transform hover:scale-105`}>
      <p className="text-xs sm:text-sm font-medium text-gray-700">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold ${valueClass} mt-2`}>{value}</p>
      <p className="text-xs text-gray-600 mt-2">{subtext}</p>
    </div>
  )
}
