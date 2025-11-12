

import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { employeeId, newStatus } = await request.json()
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

    // Mettre à jour le statut
    const { error } = await supabase
      .from('employe')
      .update({ statut_employe: newStatus })
      .eq('id_employe', employeeId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erreur toggle status:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}