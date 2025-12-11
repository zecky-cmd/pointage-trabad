"use client";

import type { Pointage } from "@/types/pointage_btn";
import { cn } from "@/lib/utils";

import { Card } from "@/components/ui/card";

interface PointageButtonProps {
  type: "arrive" | "pause" | "reprise" | "depart";
  label: string;
  icon: string;
  heurePointee: string | null | undefined;
  serverTime: string;
  pointageJour: Pointage | null;
  onPointer: (type: "arrive" | "pause" | "reprise" | "depart") => Promise<void>;
}

interface ButtonState {
  disabled: boolean;
  variant: "default" | "secondary" | "destructive" | "outline" | "ghost";
  className: string;
  text: string;
  time: string;
  canClick: boolean;
}

export default function PointageButton({
  type,
  label,
  icon,
  heurePointee,
  serverTime,
  pointageJour,
  onPointer,
}: PointageButtonProps) {
  const getButtonState = (): ButtonState => {
    // Si déjà pointé
    if (heurePointee !== undefined && heurePointee !== null) {
      return {
        disabled: true,
        variant: "outline",
        className: "bg-green-50 border-green-200 text-green-900 opacity-100",
        text: "✅ Pointé",
        time: heurePointee,
        canClick: false,
      };
    }

    switch (type) {
      case "arrive":
        if (serverTime < "06:00:00") {
          return {
            disabled: true,
            variant: "outline",
            className: "bg-gray-100 text-gray-400 opacity-50",
            text: "🔒 06h00",
            time: "--:--",
            canClick: false,
          };
        }
        return {
          disabled: false,
          variant: "default",
          className:
            "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-1",
          text: "Disponible",
          time: "Maintenant",
          canClick: true,
        };

      case "pause":
        if (!pointageJour?.pointage_arrive) {
          return {
            disabled: true,
            variant: "outline",
            className: "bg-gray-100 text-gray-400 opacity-50",
            text: "En attente",
            time: "--:--",
            canClick: false,
          };
        }
        if (pointageJour?.pointage_depart) {
          return {
            disabled: true,
            variant: "outline",
            className: "bg-gray-100 text-gray-400 opacity-50",
            text: "Terminé",
            time: "--:--",
            canClick: false,
          };
        }
        if (serverTime < "12:30:00") {
          return {
            disabled: true,
            variant: "outline",
            className: "bg-gray-100 text-gray-500 opacity-75",
            text: "🔒 12h30",
            time: "--:--",
            canClick: false,
          };
        }
        return {
          disabled: false,
          variant: "default",
          className:
            "bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-1",
          text: "Disponible",
          time: "Maintenant",
          canClick: true,
        };

      case "reprise":
        if (!pointageJour?.pointage_pause) {
          return {
            disabled: true,
            variant: "outline",
            className: "bg-gray-100 text-gray-400 opacity-50",
            text: "En attente",
            time: "--:--",
            canClick: false,
          };
        }
        return {
          disabled: false,
          variant: "default",
          className:
            "bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-1",
          text: "Disponible",
          time: "Maintenant",
          canClick: true,
        };

      case "depart":
        if (!pointageJour?.pointage_arrive) {
          return {
            disabled: true,
            variant: "outline",
            className: "bg-gray-100 text-gray-400 opacity-50",
            text: "En attente",
            time: "--:--",
            canClick: false,
          };
        }
        if (serverTime < "17:30:00") {
          return {
            disabled: true,
            variant: "outline",
            className: "bg-gray-100 text-gray-500 opacity-75",
            text: "🔒 17h30",
            time: "--:--",
            canClick: false,
          };
        }
        return {
          disabled: false,
          variant: "destructive",
          className:
            "shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-1",
          text: "Disponible",
          time: "Maintenant",
          canClick: true,
        };

      default:
        return {
          disabled: true,
          variant: "outline",
          className: "opacity-50",
          text: "Inactif",
          time: "--:--",
          canClick: false,
        };
    }
  };

  const state = getButtonState();

  const handleClick = async (): Promise<void> => {
    if (state.canClick) {
      try {
        await onPointer(type);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Erreur pointage:", error.message);
        }
      }
    }
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        state.canClick
          ? "hover:border-primary/50"
          : "border-gray-200 bg-gray-50",
        state.className
      )}
    >
      <button
        onClick={handleClick}
        disabled={!state.canClick}
        className="w-full h-full p-6 flex flex-col items-center justify-center gap-4 text-center min-h-[160px]"
        type="button"
        aria-label={`Pointer ${label}`}
      >
        <div
          className={cn(
            "text-4xl transition-transform duration-200",
            state.canClick && "scale-110"
          )}
        >
          {icon}
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-lg leading-none">{label}</h3>
          <p className="text-xs font-medium uppercase tracking-wider opacity-90">
            {state.text}
          </p>
        </div>

        {state.time !== "--:--" && state.time !== "Maintenant" && (
          <div className="absolute bottom-4 left-0 right-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm">
              {state.time}
            </span>
          </div>
        )}
      </button>
    </Card>
  );
}
