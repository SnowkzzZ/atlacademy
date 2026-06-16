-- ============================================================
-- ATL ACADEMY — Script de Atualização do Banco (Versão 4)
-- Adiciona a coluna 'module' na tabela de aulas (lessons)
-- Adiciona também todas as colunas de customização de card caso não existam
-- Cole no SQL Editor do Supabase (https://supabase.com/dashboard) e clique em "Run"
-- ============================================================

-- 1. Garantir que as colunas de customização de card e posição existam nos cursos
ALTER TABLE courses ADD COLUMN IF NOT EXISTS subtitle text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "cardTitle" text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "cardSubtitle" text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "cardIcon" text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "cardThumbnail" text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- 2. Adicionar a coluna de agrupamento de módulos/capítulos nas aulas
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS module text DEFAULT '';
