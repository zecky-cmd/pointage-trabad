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

export interface Employee {
  id_employe: number
  prenom_employe: string
  nom_employe: string
  post_employe: string | null
}

export interface PointageWithJustifications extends Pointage {
  justification_absence: string | null
  statut_justification_absence: "en_attente" | "justifiee" | "rejetee" | null
  justification_retard: string | null
  statut_justification_retard: "en_attente" | "justifiee" | "rejetee" | null
}

export interface PointageStats {
  totalHeures: string
  joursPresent: number
  totalRetard: string
  joursAbsent: number
  absencesJustifiees: number
  heuresPayables: string
}
