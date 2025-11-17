
"use client"

import type { Pointage } from "@/types/pointage"


interface PointageButtonProps {
  type: "arrive" | "pause" | "reprise" | "depart"
  label: string
  icon: string
  heurePointee: string | undefined
  serverTime: string
  pointageJour: Pointage | null
  onPointer: (type: "arrive" | "pause" | "reprise" | "depart") => Promise<void>
}

interface ButtonState {
  disabled: boolean
  style: string
  text: string
  time: string
  canClick: boolean
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
    if (heurePointee) {
      return {
        disabled: true,
        style: "bg-green-100 border-green-300 cursor-not-allowed",
        text: "✅ Pointé",
        time: heurePointee,
        canClick: false,
      }
    }

    switch (type) {
      case "arrive":
        if (serverTime < "06:00:00") {
          return {
            disabled: true,
            style: "bg-gray-100 border-gray-300 cursor-not-allowed",
            text: "🔒 Verrouillé",
            time: "Disponible à 6h00",
            canClick: false,
          }
        }
        return {
          disabled: false,
          style: "bg-blue-50 border-blue-300 hover:bg-blue-100 cursor-pointer",
          text: "🟢 Disponible",
          time: "Cliquez pour pointer",
          canClick: true,
        }

      case "pause":
        if (!pointageJour?.pointage_arrive) {
          return {
            disabled: true,
            style: "bg-gray-100 border-gray-300 cursor-not-allowed",
            text: "⏸ Inactif",
            time: "Pointez l'arrivée d'abord",
            canClick: false,
          }
        }
        if (pointageJour?.pointage_depart) {
          return {
            disabled: true,
            style: "bg-gray-100 border-gray-300 cursor-not-allowed",
            text: "🔒 Verrouillé",
            time: "Départ déjà pointé",
            canClick: false,
          }
        }
        if (serverTime < "12:30:00") {
          return {
            disabled: true,
            style: "bg-gray-100 border-gray-300 cursor-not-allowed",
            text: "🔒 Verrouillé",
            time: "Disponible à 12h30",
            canClick: false,
          }
        }
        return {
          disabled: false,
          style: "bg-orange-50 border-orange-300 hover:bg-orange-100 cursor-pointer",
          text: "🟢 Disponible",
          time: "Cliquez pour pointer",
          canClick: true,
        }

      case "reprise":
        if (!pointageJour?.pointage_pause) {
          return {
            disabled: true,
            style: "bg-gray-100 border-gray-300 cursor-not-allowed",
            text: "⏸ Inactif",
            time: "Pointez la pause d'abord",
            canClick: false,
          }
        }
        return {
          disabled: false,
          style: "bg-purple-50 border-purple-300 hover:bg-purple-100 cursor-pointer",
          text: "🟢 Disponible",
          time: "Cliquez pour pointer",
          canClick: true,
        }

      case "depart":
        if (!pointageJour?.pointage_arrive) {
          return {
            disabled: true,
            style: "bg-gray-100 border-gray-300 cursor-not-allowed",
            text: "⏸ Inactif",
            time: "Pointez l'arrivée d'abord",
            canClick: false,
          }
        }
        if (serverTime < "17:30:00") {
          return {
            disabled: true,
            style: "bg-gray-100 border-gray-300 cursor-not-allowed",
            text: "🔒 Verrouillé",
            time: "Disponible à 17h30",
            canClick: false,
          }
        }
        return {
          disabled: false,
          style: "bg-red-50 border-red-300 hover:bg-red-100 cursor-pointer",
          text: "🟢 Disponible",
          time: "Cliquez pour pointer",
          canClick: true,
        }

      default:
        return {
          disabled: true,
          style: "bg-gray-100 border-gray-300 cursor-not-allowed",
          text: "Inactif",
          time: "",
          canClick: false,
        }
    }
  }

  const state = getButtonState()

  const handleClick = async (): Promise<void> => {
    if (state.canClick) {
      try {
        await onPointer(type)
      } catch (error) {
        if (error instanceof Error) {
          console.error('Erreur pointage:', error.message)
        }
      }
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={!state.canClick}
      className={`w-full p-4 border-2 rounded-lg transition-all ${state.style}`}
      type="button"
      aria-label={`Pointer ${label}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl" aria-hidden="true">{icon}</span>
          <div className="text-left">
            <p className="font-semibold text-gray-900">{label}</p>
            <p className="text-sm text-gray-600">{state.text}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-mono font-bold ${heurePointee ? "text-green-600" : "text-gray-500"}`}>
            {state.time}
          </p>
        </div>
      </div>
    </button>
  )
}
