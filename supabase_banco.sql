-- SQL PARA CRIAR O BANCO DA ATL ACADEMY NO SUPABASE
-- Cole isso e clique em "Run" (Executar) no painel SQL Editor do Supabase

CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  instructor text NOT NULL,
  duration text,
  icon text,
  progress integer DEFAULT 0,
  "videoUrl" text,
  "thumbnailUrl" text,
  "watchedSeconds" integer DEFAULT 0,
  "totalSeconds" integer DEFAULT 0,
  "lastWatchedAt" bigint DEFAULT 0
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
