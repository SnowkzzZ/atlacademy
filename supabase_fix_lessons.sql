-- ============================================================
-- ATL ACADEMY — Fix: Criar tabela lessons + user_progress
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- ── 1. Criar tabela lessons (se não existir) ───────────────
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "courseId" uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  "videoUrl" text,
  "thumbnailUrl" text,
  duration text DEFAULT '00h 00m',
  "totalSeconds" float DEFAULT 0,
  position integer DEFAULT 0
);

-- ── 2. Habilitar RLS para lessons ─────────────────────────
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lessons_read_public" ON lessons;
CREATE POLICY "lessons_read_public" ON lessons FOR SELECT USING (true);
DROP POLICY IF EXISTS "lessons_write_auth" ON lessons;
CREATE POLICY "lessons_write_auth" ON lessons FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 3. Criar tabela user_progress (se não existir) ────────
CREATE TABLE IF NOT EXISTS user_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    course_id text NOT NULL,
    watched_seconds float DEFAULT 0,
    progress integer DEFAULT 0,
    last_watched_at bigint DEFAULT 0,
    UNIQUE(user_id, course_id)
);

-- ── 4. Habilitar RLS para user_progress ───────────────────
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_progress" ON user_progress;
DROP POLICY IF EXISTS "progress_select" ON user_progress;
DROP POLICY IF EXISTS "progress_insert" ON user_progress;
DROP POLICY IF EXISTS "progress_update" ON user_progress;
DROP POLICY IF EXISTS "progress_delete" ON user_progress;

CREATE POLICY "progress_select" ON user_progress
    FOR SELECT TO authenticated
    USING (user_id = auth.uid()::text);

CREATE POLICY "progress_insert" ON user_progress
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "progress_update" ON user_progress
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "progress_delete" ON user_progress
    FOR DELETE TO authenticated
    USING (user_id = auth.uid()::text);

-- ── 5. Inserir aula de amostra para teste ──────────────────
-- Nota: use o ID correto do curso 'Modernização de Sistemas Estruturais' (veja sua tabela courses)
-- Exemplo: 00000000-0000-0000-0000-000000000001
INSERT INTO lessons ("courseId", title, "videoUrl", "thumbnailUrl", duration, "totalSeconds", position)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'Introdução aos Sistemas Estruturais', 
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 
    'https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg', 
    '10:33', 
    633, 
    0
) ON CONFLICT (id) DO NOTHING;

-- ── 6. Verificação: confirmar tabelas criadas ──────────────
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('courses', 'lessons', 'user_progress', 'sectors', 'articles')
ORDER BY table_name;
