export interface Pointage {
  id_pointage: number;
  id_employe: string;
  date_pointage: string;
  pointage_arrive: string | null;
  pointage_depart: string | null;
  pointage_pause: string | null;
  pointage_reprise: string | null;
  retard_minutes: number;
  statut: "present" | "absent" | "conge" | "weekend";
  statut_justification_absence: "en_attente" | "justifiee" | "rejetee" | null;
  statut_justification_retard: "en_attente" | "justifiee" | "rejetee" | null;
  justification_absence: string | null;
  justification_retard: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id_employe: string;
  prenom_employe: string;
  nom_employe: string;
  post_employe: string;
  departement_employe: string;
}

export type PointageWithJustifications = Pointage;

export interface PointageStats {
  totalHeures: string;
  joursPresent: number;
  joursAbsent: number;
  absencesJustifiees: number;
  totalRetard: string;
  retardsSignificatifs: number;
  retardsJustifies: number;
  heuresPayables: string;
  heuresAbsencesNonJustifiees: string;
  retardsJustifiesHeures: string;
  retardsNonJustifiesHeures: string;
}
