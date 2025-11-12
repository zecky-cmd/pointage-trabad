import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { type } = await request.json()
    // type: 'arrive' | 'pause' | 'reprise' | 'depart'
    
    const supabase = await createClient()

    // 1. Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Récupérer l'ID employé
    const { data: profil } = await supabase
      .from('profil_utilisateur')
      .select('id_employe')
      .eq('id_profil', user.id)
      .single()

    if (!profil?.id_employe) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    // 3. Récupérer l'heure serveur
    const { data: serverTime } = await supabase.rpc('get_server_time')
    const heureServeur = serverTime[0].server_time
    const dateServeur = serverTime[0].server_date

    // 4. Vérifier si un pointage existe déjà aujourd'hui
    const { data: pointageExistant } = await supabase
      .from('pointage')
      .select('*')
      .eq('id_employe', profil.id_employe)
      .eq('date_pointage', dateServeur)
      .single()

    // 5. Valider selon le type de pointage
    const validation = validerPointage(type, heureServeur, pointageExistant)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // 6. Créer ou mettre à jour le pointage
    let result
    if (!pointageExistant) {
      // Créer un nouveau pointage
      const { data, error } = await supabase
        .from('pointage')
        .insert({
          id_employe: profil.id_employe,
          date_pointage: dateServeur,
          pointage_arrive: type === 'arrive' ? heureServeur : null,
        })
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Mettre à jour le pointage existant
      const updateData: any = {}
      if (type === 'arrive') updateData.pointage_arrive = heureServeur
      if (type === 'pause') updateData.pointage_pause = heureServeur
      if (type === 'reprise') updateData.pointage_reprise = heureServeur
      if (type === 'depart') updateData.pointage_depart = heureServeur

      const { data, error } = await supabase
        .from('pointage')
        .update(updateData)
        .eq('id_pointage', pointageExistant.id_pointage)
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({
      success: true,
      type,
      heure: heureServeur,
      date: dateServeur,
      pointage: result,
    })

  } catch (error: any) {
    console.error('Erreur pointage:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Fonction de validation
function validerPointage(
  type: string,
  heureServeur: string,
  pointageExistant: any
): { valid: boolean; error?: string } {
  
  switch (type) {
    case 'arrive':
      // L'arrivée est toujours possible si pas encore pointée
      if (pointageExistant?.pointage_arrive) {
        return { valid: false, error: 'Arrivée déjà pointée aujourd\'hui' }
      }
      // Vérification heure minimum (6h00)
      if (heureServeur < '06:00:00') {
        return { valid: false, error: 'Pointage disponible à partir de 6h00' }
      }
      return { valid: true }

    case 'pause':
      // Vérifier que l'arrivée existe
      if (!pointageExistant?.pointage_arrive) {
        return { valid: false, error: 'Vous devez pointer l\'arrivée d\'abord' }
      }
      // Vérifier que le départ n'est pas déjà pointé
      if (pointageExistant.pointage_depart) {
        return { valid: false, error: 'Vous avez déjà pointé le départ, impossible de pointer la pause' }
      }
      // Vérifier que la pause n'est pas déjà pointée
      if (pointageExistant.pointage_pause) {
        return { valid: false, error: 'Pause déjà pointée' }
      }
      // Vérifier l'heure (≥ 12h30)
      if (heureServeur < '12:30:00') {
        return { valid: false, error: 'La pause est disponible à partir de 12h30' }
      }
      return { valid: true }

    case 'reprise':
      // Vérifier que la pause existe
      if (!pointageExistant?.pointage_pause) {
        return { valid: false, error: 'Vous devez pointer la pause d\'abord' }
      }
      // Vérifier que la reprise n'est pas déjà pointée
      if (pointageExistant.pointage_reprise) {
        return { valid: false, error: 'Reprise déjà pointée' }
      }
      return { valid: true }

    case 'depart':
      // Vérifier que l'arrivée existe
      if (!pointageExistant?.pointage_arrive) {
        return { valid: false, error: 'Vous devez pointer l\'arrivée d\'abord' }
      }
      // Vérifier que le départ n'est pas déjà pointé
      if (pointageExistant.pointage_depart) {
        return { valid: false, error: 'Départ déjà pointé' }
      }
      // Vérifier l'heure (≥ 17h30)
      if (heureServeur < '17:30:00') {
        return { valid: false, error: 'Le départ est disponible à partir de 17h30' }
      }
      return { valid: true }

    default:
      return { valid: false, error: 'Type de pointage invalide' }
  }
}