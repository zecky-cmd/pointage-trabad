"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation/Nav"

interface Employe {
  id_employe: number
  prenom_employe: string
  nom_employe: string
  post_employe: string
  statut_employe: "actif" | "inactif"
}

interface ProfilUtilisateur {
  id_profil: string
  role: "admin" | "rh" | "employe"
}

interface Pointage {
  id_pointage: number
  id_employe: number
  date_pointage: string
  pointage_arrive: string | null
  pointage_pause: string | null
  pointage_reprise: string | null
  pointage_depart: string | null
  statut: "present" | "absent" | "ferie" | "weekend"
}

interface UpdatePointagePayload {
  id_pointage: number
  [key: string]: string | number | null
}

interface RpcParams {
  p_id_employe: number
  p_date_debut: string
  p_date_fin: string
}

export default function ImportPointagesPage() {
  const [loading, setLoading] = useState<boolean>(true)
  const [employes, setEmployes] = useState<Employe[]>([])
  const [employeSelectionne, setEmployeSelectionne] = useState<number | null>(null)
  const [moisSelectionne, setMoisSelectionne] = useState<string>("")
  const [pointages, setPointages] = useState<Pointage[]>([])
  const [generating, setGenerating] = useState<boolean>(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (employeSelectionne && moisSelectionne) {
      loadPointagesMois()
    }
  }, [employeSelectionne, moisSelectionne])

  const loadData = async (): Promise<void> => {
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

      const typedProfil = profil as ProfilUtilisateur | null
      if (!typedProfil || !["admin", "rh"].includes(typedProfil.role)) {
        router.push("/dashboard")
        return
      }

      const { data: emps } = await supabase
        .from("employe")
        .select("*")
        .eq("statut_employe", "actif")
        .order("nom_employe")

      setEmployes((emps as Employe[]) || [])

      const now = new Date()
      setMoisSelectionne(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadPointagesMois = async (): Promise<void> => {
    const [annee, mois] = moisSelectionne.split("-")
    const premierJour = `${annee}-${mois}-01`
    const dernierJour = new Date(Number.parseInt(annee), Number.parseInt(mois), 0).getDate()
    const dernierJourDate = `${annee}-${mois}-${dernierJour}`

    const { data } = await supabase
      .from("pointage")
      .select("*")
      .eq("id_employe", employeSelectionne)
      .gte("date_pointage", premierJour)
      .lte("date_pointage", dernierJourDate)
      .order("date_pointage", { ascending: true })

    setPointages((data as Pointage[]) || [])
  }

  const genererLignesMois = async (): Promise<void> => {
    if (!employeSelectionne || !moisSelectionne) return

    setGenerating(true)
    try {
      const [annee, mois] = moisSelectionne.split("-")
      const debut = `${annee}-${mois}-01`
      const dernierJour = new Date(Number.parseInt(annee), Number.parseInt(mois), 0).getDate()
      const fin = `${annee}-${mois}-${dernierJour}`

      const params: RpcParams = {
        p_id_employe: employeSelectionne,
        p_date_debut: debut,
        p_date_fin: fin,
      }

      await supabase.rpc("generer_lignes_employe_periode", params)

      alert("✅ Lignes générées avec succès")
      await loadPointagesMois()
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de la génération")
    } finally {
      setGenerating(false)
    }
  }

  const handleSavePointage = async (pointage: Pointage, field: string, value: string): Promise<void> => {
    try {
      const updateData: UpdatePointagePayload = {
        id_pointage: pointage.id_pointage,
      }
      updateData[field] = value || null

      const response = await fetch("/api/pointage/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) throw new Error("Erreur")

      await loadPointagesMois()
    } catch (error) {
      alert("Erreur lors de la sauvegarde")
    }
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    })
  }

  const employeNom = employes.find((e) => e.id_employe === employeSelectionne)

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation href="/dashboard" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Import des pointages (mois précédents)</h1>
          <p className="text-gray-600 mb-6">
            Saisissez les pointages des mois précédents effectués manuellement sur feuille
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employé *</label>
              <select
                value={employeSelectionne || ""}
                onChange={(e) => setEmployeSelectionne(Number.parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Sélectionner un employé</option>
                {employes.map((emp) => (
                  <option key={emp.id_employe} value={emp.id_employe}>
                    {emp.prenom_employe} {emp.nom_employe}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mois *</label>
              <input
                type="month"
                value={moisSelectionne}
                onChange={(e) => setMoisSelectionne(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={genererLignesMois}
                disabled={!employeSelectionne || !moisSelectionne || generating}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {generating ? "Génération..." : "🔄 Générer les lignes"}
              </button>
            </div>
          </div>

          {employeSelectionne && employeNom && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                📋{" "}
                <strong>
                  {employeNom.prenom_employe} {employeNom.nom_employe}
                </strong>{" "}
                - {employeNom.post_employe}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Cliquez sur &quot;Générer les lignes&quot; pour créer toutes les lignes du mois (jours ouvrables, weekends,
                fériés). Ensuite, remplissez les heures de pointage jour par jour.
              </p>
            </div>
          )}
        </div>

        {pointages.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrivée</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pause</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reprise</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Départ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pointages.map((p) => (
                  <tr
                    key={p.id_pointage}
                    className={
                      p.statut === "weekend"
                        ? "bg-gray-50"
                        : p.statut === "ferie"
                          ? "bg-yellow-50"
                          : p.statut === "absent"
                            ? "bg-red-50"
                            : ""
                    }
                  >
                    <td className="px-4 py-3 text-sm font-medium">{formatDate(p.date_pointage)}</td>
                    <td className="px-4 py-2">
                      {p.statut === "present" || p.statut === "absent" ? (
                        <input
                          type="time"
                          value={p.pointage_arrive || ""}
                          onChange={(e) => handleSavePointage(p, "pointage_arrive", e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      ) : (
                        <span className="text-gray-400">----</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {p.statut === "present" ? (
                        <input
                          type="time"
                          value={p.pointage_pause || ""}
                          onChange={(e) => handleSavePointage(p, "pointage_pause", e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      ) : (
                        <span className="text-gray-400">----</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {p.statut === "present" ? (
                        <input
                          type="time"
                          value={p.pointage_reprise || ""}
                          onChange={(e) => handleSavePointage(p, "pointage_reprise", e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      ) : (
                        <span className="text-gray-400">----</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {p.statut === "present" || p.statut === "absent" ? (
                        <input
                          type="time"
                          value={p.pointage_depart || ""}
                          onChange={(e) => handleSavePointage(p, "pointage_depart", e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      ) : (
                        <span className="text-gray-400">----</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          p.statut === "present"
                            ? "bg-green-100 text-green-800"
                            : p.statut === "absent"
                              ? "bg-red-100 text-red-800"
                              : p.statut === "ferie"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {p.statut === "present"
                          ? "Présent"
                          : p.statut === "absent"
                            ? "Absent"
                            : p.statut === "ferie"
                              ? "Férié"
                              : "Week-end"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {employeSelectionne && moisSelectionne && pointages.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">Aucune ligne pour ce mois</p>
            <button
              onClick={genererLignesMois}
              disabled={generating}
              className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {generating ? "Génération..." : "🔄 Générer les lignes du mois"}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
