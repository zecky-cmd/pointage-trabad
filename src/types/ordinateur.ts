export type OrdinateurEtat =
  | "Fonctionnel"
  | "En panne"
  | "En réparation"
  | "Hors service";
export type OrdinateurType =
  | "Portable"
  | "Fixe"
  | "Tablette"
  | "Serveur"
  | "Périphérique"
  | "Téléphone";

export interface EquipementHistorique {
  id: number;
  id_ordinateur: string;
  id_employe: number | null;
  date_debut: string;
  date_fin: string | null;
  type_action: string;
  commentaire: string | null;
  created_at: string;
  cree_par?: string | null;
  auteur?: string | null;
  employe?: {
    nom_employe: string;
    prenom_employe: string;
    email_employe?: string;
  };
}

export interface Ordinateur {
  id_ordinateur: string;
  code_inventaire: string;
  marque: string;
  modele: string;
  numero_serie: string;
  type: OrdinateurType;
  date_acquisition?: string;
  etat: OrdinateurEtat;
  os?: string;
  processeur?: string;
  ram?: string;
  disque_dur?: string;
  affecte_a?: number | null;
  image_url?: string;
  password?: string;
  date_affectation?: string;
  date_restitution?: string;
  commentaire?: string;
  created_at?: string;

  // Joins
  employe?: {
    id_employe?: number; // Added to match usage in code
    nom_employe: string;
    prenom_employe: string;
  };
}
