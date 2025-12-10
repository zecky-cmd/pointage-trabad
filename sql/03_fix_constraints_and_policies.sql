-- 1. Fix "Téléphone" creation issue
-- Check if we need to update a text constraint or enum
DO $$
BEGIN
    -- Try to add to enum if it exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrdinateurType') THEN
        ALTER TYPE "OrdinateurType" ADD VALUE IF NOT EXISTS 'Téléphone';
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Update text check constraint if it exists
ALTER TABLE public.ordinateurs DROP CONSTRAINT IF EXISTS ordinateurs_type_check;
-- Re-add constraint with all types including Téléphone
ALTER TABLE public.ordinateurs ADD CONSTRAINT ordinateurs_type_check 
  CHECK (type IN ('Portable', 'Fixe', 'Tablette', 'Serveur', 'Périphérique', 'Téléphone'));

-- 2. Fix "Cannot Delete" issue
-- Add DELETE policy for equipement_historique to allow cascading deletes (and manual deletes)
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.equipement_historique;
CREATE POLICY "Enable delete access for all users" ON public.equipement_historique
  FOR DELETE USING (true);
