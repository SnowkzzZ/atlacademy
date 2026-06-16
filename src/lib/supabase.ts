import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || '';

// Cliente normal (anon key) — para leitura e autenticação de usuário
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin (service role key) — bypassa RLS para operações de escrita (admin panel)
// Usado apenas para addCourse, addLesson, updateCourse, etc.
export const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
    : supabase; // Fallback para o cliente anon se a chave não estiver disponível

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
