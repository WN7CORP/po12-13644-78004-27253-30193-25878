-- Criar tabela simples para registros de usuários
CREATE TABLE IF NOT EXISTS public.user_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  telefone TEXT NOT NULL,
  area TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_registrations ENABLE ROW LEVEL SECURITY;

-- Permitir inserção pública (qualquer um pode se registrar)
CREATE POLICY "Permitir registro público" 
ON public.user_registrations 
FOR INSERT 
WITH CHECK (true);

-- Permitir leitura pública
CREATE POLICY "Permitir leitura pública" 
ON public.user_registrations 
FOR SELECT 
USING (true);