-- ============================================================
-- ATL ACADEMY — Script de Atualização do Banco (Versão 5)
-- Adiciona a coluna 'sectorId' na tabela de cursos (courses)
-- Cole no SQL Editor do Supabase (https://supabase.com/dashboard) e clique em "Run"
-- ============================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS "sectorId" uuid REFERENCES sectors(id) ON DELETE SET NULL;
