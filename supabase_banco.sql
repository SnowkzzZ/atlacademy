-- ============================================================
-- ATL ACADEMY — Supabase SQL Setup (versão completa)
-- Cole TUDO isso no SQL Editor do Supabase e clique em "Run"
-- ============================================================

-- 1. Tabela de cursos
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  instructor text NOT NULL,
  "instructorTitle" text DEFAULT 'Especialista ATL',
  duration text DEFAULT '00h 00m',
  icon text DEFAULT 'play_circle',
  progress integer DEFAULT 0,
  "videoUrl" text,
  "thumbnailUrl" text,
  "watchedSeconds" integer DEFAULT 0,
  "totalSeconds" integer DEFAULT 0,
  "lastWatchedAt" bigint DEFAULT 0,
  description text,
  tags text[] DEFAULT '{}'
);

-- 2. Tabela de aulas (Cronograma)
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

-- 3. Setores (categorias de artigos)
CREATE TABLE IF NOT EXISTS sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);

-- 4. Artigos do hub de inteligência
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sectorId" uuid REFERENCES sectors(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  author text NOT NULL,
  "createdAt" bigint
);

-- 5. Progresso por usuário (suporta cursos E aulas via course_id)
CREATE TABLE IF NOT EXISTS user_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    course_id text NOT NULL,        -- pode ser ID de curso OU de aula
    watched_seconds float DEFAULT 0,
    progress integer DEFAULT 0,
    last_watched_at bigint DEFAULT 0,
    UNIQUE(user_id, course_id)
);

-- ============================================================
-- RLS: Habilitar segurança em nível de linha
-- ============================================================

-- Courses: leitura pública (anon), escrita apenas autenticados
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "courses_read_public" ON courses;
CREATE POLICY "courses_read_public" ON courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "courses_write_auth" ON courses;
CREATE POLICY "courses_write_auth" ON courses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Lessons: leitura pública (anon), escrita apenas autenticados
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lessons_read_public" ON lessons;
CREATE POLICY "lessons_read_public" ON lessons FOR SELECT USING (true);
DROP POLICY IF EXISTS "lessons_write_auth" ON lessons;
CREATE POLICY "lessons_write_auth" ON lessons FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sectors: leitura pública
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sectors_read_public" ON sectors;
CREATE POLICY "sectors_read_public" ON sectors FOR SELECT USING (true);
DROP POLICY IF EXISTS "sectors_write_auth" ON sectors;
CREATE POLICY "sectors_write_auth" ON sectors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Articles: leitura pública
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "articles_read_public" ON articles;
CREATE POLICY "articles_read_public" ON articles FOR SELECT USING (true);
DROP POLICY IF EXISTS "articles_write_auth" ON articles;
CREATE POLICY "articles_write_auth" ON articles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- user_progress: cada usuário gerencia os próprios dados
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "users_own_progress" ON user_progress;
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

-- ============================================================
-- Se você está ATUALIZANDO um banco existente, rode também:
-- ============================================================
-- ALTER TABLE courses ADD COLUMN IF NOT EXISTS "instructorTitle" text DEFAULT 'Especialista ATL';
-- ALTER TABLE courses ADD COLUMN IF NOT EXISTS description text;
-- ALTER TABLE courses ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
-- ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "totalSeconds" float DEFAULT 0;
