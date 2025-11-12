

'use client'

import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (type: 'retard' | 'absence', justification: string) => Promise<void>
  type: 'retard' | 'absence'
  date: string
}

export default function JustificationModal({ isOpen, onClose, onSubmit, type, date }: Props) {
  const [justification, setJustification] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!justification.trim()) {
      alert('Veuillez saisir une justification')
      return
    }

    setLoading(true)
    try {
      await onSubmit(type, justification)
      setJustification('')
      onClose()
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">
            Justifier {type === 'retard' ? 'le retard' : 'l\'absence'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Date : {new Date(date).toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motif de justification *
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              required
              placeholder="Ex: Rendez-vous médical, problème de transport, urgence familiale..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <p className="text-xs text-yellow-800">
              ⚠️ Votre justification sera examinée par un administrateur ou RH. 
              Vous serez notifié une fois la décision prise.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer la justification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}