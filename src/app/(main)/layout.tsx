import MainLayout from "@/components/layout/MainLayout";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user role
  const { data: userProfil } = await supabase
    .from("profil_utilisateur")
    .select("role")
    .eq("id_profil", user.id)
    .single();

  return (
    <MainLayout user={user} role={userProfil?.role}>
      {children}
    </MainLayout>
  );
}
