
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

type JustificationType = 'retard' | 'absence'
interface JustificationRequestBody {
  id_pointage: string
  type: JustificationType
  justification: string
}

interface ProfilEmploye {
  id_employe: string
}
interface Pointage {
  id_pointage: string
  id_employe: string
  justification_retard?: string
  justification_absence?: string
  statut_justification_retard?: string
  statut_justification_absence?: string
}

export async function POST(request: Request) {
  try {
    const { id_pointage, type, justification } = (await request.json()) as JustificationRequestBody
    // type: 'retard' | 'absence'
    
    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.getUser()
    const user = authData?.user

    if (!user || authError) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    // Récupérer l'ID employé
    const { data: profil, error: profileError } = await supabase
      .from('profil_utilisateur')
      .select('id_employe')
      .eq('id_profil', user.id)
      .single<ProfilEmploye>()

    if (profileError || !profil?.id_employe) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }
    // Vérifier que le pointage appartient à l'employé
    const { data: pointage, error: pointageError } = await supabase
      .from('pointage')
      .select('*')
      .eq('id_pointage', id_pointage)
      .eq('id_employe', profil.id_employe)
      .single<Pointage>()

    if (pointageError || !pointage) {
      return NextResponse.json({ error: 'Pointage non trouvé' }, { status: 404 })
    }
    // Préparer les données de mise à jour
    const updateData: Partial<Pointage> = {}
    if (type === 'retard') {
      updateData.justification_retard = justification
      updateData.statut_justification_retard = 'en_attente'
    } else if (type === 'absence') {
      updateData.justification_absence = justification
      updateData.statut_justification_absence = 'en_attente'
    }
    // Mettre à jour le pointage
    const { data, error } = await supabase
      .from('pointage')
      .update(updateData)
      .eq('id_pointage', id_pointage)
      .select()
      .single()
    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Justification envoyée avec succès',
      data,
    })
  } catch (error: unknown) {
    console.error('Erreur justification:', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json(
      { error: message }, { status: 500 }
    )
  }
}