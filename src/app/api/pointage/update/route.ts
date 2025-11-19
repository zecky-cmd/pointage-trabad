import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Types pour le pointage
interface Pointage {
  id_pointage: string
  id_employe: string
  date_pointage: string
  pointage_arrive?: string | null
  pointage_pause?: string | null
  pointage_reprise?: string | null
  pointage_depart?: string | null
}
// Type pour les données de mise à jour
interface PointageUpdateData {
  pointage_arrive?: string | null
  pointage_pause?: string | null
  pointage_reprise?: string | null
  pointage_depart?: string | null
}
// Type pour le body de la requête
interface UpdateRequestBody extends PointageUpdateData {
  id_pointage: string
}
// Type pour le profil utilisateur
interface ProfilUtilisateur {
  role: string
}
// Type pour les données nettoyées
type CleanData = Partial<PointageUpdateData>
export async function PUT(request: Request) {
  try {
    const body = await request.json() as UpdateRequestBody
    const { id_pointage, ...updateData } = body
    const supabase = await createClient()
    // Vérifier l'authentification
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    // Vérifier que l'utilisateur est admin ou RH
    const { data: profil, error: profilError } = await supabase
      .from('profil_utilisateur')
      .select('role')
      .eq('id_profil', user.id)
      .single()
    if (profilError || !profil) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      )
    }
    const profilTyped = profil as ProfilUtilisateur
    if (!['admin', 'rh'].includes(profilTyped.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    // Nettoyer les données (convertir les chaînes vides en NULL)
    const cleanData: CleanData = {}
    const keys = Object.keys(updateData) as Array<keyof PointageUpdateData>
    keys.forEach((key) => {
      const value = updateData[key]
      cleanData[key] = value === '' ? null : value
    })
    // Vérifier qu'il y a des données à mettre à jour
    if (Object.keys(cleanData).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      )
    }
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
    const pointageUpdated = data as Pointage
    return NextResponse.json({ 
      success: true, 
      data: pointageUpdated 
    })
  } catch (error: unknown) {
    console.error('Erreur update pointage:', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}