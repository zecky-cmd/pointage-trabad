
import type { User } from '@supabase/supabase-js'

export interface Pointage {
  id_pointage: number
  id_employe: number
  date_pointage: string
  pointage_arrive: string | null
  pointage_depart: string | null
  pointage_pause: string | null
  pointage_reprise: string | null
  retard_minutes: number
  statut: "present" | "absent" | "weekend"
  justification_absence: string | null
  justification_retard: string | null
  statut_justification_absence: "en_attente" | "justifiee" | "rejetee" | null
  statut_justification_retard: "en_attente" | "justifiee" | "rejetee" | null
  created_at: string
  updated_at?: string
  est_weekend: boolean
  est_ferie: boolean
  employe?: User
}

export interface ProfilUtilisateur {
  id_profil: string
  id_employe: number
}

export interface ServerTimeData {
  server_time: string
  server_date: string
}
