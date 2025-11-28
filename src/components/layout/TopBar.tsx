"use client";

import { Search, Bell, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface TopBarProps {
  user?: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  } | null;
  role?: string;
  onMenuClick: () => void;
}

export default function TopBar({ user, role, onMenuClick }: TopBarProps) {
  const [notificationCount, setNotificationCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    // Only fetch notifications for admin/rh
    if (role === "admin" || role === "rh") {
      const fetchNotifications = async () => {
        const { count } = await supabase
          .from("justification")
          .select("*", { count: "exact", head: true })
          .eq("statut_justification", "en_attente");

        setNotificationCount(count || 0);
      };

      fetchNotifications();
    }
  }, [role, supabase]);

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <div className="relative">
          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors relative">
            <Bell className="w-6 h-6" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
            )}
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900">
              {user?.user_metadata?.full_name ||
                user?.email?.split("@")[0] ||
                "Utilisateur"}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {role || "Employé"}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold border-2 border-white shadow-md">
            {user?.user_metadata?.full_name?.charAt(0) ||
              user?.email?.charAt(0).toUpperCase() ||
              "U"}
          </div>
        </div>
      </div>
    </header>
  );
}
