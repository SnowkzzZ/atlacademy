-- ============================================================
-- ATL ACADEMY: Habilitação de Sincronia para Admin Master
-- Execute este script no SQL Editor do Supabase para permitir 
-- que o acesso direto sincronize entre PC e Celular.
-- ============================================================

-- 1. Remover políticas antigas de progresso para evitar conflitos
DROP POLICY IF EXISTS "progress_select" ON user_progress;
DROP POLICY IF EXISTS "progress_insert" ON user_progress;
DROP POLICY IF EXISTS "progress_update" ON user_progress;
DROP POLICY IF EXISTS "progress_delete" ON user_progress;

-- 2. Nova Política de Leitura: Usuário próprio OU Admin Master
CREATE POLICY "progress_select" ON user_progress
    FOR SELECT USING (
        user_id = auth.uid()::text OR 
        user_id = 'admin-master'
    );

-- 3. Nova Política de Inserção: Usuário próprio OU Admin Master
CREATE POLICY "progress_insert" ON user_progress
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text OR 
        user_id = 'admin-master'
    );

-- 4. Nova Política de Atualização: Usuário próprio OU Admin Master
CREATE POLICY "progress_update" ON user_progress
    FOR UPDATE USING (
        user_id = auth.uid()::text OR 
        user_id = 'admin-master'
    ) WITH CHECK (
        user_id = auth.uid()::text OR 
        user_id = 'admin-master'
    );

-- 5. Nova Política de Deleção: Usuário próprio OU Admin Master
CREATE POLICY "progress_delete" ON user_progress
    FOR DELETE USING (
        user_id = auth.uid()::text OR 
        user_id = 'admin-master'
    );

-- Log de confirmação
COMMENT ON TABLE user_progress IS 'Sincronia Master Habilitada';
