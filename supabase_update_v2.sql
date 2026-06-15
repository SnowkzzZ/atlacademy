-- ============================================================
-- ATL ACADEMY — Script de Atualização do Banco de Dados
-- Adiciona coluna last_position que estava faltando
-- Cole no SQL Editor do Supabase e clique em "Run"
-- ============================================================

-- 1. Adicionar coluna last_position na tabela user_progress (se não existir)
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS last_position float DEFAULT 0;

-- 2. Adicionar colunas subtitle, cardTitle, cardSubtitle, cardIcon, cardThumbnail nos courses (se não existirem)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS subtitle text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "cardTitle" text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "cardSubtitle" text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "cardIcon" text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "cardThumbnail" text DEFAULT '';

-- 3. Verificar se as políticas de progresso estão corretas para usuários autenticados normais
-- (Usuários criados por integração externa via Supabase Auth)
-- As políticas abaixo garantem que usuários da plataforma integrada também têm acesso

-- Remover políticas existentes e recriar com segurança
DROP POLICY IF EXISTS "progress_select" ON user_progress;
DROP POLICY IF EXISTS "progress_insert" ON user_progress;
DROP POLICY IF EXISTS "progress_update" ON user_progress;
DROP POLICY IF EXISTS "progress_delete" ON user_progress;

-- Política de leitura: usuário vê apenas o próprio progresso
CREATE POLICY "progress_select" ON user_progress
    FOR SELECT TO authenticated
    USING (user_id = auth.uid()::text);

-- Política de inserção: usuário insere apenas com seu próprio user_id
CREATE POLICY "progress_insert" ON user_progress
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid()::text);

-- Política de atualização: usuário atualiza apenas o próprio progresso
CREATE POLICY "progress_update" ON user_progress
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- Política de deleção: usuário deleta apenas o próprio progresso
CREATE POLICY "progress_delete" ON user_progress
    FOR DELETE TO authenticated
    USING (user_id = auth.uid()::text);

-- 4. Garantir que cursos e aulas são legíveis por todos (inclusive anon)
-- (necessário para integração externa, onde usuários podem ser autenticados via outro provider)
DROP POLICY IF EXISTS "courses_read_public" ON courses;
CREATE POLICY "courses_read_public" ON courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "lessons_read_public" ON lessons;
CREATE POLICY "lessons_read_public" ON lessons FOR SELECT USING (true);

DROP POLICY IF EXISTS "sectors_read_public" ON sectors;
CREATE POLICY "sectors_read_public" ON sectors FOR SELECT USING (true);

DROP POLICY IF EXISTS "articles_read_public" ON articles;
CREATE POLICY "articles_read_public" ON articles FOR SELECT USING (true);

-- ============================================================
-- NOTA SOBRE INTEGRAÇÃO EXTERNA:
-- Usuários criados pela plataforma parceira devem ser criados
-- via Supabase Auth (supabase.auth.admin.createUser) com os
-- mesmos email/senha. Quando o usuário fizer login na ATL Academy,
-- o Supabase Auth vai autenticá-los normalmente e o progresso
-- será salvo vinculado ao auth.uid() deles.
-- ============================================================
