
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PointageButton from '@/components/PointageButton'

export default function PointagePage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [employeId, setEmployeId] = useState<number | null>(null)
  const [serverTime, setServerTime] = useState<string>('')
  const [serverDate, setServerDate] = useState<string>('')
  const [pointageJour, setPointageJour] = useState<any>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
    // Rafraîchir l'heure toutes les secondes
    const interval = setInterval(updateServerTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      // Récupérer l'utilisateur
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)

      // Récupérer l'ID employé
      const { data: profil } = await supabase
        .from('profil_utilisateur')
        .select('id_employe')
        .eq('id_profil', currentUser.id)
        .single()

      if (!profil?.id_employe) {
        throw new Error('Employé non trouvé')
      }
      setEmployeId(profil.id_employe)

      // Récupérer l'heure serveur
      await updateServerTime()

      // Récupérer le pointage du jour
      await loadPointageJour(profil.id_employe)
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateServerTime = async () => {
    const { data } = await supabase.rpc('get_server_time')
    if (data && data[0]) {
      setServerTime(data[0].server_time)
      setServerDate(data[0].server_date)
    }
  }


  const loadPointageJour = async (empId: number) => {
    const { data: serverData } = await supabase.rpc('get_server_time')
    const dateJour = serverData[0].server_date

    const { data } = await supabase
      .from('pointage')
      .select('*')
      .eq('id_employe', empId)
      .eq('date_pointage', dateJour)
      .single()

    setPointageJour(data)
  }

  const handlePointer = async (type: 'arrive' | 'pause' | 'reprise' | 'depart') => {
    try {
      const response = await fetch('/api/pointage/pointer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || 'Erreur lors du pointage')
        return
      }

      // Rafraîchir le pointage
      await loadPointageJour(employeId!)
      
      // Message de succès
      alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} pointée à ${result.heure}`)
    } catch (error) {
      console.error('Erreur:', error)
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

  const formatDate = (dateStr: string) => {
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
              heurePointee={pointageJour?.pointage_arrive}
              serverTime={serverTime}
              pointageJour={pointageJour}
              onPointer={handlePointer}
            />

            <PointageButton
              type="pause"
              label="Pause"
              icon="☕"
              heurePointee={pointageJour?.pointage_pause}
              serverTime={serverTime}
              pointageJour={pointageJour}
              onPointer={handlePointer}
            />

            <PointageButton
              type="reprise"
              label="Reprise"
              icon="💼"
              heurePointee={pointageJour?.pointage_reprise}
              serverTime={serverTime}
              pointageJour={pointageJour}
              onPointer={handlePointer}
            />

            <PointageButton
              type="depart"
              label="Départ"
              icon="🏠"
              heurePointee={pointageJour?.pointage_depart}
              serverTime={serverTime}
              pointageJour={pointageJour}
              onPointer={handlePointer}
            />
          </div>

          {/* Afficher le retard si existe */}
          {pointageJour?.retard_minutes > 0 && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded">
              <p className="text-orange-800">
                ⚠️ Retard de {pointageJour.retard_minutes} minutes
              </p>
              {pointageJour.retard_minutes > 15 && !pointageJour.justification_retard && (
                <Link 
                href={"pointage/rapport"}
                className="mt-2 text-sm text-orange-600 hover:text-orange-800 underline">
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


/**
 * 
 * const {data: profil} = await supabase.from('profil_utilisateur').select('id_employe').eq('id_profil', user.id)
 * 
 * 
 * from('pointage').select('*')
 * .eq('id_employe', profil.id_employe)
 * 
 * 
 * 
 * 
 * **/