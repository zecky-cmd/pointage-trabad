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
  | "Périphérique";

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
  affecte_a?: number | null; // Changed to number
  image_url?: string;
  password?: string;
  date_affectation?: string;
  date_restitution?: string;
  commentaire?: string;
  created_at?: string;

  // Joins
  employe?: {
    nom_employe: string;
    prenom_employe: string;
    // image_url might not exist on employe table based on my search
  };
}
