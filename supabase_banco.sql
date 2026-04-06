-- SQL PARA CRIAR O BANCO DA ATL ACADEMY NO SUPABASE
-- Cole isso e clique em "Run" (Executar) no painel SQL Editor do Supabase

CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  instructor text NOT NULL,
  "instructorTitle" text DEFAULT 'Especialista ATL',
  duration text,
  icon text,
  progress integer DEFAULT 0,
  "videoUrl" text,
  "thumbnailUrl" text,
  "watchedSeconds" integer DEFAULT 0,
  "totalSeconds" integer DEFAULT 0,
  "lastWatchedAt" bigint DEFAULT 0,
  description text,
  tags text[] DEFAULT '{}'
);

CREATE TABLE sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);

CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sectorId" uuid REFERENCES sectors(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  author text NOT NULL,
  "createdAt" bigint
);

-- If UPGRADING an existing database, run these ALTER TABLE statements:
-- ALTER TABLE courses ADD COLUMN IF NOT EXISTS "instructorTitle" text DEFAULT 'Especialista ATL';
-- ALTER TABLE courses ADD COLUMN IF NOT EXISTS description text;
-- ALTER TABLE courses ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Tabela de aulas (Cronograma)
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

-- Per-user progress table (create this if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    course_id text NOT NULL,
    watched_seconds float DEFAULT 0,
    progress integer DEFAULT 0,
    last_watched_at bigint DEFAULT 0,
    UNIQUE(user_id, course_id)
);

-- Allow authenticated users to manage their own progress rows
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_progress" ON user_progress
    FOR ALL TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

