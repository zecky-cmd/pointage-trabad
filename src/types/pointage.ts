export interface Employee {
  id_employe: number
  prenom_employe: string
  nom_employe: string
  post_employe: string
}

export interface ProfilUtilisateur {
  id_profil: string
  id_employe: number
  employe: Employee | null
}

export interface EmployeeProfile {
  id_profil: string
  role: "admin" | "rh" | "employee"
  id_employe: number
  employe?: Employee
}

// typage des pointages journalière 


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
  employe?: Employee
}

export interface PointageWithEmployee extends Pointage {
  employe: Employee
}

export interface StatsData {
  totalHeures: string
  joursPresent: number
  joursAbsent: number
  absencesJustifiees: number
  totalRetard: string
  retardsSignificatifs: number
  heuresPayables: string
  heuresAbsencesNonJustifiees: string
}

export type JustificationStatus = "en_attente" | "justifiee" | "rejetee"
export type JustificationType = "retard" | "absence"


