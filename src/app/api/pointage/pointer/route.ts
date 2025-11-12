import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Types personnalisés
type PointageType = 'arrive' | 'pause' | 'reprise' | 'depart'

interface PointageRequestBody {
  type: PointageType
}

interface ProfilEmploye {
  id_employe: string
}

interface ServerTimeResponse {
  server_time: string
  server_date: string
}

interface Pointage {
  id_pointage: string
  id_employe: string
  date_pointage: string
  pointage_arrive?: string | null
  pointage_pause?: string | null
  pointage_reprise?: string | null
  pointage_depart?: string | null
}

// Type pour le résultat de validation
interface ValidationResult {
  valid: boolean
  error?: string
}

// Type pour la réponse Supabase
interface SupabaseResponse<T> {
  data: T | null
  error: Error | null
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as PointageRequestBody
    const { type } = body

    const supabase = await createClient()

    // 1️⃣ Vérifier l'authentification
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const user = authData?.user
    
    if (!user || authError) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2️⃣ Récupérer l'ID employé
    const { data: profil, error: profilError } = await supabase
      .from('profil_utilisateur')
      .select('id_employe')
      .eq('id_profil', user.id)
      .single()

    if (profilError || !profil?.id_employe) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    const profilTyped = profil as ProfilEmploye

    // 3️⃣ Récupérer l'heure serveur (RPC)
    const { data: serverTime, error: rpcError } = await supabase
      .rpc('get_server_time')

    if (rpcError || !serverTime || !Array.isArray(serverTime) || serverTime.length === 0) {
      return NextResponse.json(
        { error: 'Impossible de récupérer l\'heure serveur' },
        { status: 500 }
      )
    }

    const serverTimeTyped = serverTime as ServerTimeResponse[]
    const heureServeur = serverTimeTyped[0].server_time
    const dateServeur = serverTimeTyped[0].server_date

    // 4️⃣ Vérifier si un pointage existe déjà aujourd'hui
    const { data: pointageExistant, error: pointageError } = await supabase
      .from('pointage')
      .select('*')
      .eq('id_employe', profilTyped.id_employe)
      .eq('date_pointage', dateServeur)
      .maybeSingle()

    // Si erreur de requête (pas "pas trouvé")
    if (pointageError) {
      console.error('Erreur recherche pointage:', pointageError)
    }

    const pointageExistantTyped = pointageExistant as Pointage | null

    // 5️⃣ Valider selon le type de pointage
    const validation = validerPointage(type, heureServeur, pointageExistantTyped)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // 6️⃣ Créer ou mettre à jour le pointage
    let result: Pointage | null = null

    if (!pointageExistantTyped) {
      // Créer un nouveau pointage
      const { data, error } = await supabase
        .from('pointage')
        .insert({
          id_employe: profilTyped.id_employe,
          date_pointage: dateServeur,
          pointage_arrive: type === 'arrive' ? heureServeur : null,
        })
        .select()
        .single()

      if (error) throw error
      result = data as Pointage
    } else {
      // Mettre à jour le pointage existant
      const updateData: Partial<Pointage> = {}

      if (type === 'arrive') updateData.pointage_arrive = heureServeur
      if (type === 'pause') updateData.pointage_pause = heureServeur
      if (type === 'reprise') updateData.pointage_reprise = heureServeur
      if (type === 'depart') updateData.pointage_depart = heureServeur

      const { data, error } = await supabase
        .from('pointage')
        .update(updateData)
        .eq('id_pointage', pointageExistantTyped.id_pointage)
        .select()
        .single()

      if (error) throw error
      result = data as Pointage
    }

    return NextResponse.json({
      success: true,
      type,
      heure: heureServeur,
      date: dateServeur,
      pointage: result,
    })
  } catch (error: unknown) {
    console.error('Erreur pointage:', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ✅ Fonction de validation fortement typée
function validerPointage(
  type: PointageType,
  heureServeur: string,
  pointageExistant?: Pointage | null
): ValidationResult {
  switch (type) {
    case 'arrive':
      if (pointageExistant?.pointage_arrive) {
        return { valid: false, error: 'Arrivée déjà pointée aujourd\'hui' }
      }
      if (heureServeur < '06:00:00') {
        return { valid: false, error: 'Pointage disponible à partir de 6h00' }
      }
      return { valid: true }

    case 'pause':
      if (!pointageExistant?.pointage_arrive) {
        return { valid: false, error: 'Vous devez pointer l\'arrivée d\'abord' }
      }
      if (pointageExistant.pointage_depart) {
        return { valid: false, error: 'Départ déjà pointé, impossible de pointer la pause' }
      }
      if (pointageExistant.pointage_pause) {
        return { valid: false, error: 'Pause déjà pointée' }
      }
      if (heureServeur < '12:30:00') {
        return { valid: false, error: 'La pause est disponible à partir de 12h30' }
      }
      return { valid: true }

    case 'reprise':
      if (!pointageExistant?.pointage_pause) {
        return { valid: false, error: 'Vous devez pointer la pause d\'abord' }
      }
      if (pointageExistant.pointage_reprise) {
        return { valid: false, error: 'Reprise déjà pointée' }
      }
      return { valid: true }

    case 'depart':
      if (!pointageExistant?.pointage_arrive) {
        return { valid: false, error: 'Vous devez pointer l\'arrivée d\'abord' }
      }
      if (pointageExistant.pointage_depart) {
        return { valid: false, error: 'Départ déjà pointé' }
      }
      if (heureServeur < '16:00:00') {
        return { valid: false, error: 'Le départ est disponible à partir de 16h00' }
      }
      return { valid: true }

    default:
      return { valid: false, error: 'Type de pointage invalide' }
  }
}