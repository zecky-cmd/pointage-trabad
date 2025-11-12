

import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { id_pointage, type, justification } = await request.json()
    // type: 'retard' | 'absence'
    
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer l'ID employé
    const { data: profil } = await supabase
      .from('profil_utilisateur')
      .select('id_employe')
      .eq('id_profil', user.id)
      .single()

    if (!profil?.id_employe) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    // Vérifier que le pointage appartient à l'employé
    const { data: pointage } = await supabase
      .from('pointage')
      .select('*')
      .eq('id_pointage', id_pointage)
      .eq('id_employe', profil.id_employe)
      .single()

    if (!pointage) {
      return NextResponse.json({ error: 'Pointage non trouvé' }, { status: 404 })
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
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

  } catch (error: any) {
    console.error('Erreur justification:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}