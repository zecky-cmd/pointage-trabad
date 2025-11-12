
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'


type Profil = { role: string; id_profil?: string }
type EmployeeProfil = { id_profil: string }


export async function DELETE(request: Request) {
  try {
    const { employeeId } = (await request.json()) as { employeeId: string }
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data, error: authError } = await supabase.auth.getUser()
    const user = data?.user
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est ADMIN (pas RH)
    const { data: profil } = await supabase
      .from('profil_utilisateur')
      .select('role')
      .eq('id_profil', user.id)
      .single<Profil>()

    if (!profil || profil.role !== 'admin') {
      return NextResponse.json({ error: 'Seuls les admins peuvent supprimer' }, { status: 403 })
    }

    // Récupérer le profil de l'employé à supprimer
    const { data: employeeProfil } = await supabase
      .from('profil_utilisateur')
      .select('id_profil')
      .eq('id_employe', employeeId)
      .single<EmployeeProfil>()

    // Supprimer le user Auth si existe
    if (employeeProfil?.id_profil) {
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )

      await supabaseAdmin.auth.admin.deleteUser(employeeProfil.id_profil)
    }

    // Supprimer l'employé (cascade supprimera le profil)
    const { error } = await supabase
      .from('employe')
      .delete()
      .eq('id_employe', employeeId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Erreur suppression:', error)
    const message = error instanceof Error ? error.message : 'Erreur de serveur'
    return NextResponse.json(
      { error: message },{ status: 500 }
    )
  }
}