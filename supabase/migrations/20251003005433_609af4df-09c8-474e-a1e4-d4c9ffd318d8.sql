-- Passo 1: Remover constraint existente
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_settings_profile_type_check'
  ) THEN
    ALTER TABLE public.user_settings DROP CONSTRAINT user_settings_profile_type_check;
  END IF;
END $$;

-- Passo 2: Atualizar valores antigos para os novos (fazer backup dos valores atuais)
UPDATE public.user_settings SET profile_type = 'faculdade' WHERE profile_type = 'universitario';
UPDATE public.user_settings SET profile_type = 'concurso' WHERE profile_type = 'concurseiro';

-- Passo 3: Adicionar nova constraint
ALTER TABLE public.user_settings
ADD CONSTRAINT user_settings_profile_type_check
CHECK (profile_type IS NULL OR profile_type = ANY (ARRAY['faculdade'::text, 'concurso'::text, 'oab'::text, 'advogado'::text]));