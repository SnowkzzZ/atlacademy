import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mxbozqcnpurgyvymfycc.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

console.log('\n🔍 DIAGNÓSTICO SUPABASE\n');

// Testa todas as tabelas
const tables = ['courses', 'lessons', 'sectors', 'articles', 'user_progress'];
for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
        console.log(`❌ [${table}] Erro: ${error.message}`);
    } else {
        console.log(`📋 [${table}] Registros: ${data?.length ?? 0}`);
        if (data?.length > 0 && table === 'courses') {
            data.forEach(c => console.log(`   → ${c.title} (ID: ${c.id})`));
        }
        if (data?.length > 0 && table === 'lessons') {
            data.forEach(l => console.log(`   → [courseId: ${l.courseId}] ${l.title}`));
        }
    }
}

// Verifica RLS policies via information_schema
console.log('\n🔒 Verificando RLS...');
const { data: rls, error: rlsErr } = await supabase
    .rpc('get_policies', {})
    .catch(() => ({ data: null, error: { message: 'RPC não disponível' } }));

if (rlsErr) {
    console.log('   RLS check via RPC não disponível — verificando via anon key...');
    const anonClient = createClient(SUPABASE_URL, 'sb_publishable_U8DCUTG6pR5Yjm_TEM2Eqg_rFpXCAs2');
    const { data: anonCourses, error: anonErr } = await anonClient.from('courses').select('count');
    console.log(`   Anon key courses count: ${anonCourses?.[0]?.count ?? 'erro: ' + anonErr?.message}`);
}
