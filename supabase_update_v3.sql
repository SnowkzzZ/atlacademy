-- ============================================================
-- ATL ACADEMY — Script de Atualização do Banco (Versão 3)
-- Adiciona a coluna de ordenação customizada para os Módulos (courses)
-- Cole no SQL Editor do Supabase (https://supabase.com/dashboard) e clique em "Run"
-- ============================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;
