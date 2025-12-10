-- Add columns to track who made the change
ALTER TABLE public.equipement_historique 
ADD COLUMN IF NOT EXISTS cree_par uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS auteur text;
