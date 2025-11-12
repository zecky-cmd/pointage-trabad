import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, employeeId, role } = await request.json()

    // Créer un client Supabase avec service_role (admin)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Clé service_role
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 1. Créer le user dans auth.users
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmer l'email automatiquement
    })

    if (authError) {
      throw new Error(authError.message)
    }

    // 2. Mettre à jour le profil avec le bon rôle et l'ID employé
    const { error: profileError } = await supabaseAdmin
      .from('profil_utilisateur')
      .update({
        id_employe: employeeId,
        role: role,
      })
      .eq('id_profil', userData.user.id)

    if (profileError) {
      console.error('Erreur mise à jour profil:', profileError)
      // Ne pas bloquer si ça échoue, le trigger a peut-être déjà créé le profil
    }

    return NextResponse.json({
      success: true,
      user: userData.user,
      message: 'Compte créé avec succès',
    })
  } catch (error: any ) {
    console.error('Erreur création user:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du compte' },
      { status: 500 }
    )
  }
}