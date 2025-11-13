"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation/Nav"
import type { PointageWithEmployee, JustificationType, JustificationStatus } from "@/types/pointage"

export default function JustificationsPage() {
  const [loading, setLoading] = useState(true)
  const [justifications, setJustifications] = useState<PointageWithEmployee[]>([])
  const [filter, setFilter] = useState<"all" | "en_attente" | "traitees">("en_attente")
  const [typeFilter, setTypeFilter] = useState<"all" | "retard" | "absence">("all")

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadJustifications()
  }, [filter, typeFilter])

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
        .select("role")
        .eq("id_profil", user.id)
        .single()

      if (!profil || !["admin", "rh"].includes(profil.role)) {
        router.push("/dashboard")
        return
      }

      await loadJustifications()
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadJustifications = async () => {
    let query = supabase
      .from("pointage")
      .select(`
        *,
        employe:id_employe (
          id_employe,
          prenom_employe,
          nom_employe,
          post_employe
        )
      `)
      .order("date_pointage", { ascending: false })

    if (filter === "en_attente") {
      query = query.or("statut_justification_absence.eq.en_attente,statut_justification_retard.eq.en_attente")
    } else if (filter === "traitees") {
      query = query.or(
        "statut_justification_absence.in.(justifiee,rejetee),statut_justification_retard.in.(justifiee,rejetee)",
      )
    }

    const { data } = await query

    let filtered: PointageWithEmployee[] = ((data as PointageWithEmployee[]) || []).filter(
      (p) => p.justification_absence || p.justification_retard,
    )

    if (typeFilter === "retard") {
      filtered = filtered.filter((p) => p.justification_retard)
    } else if (typeFilter === "absence") {
      filtered = filtered.filter((p) => p.justification_absence)
    }

    setJustifications(filtered)
  }

  const handleTraiter = async (id_pointage: number, type: JustificationType, decision: JustificationStatus) => {
    try {
      const updateData: Record<string, JustificationStatus> = {}
      if (type === "retard") {
        updateData.statut_justification_retard = decision
      } else {
        updateData.statut_justification_absence = decision
      }

      const response = await fetch("/api/pointage/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_pointage,
          ...updateData,
        }),
      })

      if (!response.ok) throw new Error("Erreur")

      alert(`✅ Justification ${decision === "justifiee" ? "approuvée" : "rejetée"}`)
      await loadJustifications()
    } catch (error) {
      alert("Erreur lors du traitement")
    }
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const getTempsEcoule = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `Il y a ${days} jour${days > 1 ? "s" : ""}`
    if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`
    return "Il y a moins d'une heure"
  }

  const nbEnAttente = justifications.filter(
    (j) => j.statut_justification_absence === "en_attente" || j.statut_justification_retard === "en_attente",
  ).length

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation href="/dashboard" />
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Justifications</h1>
              <p className="text-gray-600 mt-1">Gérer les demandes de justification des employés</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
                {nbEnAttente} en attente
              </span>
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | "en_attente" | "traitees")}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="en_attente">En attente</option>
                <option value="traitees">Traitées</option>
                <option value="all">Toutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "all" | "retard" | "absence")}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Tous</option>
                <option value="retard">Retards</option>
                <option value="absence">Absences</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {justifications.map((j) => (
            <div key={j.id_pointage} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {j.employe?.prenom_employe?.[0]}
                    {j.employe?.nom_employe?.[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-lg">
                        {j.employe?.prenom_employe} {j.employe?.nom_employe}
                      </h3>
                      <span className="text-sm text-gray-500">{j.employe?.post_employe}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      📅 {formatDate(j.date_pointage)} • {getTempsEcoule(j.created_at)}
                    </p>

                    {j.justification_retard && (
                      <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-orange-800">🕐 Retard de {j.retard_minutes} minutes</p>
                            <p className="text-sm text-gray-600 mt-1">Arrivée : {j.pointage_arrive}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              j.statut_justification_retard === "justifiee"
                                ? "bg-green-100 text-green-800"
                                : j.statut_justification_retard === "rejetee"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {j.statut_justification_retard === "justifiee"
                              ? "✓ Approuvée"
                              : j.statut_justification_retard === "rejetee"
                                ? "✗ Rejetée"
                                : "⏳ En attente"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">
                          <strong>Justification :</strong> {j.justification_retard}
                        </p>
                        {j.statut_justification_retard === "en_attente" && (
                          <div className="flex space-x-2 mt-3">
                            <button
                              onClick={() => handleTraiter(j.id_pointage, "retard", "justifiee")}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              ✓ Approuver
                            </button>
                            <button
                              onClick={() => handleTraiter(j.id_pointage, "retard", "rejetee")}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              ✗ Rejeter
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {j.justification_absence && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-red-800">❌ Absence</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              j.statut_justification_absence === "justifiee"
                                ? "bg-green-100 text-green-800"
                                : j.statut_justification_absence === "rejetee"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {j.statut_justification_absence === "justifiee"
                              ? "✓ Approuvée"
                              : j.statut_justification_absence === "rejetee"
                                ? "✗ Rejetée"
                                : "⏳ En attente"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">
                          <strong>Justification :</strong> {j.justification_absence}
                        </p>
                        {j.statut_justification_absence === "en_attente" && (
                          <div className="flex space-x-2 mt-3">
                            <button
                              onClick={() => handleTraiter(j.id_pointage, "absence", "justifiee")}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              ✓ Approuver
                            </button>
                            <button
                              onClick={() => handleTraiter(j.id_pointage, "absence", "rejetee")}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              ✗ Rejeter
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {justifications.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">Aucune justification à afficher</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
