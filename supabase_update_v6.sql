-- ============================================================
-- ATL ACADEMY — Script de Atualização do Banco (Versão 6)
-- Adiciona a coluna 'subtitle' e 'thumbnailUrl' na tabela de artigos (articles)
-- Cole no SQL Editor do Supabase (https://supabase.com/dashboard) e clique em "Run"
-- ============================================================

ALTER TABLE articles ADD COLUMN IF NOT EXISTS subtitle text DEFAULT '';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS "thumbnailUrl" text DEFAULT '';
