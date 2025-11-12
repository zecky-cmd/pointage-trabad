
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface EmployeeActionsProps {
  employeeId: number
  statut: 'actif' | 'inactif'
  isAdmin: boolean
}

export default function EmployeeActions({ employeeId, statut, isAdmin }: EmployeeActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleToggleStatut = async () => {
    if (!confirm(`Voulez-vous vraiment ${statut === 'actif' ? 'désactiver' : 'activer'} cet employé ?`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/employees/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employeeId, 
          newStatus: statut === 'actif' ? 'inactif' : 'actif' 
        }),
      })

      if (!response.ok) throw new Error('Erreur')

      router.refresh()
    } catch (error) {
      alert('Erreur lors du changement de statut')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('⚠️ ATTENTION : Voulez-vous vraiment SUPPRIMER cet employé ? Cette action est irréversible !')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/employees/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      })

      if (!response.ok) throw new Error('Erreur')

      router.refresh()
    } catch (error) {
      alert('Erreur lors de la suppression')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Link
        href={`/employes/${employeeId}`}
        className="text-blue-600 hover:text-blue-900 font-medium"
      >
        Voir
      </Link>
      
      <Link
        href={`/employes/${employeeId}/modifier`}
        className="text-green-600 hover:text-green-900 font-medium"
      >
        Modif
      </Link>

      <button
        onClick={handleToggleStatut}
        disabled={loading}
        className={`font-medium ${
          statut === 'actif' 
            ? 'text-orange-600 hover:text-orange-900' 
            : 'text-green-600 hover:text-green-900'
        } disabled:opacity-50`}
      >
        {statut === 'actif' ? 'Désactiver' : 'Activer'}
      </button>

      {isAdmin && (
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
        >
          Sup
        </button>
      )}
    </div>
  )
}