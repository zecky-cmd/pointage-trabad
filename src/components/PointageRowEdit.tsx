'use client'

import { useState } from 'react'
// import { createClient } from '@/utils/supabase/client'

interface PointageData {
  id_pointage: number
  id_employe: string
  date_pointage: string
  pointage_arrive: string | null
  pointage_pause: string | null
  pointage_reprise: string | null
  pointage_depart: string | null
  justification_absence: string | null
  justification_retard: string | null
  statut_justification_absence: 'en_attente' | 'justifiee' | 'rejetee' | null
  statut_justification_retard: 'en_attente' | 'justifiee' | 'rejetee' | null
  retard_minutes: number
  statut: 'present' | 'absent' | 'weekend' | 'conge'
}

interface FormDataType {
  pointage_arrive: string
  pointage_pause: string
  pointage_reprise: string
  pointage_depart: string
  justification_absence: string | null
  justification_retard: string | null
  statut_justification_absence: 'en_attente' | 'justifiee' | 'rejetee' | null
  statut_justification_retard: 'en_attente' | 'justifiee' | 'rejetee' | null
}

interface Props {
  pointage: PointageData
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  calculerHeures: (p: PointageData) => number
  formatDuree: (h: number) => string
}

export default function PointageRowEdit({ 
  pointage, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel,
  calculerHeures,
  formatDuree 
}: Props) {
  const [formData, setFormData] = useState<FormDataType>({
    pointage_arrive: pointage.pointage_arrive || '',
    pointage_pause: pointage.pointage_pause || '',
    pointage_reprise: pointage.pointage_reprise || '',
    pointage_depart: pointage.pointage_depart || '',
    justification_absence: pointage.justification_absence || null,
    justification_retard: pointage.justification_retard || null,
    statut_justification_absence: pointage.statut_justification_absence || null,
    statut_justification_retard: pointage.statut_justification_retard || null,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/pointage/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pointage: pointage.id_pointage,
          ...formData
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde')
      }

      alert('✅ Pointage mis à jour avec succès')
      onSave()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      console.error('Erreur:', err)
      alert(`Erreur: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }

  if (isEditing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-3 py-3 text-sm">{formatDate(pointage.date_pointage)}</td>
        <td className="px-3 py-2">
          <input
            type="time"
            value={formData.pointage_arrive}
            onChange={(e) => setFormData({ ...formData, pointage_arrive: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="time"
            value={formData.pointage_pause}
            onChange={(e) => setFormData({ ...formData, pointage_pause: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="time"
            value={formData.pointage_reprise}
            onChange={(e) => setFormData({ ...formData, pointage_reprise: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="time"
            value={formData.pointage_depart}
            onChange={(e) => setFormData({ ...formData, pointage_depart: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </td>
        <td className="px-3 py-2 text-sm">-</td>
        <td className="px-3 py-2 text-sm">-</td>
        <td className="px-3 py-2 text-sm">-</td>
        <td className="px-3 py-2">
          <div className="space-y-1">
            {pointage.justification_absence && (
              <select
                value={formData.statut_justification_absence || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  statut_justification_absence: (e.target.value as 'en_attente' | 'justifiee' | 'rejetee') || null 
                })}
                className="w-full px-2 py-1 border rounded text-xs"
              >
                <option value="">Non traité</option>
                <option value="en_attente">En attente</option>
                <option value="justifiee">Justifiée</option>
                <option value="rejetee">Rejetée</option>
              </select>
            )}
            {pointage.justification_retard && (
              <select
                value={formData.statut_justification_retard || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  statut_justification_retard: (e.target.value as 'en_attente' | 'justifiee' | 'rejetee') || null 
                })}
                className="w-full px-2 py-1 border rounded text-xs"
              >
                <option value="">Non traité</option>
                <option value="en_attente">En attente</option>
                <option value="justifiee">Justifiée</option>
                <option value="rejetee">Rejetée</option>
              </select>
            )}
          </div>
        </td>
        <td className="px-3 py-2">
          <div className="flex space-x-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? '...' : '✓'}
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
            >
              ✗
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className={pointage.statut === 'weekend' ? 'bg-gray-50' : ''}>
      <td className="px-3 py-3 text-sm">{formatDate(pointage.date_pointage)}</td>
      <td className="px-3 py-3 text-sm font-mono">{pointage.pointage_arrive || '----'}</td>
      <td className="px-3 py-3 text-sm font-mono">{pointage.pointage_pause || '----'}</td>
      <td className="px-3 py-3 text-sm font-mono">{pointage.pointage_reprise || '----'}</td>
      <td className="px-3 py-3 text-sm font-mono">{pointage.pointage_depart || '----'}</td>
      <td className="px-3 py-3 text-sm font-semibold">{formatDuree(calculerHeures(pointage))}</td>
      <td className="px-3 py-3 text-sm">
        {pointage.retard_minutes > 0 ? (
          <span className={pointage.retard_minutes > 15 ? 'text-red-600 font-semibold' : 'text-orange-600'}>
            {pointage.retard_minutes}min
          </span>
        ) : (
          <span className="text-green-600">À l&apos;heure</span>
        )}
      </td>
      <td className="px-3 py-3 text-sm">
        <span className={`px-2 py-1 text-xs rounded-full ${
          pointage.statut === 'present' ? 'bg-green-100 text-green-800' :
          pointage.statut === 'absent' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {pointage.statut === 'present' ? 'Présent' : 
           pointage.statut === 'absent' ? 'Absent' : 'Week-end'}
        </span>
      </td>
      <td className="px-3 py-3 text-xs">
        {pointage.justification_absence && (
          <div className="mb-1">
            <span className={`px-2 py-1 rounded-full ${
              pointage.statut_justification_absence === 'justifiee' ? 'bg-green-100 text-green-800' :
              pointage.statut_justification_absence === 'rejetee' ? 'bg-red-100 text-red-800' :
              pointage.statut_justification_absence === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              Absence: {pointage.statut_justification_absence || 'Non traité'}
            </span>
          </div>
        )}
        {pointage.justification_retard && (
          <div>
            <span className={`px-2 py-1 rounded-full ${
              pointage.statut_justification_retard === 'justifiee' ? 'bg-green-100 text-green-800' :
              pointage.statut_justification_retard === 'rejetee' ? 'bg-red-100 text-red-800' :
              pointage.statut_justification_retard === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              Retard: {pointage.statut_justification_retard || 'Non traité'}
            </span>
          </div>
        )}
      </td>
      <td className="px-3 py-3 text-sm">
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-900 font-medium"
        >
          Modifier
        </button>
      </td>
    </tr>
  )
}
