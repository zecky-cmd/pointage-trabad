import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import LiveEmployeeStatus from "@/components/LiveEmployeeStatus";
import StatsCard from "@/components/dashboard/StatsCard";
import QuickLinksGrid from "@/components/dashboard/QuickLinksGrid";
import { Users, UserCheck, UserX, Clock } from "lucide-react";

export default async function DashboardPage() {
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

  // Fetch stats
  const { count: totalEmployees } = await supabase
    .from("employe")
    .select("*", { count: "exact", head: true });

  const today = new Date().toISOString().split("T")[0];

  const { count: presentCount } = await supabase
    .from("pointage")
    .select("*", { count: "exact", head: true })
    .eq("date_pointage", today)
    .not("pointage_arrive", "is", null);

  // Calculate absent (Total - Present) - This is a rough estimate
  const absentCount = (totalEmployees || 0) - (presentCount || 0);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500">Bienvenue sur votre espace de gestion.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Employés"
          value={totalEmployees || 0}
          icon={Users}
          iconClassName="bg-blue-50 text-blue-600"
          // trend={{ value: 12, label: "ce mois", positive: true }}
        />
        <StatsCard
          title="Présents Aujourd'hui"
          value={presentCount || 0}
          icon={UserCheck}
          iconClassName="bg-green-50 text-green-600"
        />
        <StatsCard
          title="Absents"
          value={absentCount > 0 ? absentCount : 0}
          icon={UserX}
          iconClassName="bg-orange-50 text-orange-600"
        />
        {/* <StatsCard
          title="Heures Travaillées"
          value="142h" // Placeholder
          icon={Clock}
          iconClassName="bg-purple-50 text-purple-600"
          trend={{ value: 5, label: "vs hier", positive: true }}
        /> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Links & Live Status */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Accès Rapide
            </h2>
            <QuickLinksGrid role={userProfil?.role} />
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Suivi en Temps Réel
              </h2>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <LiveEmployeeStatus />
            </div>
          </section>
        </div>

        {/* Right Column: Profile & Activity */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
              👋
            </div>
            <h3 className="text-xl font-bold text-gray-900">Bonne journée !</h3>
            <p className="text-gray-500 mt-2 text-sm">
              &quot;Le succès n&apos;est pas la clé du bonheur. Le bonheur est la clé du
              succès.&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
