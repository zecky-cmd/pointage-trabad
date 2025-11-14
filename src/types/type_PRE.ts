
// Types for Pointage (Attendance Tracking)

export type JustificationStatus = 'justifiee' | 'rejetee' | 'en_attente' | null;
export type PointageStatut = 'present' | 'absent' | 'weekend';

export interface Pointage {
  id_pointage: string | number;
  date_pointage: string;
  pointage_arrive: string | null;
  pointage_pause: string | null;
  pointage_reprise: string | null;
  pointage_depart: string | null;
  justification_absence: string | null;
  justification_retard: string | null;
  statut_justification_absence: JustificationStatus;
  statut_justification_retard: JustificationStatus;
  statut: PointageStatut;
  retard_minutes: number;
}

export interface PointageFormData {
  pointage_arrive: string;
  pointage_pause: string;
  pointage_reprise: string;
  pointage_depart: string;
  justification_absence: string;
  justification_retard: string;
  statut_justification_absence: JustificationStatus;
  statut_justification_retard: JustificationStatus;
}

export interface ApiErrorResponse {
  error: string;
}
