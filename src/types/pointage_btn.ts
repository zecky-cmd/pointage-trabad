
export interface Pointage {
  id: number
  id_employe: number
  date_pointage: string
  pointage_arrive: string | null
  pointage_pause: string | null
  pointage_reprise: string | null
  pointage_depart: string | null
  retard_minutes: number
  justification_retard: string | null
  statut: "present" | "absent" | "conge" | "weekend"
  created_at: string
  updated_at: string
}

export interface ServerTimeResponse {
  server_time: string
  server_date: string
}

export interface User {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}
