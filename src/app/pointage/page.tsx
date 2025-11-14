'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PointageButton from '@/components/PointageButton'
import type { Pointage, ServerTimeResponse, User } from '@/types/pointage_btn'

export default function PointagePage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [employeId, setEmployeId] = useState<number | null>(null)
  const [serverTime, setServerTime] = useState<string>('')
  const [serverDate, setServerDate] = useState<string>('')
  const [pointageJour, setPointageJour] = useState<Pointage | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
    const interval = setInterval(updateServerTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async (): Promise<void> => {
    try {
      // Récupérer l'utilisateur
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser({
        id: currentUser.id,
        email: currentUser.email,
        user_metadata: currentUser.user_metadata,
      })

      // Récupérer l'ID employé
      const { data: profil, error: profilError } = await supabase
        .from('profil_utilisateur')
        .select('id_employe')
        .eq('id_profil', currentUser.id)
        .single()

      if (profilError || !profil?.id_employe) {
        throw new Error('Employé non trouvé')
      }
      
      const empId = profil.id_employe as number
      setEmployeId(empId)

      // Récupérer l'heure serveur
      await updateServerTime()

      // Récupérer le pointage du jour
      await loadPointageJour(empId)
    } catch (error) {
      if (error instanceof Error) {
        console.error('Erreur chargement:', error.message)
      } else {
        console.error('Erreur chargement:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const updateServerTime = async (): Promise<void> => {
    try {
      const { data, error } = await supabase.rpc('get_server_time')
      
      if (error) {
        console.error('Erreur récupération heure:', error.message)
        return
      }

      const serverData = data as ServerTimeResponse[] | null
      if (serverData && serverData.length > 0) {
        setServerTime(serverData[0].server_time)
        setServerDate(serverData[0].server_date)
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Erreur updateServerTime:', error.message)
      }
    }
  }

  const loadPointageJour = async (empId: number): Promise<void> => {
    try {
      const { data: serverData, error: timeError } = await supabase.rpc('get_server_time')
      
      if (timeError) {
        console.error('Erreur récupération date:', timeError.message)
        return
      }

      const timeResponse = serverData as ServerTimeResponse[] | null
      if (!timeResponse || timeResponse.length === 0) {
        throw new Error('Impossible de récupérer la date du serveur')
      }

      const dateJour = timeResponse[0].server_date

      const { data, error } = await supabase
        .from('pointage')
        .select('*')
        .eq('id_employe', empId)
        .eq('date_pointage', dateJour)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur pointage:', error.message)
        return
      }

      setPointageJour((data as Pointage) || null)
    } catch (error) {
      if (error instanceof Error) {
        console.error('Erreur loadPointageJour:', error.message)
      }
    }
  }

  const handlePointer = async (type: 'arrive' | 'pause' | 'reprise' | 'depart'): Promise<void> => {
    try {
      const response = await fetch('/api/pointage/pointer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      const result = await response.json() as { heure?: string; error?: string }

      if (!response.ok) {
        alert(result.error || 'Erreur lors du pointage')
        return
      }

      // Rafraîchir le pointage
      if (employeId) {
        await loadPointageJour(employeId)
      }
      
      // Message de succès
      const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)
      alert(`✅ ${typeLabel} pointée à ${result.heure || ''}`)
    } catch (error) {
      if (error instanceof Error) {
        console.error('Erreur:', error.message)
      }
      alert('Erreur lors du pointage')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    )
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Retour
              </Link>
              <h1 className="text-xl font-bold">Pointage</h1>
            </div>
            <div className="flex items-center">
              <Link
                href="/pointage/rapport"
                className="px-4 py-2 text-blue-600 hover:text-blue-800"
              >
                📊 Mon rapport
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* En-tête avec date et heure */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 capitalize">
              {serverDate && formatDate(serverDate)}
            </h2>
            <p className="text-3xl font-mono text-blue-600 mt-2">
              🕐 {serverTime}
            </p>
          </div>
        </div>

        {/* Carte de pointage */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-6">Pointer mes heures</h3>
          
          <div className="space-y-4">
            <PointageButton
              type="arrive"
              label="Arrivée"
              icon="🏢"
              heurePointee={pointageJour?.pointage_arrive || undefined}
              serverTime={serverTime}
              pointageJour={pointageJour}
              onPointer={handlePointer}
            />

            <PointageButton
              type="pause"
              label="Pause"
              icon="☕"
              heurePointee={pointageJour?.pointage_pause || undefined}
              serverTime={serverTime}
              pointageJour={pointageJour}
              onPointer={handlePointer}
            />

            <PointageButton
              type="reprise"
              label="Reprise"
              icon="💼"
              heurePointee={pointageJour?.pointage_reprise || undefined}
              serverTime={serverTime}
              pointageJour={pointageJour}
              onPointer={handlePointer}
            />

            <PointageButton
              type="depart"
              label="Départ"
              icon="🏠"
              heurePointee={pointageJour?.pointage_depart || undefined}
              serverTime={serverTime}
              pointageJour={pointageJour}
              onPointer={handlePointer}
            />
          </div>

          {/* Afficher le retard si existe */}
          {pointageJour && pointageJour.retard_minutes > 0 && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded">
              <p className="text-orange-800">
                ⚠️ Retard de {pointageJour.retard_minutes} minutes
              </p>
              {pointageJour.retard_minutes > 15 && !pointageJour.justification_retard && (
                <Link 
                  href="/pointage/rapport"
                  className="mt-2 text-sm text-orange-600 hover:text-orange-800 underline"
                >
                  Justifier ce retard
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
