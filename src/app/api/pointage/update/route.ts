import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  try {
    const { id_pointage, ...updateData } = await request.json()
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin ou RH
    const { data: profil } = await supabase
      .from('profil_utilisateur')
      .select('role')
      .eq('id_profil', user.id)
      .single()

    if (!profil || !['admin', 'rh'].includes(profil.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Nettoyer les données (convertir les chaînes vides en NULL)
    const cleanData: any = {}
    Object.keys(updateData).forEach(key => {
      cleanData[key] = updateData[key] === '' ? null : updateData[key]
    })

    // Mettre à jour le pointage
    const { data, error } = await supabase
      .from('pointage')
      .update(cleanData)
      .eq('id_pointage', id_pointage)
      .select()
      .single()

    if (error) {
      console.error('Erreur Supabase:', error)
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Erreur update pointage:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}