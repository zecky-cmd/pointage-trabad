

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ModifierEmployePage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    poste: '',
    departement: '',
    role: 'employe' as 'admin' | 'rh' | 'employe',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadEmployee()
  }, [])

  const loadEmployee = async () => {
    try {
      const { data: employe, error: empError } = await supabase
        .from('employe')
        .select(`
          *,
          profil_utilisateur (role)
        `)
        .eq('id_employe', params.id)
        .single()

      if (empError) throw empError

      setFormData({
        prenom: employe.prenom_employe,
        nom: employe.nom_employe,
        email: employe.email_employe,
        telephone: employe.tel_employe || '',
        poste: employe.poste_employe || '',
        departement: employe.departement_employe || '',
        role: employe.profil_utilisateur?.[0]?.role || 'employe',
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // 1. Mettre à jour l'employé
      const { error: empError } = await supabase
        .from('employe')
        .update({
          prenom_employe: formData.prenom,
          nom_employe: formData.nom,
          email_employe: formData.email,
          tel_employe: formData.telephone,
          post_employe: formData.poste,
          departement_employe: formData.departement,
        })
        .eq('id_employe', params.id)

      if (empError) throw empError

      // 2. Mettre à jour le rôle dans profil_utilisateur
      const { error: roleError } = await supabase
        .from('profil_utilisateur')
        .update({ role: formData.role })
        .eq('id_employe', params.id)

      if (roleError) {
        console.warn('Erreur mise à jour rôle:', roleError)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/employes')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href={`/employes/${params.id}`} className="text-blue-600 hover:text-blue-800">
              ← Retour
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Modifier l'employé</h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              Employé modifié avec succès ! Redirection...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Prénom *</label>
                <input
                  type="text"
                  required
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Téléphone</label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Poste</label>
                <input
                  type="text"
                  value={formData.poste}
                  onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Département</label>
                <input
                  type="text"
                  value={formData.departement}
                  onChange={(e) => setFormData({ ...formData, departement: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Rôle *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="employe">Employé</option>
                <option value="rh">RH</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Link
                href={`/employes/${params.id}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}