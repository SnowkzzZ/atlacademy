import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://mxbozqcnpurgyvymfycc.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14Ym96cWNucHVyZ3l2eW1meWNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTU0Mzk2NCwiZXhwIjoyMDk3MTE5OTY0fQ.fDV5jIr2RN_EKp2XTsreXz3ts8eD39IJ6sd0JO7hLXw';
const ANON_KEY = 'sb_publishable_U8DCUTG6pR5Yjm_TEM2Eqg_rFpXCAs2';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const DESKTOP_AULAS = 'C:\\Users\\snowk\\OneDrive\\Desktop\\AULAS';

function imgToBase64(filename) {
    const path = join(DESKTOP_AULAS, filename);
    if (!existsSync(path)) { console.log(`   ⚠️  Imagem não encontrada: ${path}`); return ''; }
    const buffer = readFileSync(path);
    const b64 = `data:image/png;base64,${buffer.toString('base64')}`;
    console.log(`   🎨 ${filename}: ${Math.round(b64.length / 1024)} KB`);
    return b64;
}

async function discoverSchema() {
    console.log('\n🔍 Descobrindo schema das tabelas...\n');

    // Tenta inserir um registro mínimo pra ver quais colunas existem
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .limit(1);

    if (error) {
        console.log('❌ Erro ao descobrir schema de courses:', error.message);
        return null;
    }

    if (data && data.length > 0) {
        console.log('✅ Colunas encontradas em courses:', Object.keys(data[0]).join(', '));
        return Object.keys(data[0]);
    }

    // Tabela vazia — tenta descobrir via inserção de teste
    console.log('   Tabela vazia — testando colunas individualmente...');
    
    // Testa colunas conhecidas uma a uma
    const basePayload = {
        title: '__TEST__',
        instructor: 'test',
        duration: '00h 00m',
        icon: 'test',
    };

    const optionalCols = ['subtitle', 'instructorTitle', 'description', 'tags', 'videoUrl',
                          'thumbnailUrl', 'cardTitle', 'cardSubtitle', 'cardIcon', 'cardThumbnail'];

    let workingPayload = { ...basePayload };
    for (const col of optionalCols) {
        const testPayload = { ...workingPayload, [col]: col === 'tags' ? [] : '__test__' };
        const { error: testErr } = await supabase.from('courses').insert([testPayload]).select();
        if (!testErr) {
            workingPayload = testPayload;
        } else if (testErr.message.includes(`Could not find the '${col}'`)) {
            console.log(`   ⚠️  Coluna '${col}' não existe na tabela`);
        }
    }

    // Remove o registro de teste
    await supabase.from('courses').delete().eq('title', '__TEST__');
    
    const cols = Object.keys(workingPayload);
    console.log('✅ Colunas válidas:', cols.join(', '));
    return cols;
}

async function main() {
    console.log('\n🚀 RESTAURAÇÃO — ATL ACADEMY\n');

    // 1. Descobre o schema
    const validCols = await discoverSchema();

    // 2. Prepara payload adaptado ao schema real
    const modulos = [
        { name: 'NEX', icon: 'wifi', imgFile: 'ATL NEX.png', desc: 'Módulo ATL NEX — Conectividade e Inovação.' },
        { name: 'ONMED', icon: 'health_and_safety', imgFile: 'ATL ONMED.png', desc: 'Módulo ATL ONMED — Saúde e Alta Performance.' }
    ];

    const courseIds = {};

    for (const mod of modulos) {
        console.log(`\n📦 Módulo ATL ${mod.name}...`);
        const thumbnail = imgToBase64(mod.imgFile);

        // Payload base garantido
        const payload = {
            title: mod.name,
            instructor: 'ATL Academy',
            duration: '00h 00m',
            icon: mod.icon,
        };

        // Adiciona campos opcionais se existirem no schema
        const optFields = {
            subtitle: 'ATL',
            instructorTitle: 'Especialista ATL',
            description: mod.desc,
            tags: ['ATL', mod.name],
            thumbnailUrl: thumbnail,
            cardTitle: mod.name,
            cardSubtitle: 'ATL',
            cardThumbnail: thumbnail,
        };

        if (validCols) {
            for (const [key, val] of Object.entries(optFields)) {
                if (validCols.includes(key)) payload[key] = val;
            }
        } else {
            // Schema desconhecido — tenta com todos os campos
            Object.assign(payload, optFields);
        }

        // Verifica se já existe
        const { data: existing } = await supabase.from('courses').select('id').eq('title', mod.name).maybeSingle();

        if (existing) {
            console.log(`   ♻️  Atualizando (ID: ${existing.id})...`);
            const { error } = await supabase.from('courses').update(payload).eq('id', existing.id);
            if (error) console.error('   ❌ Erro:', error.message);
            else { console.log('   ✅ Atualizado!'); courseIds[mod.name] = existing.id; }
        } else {
            console.log('   ➕ Criando novo...');
            const { data, error } = await supabase.from('courses').insert([payload]).select('id').single();
            if (error) console.error('   ❌ Erro:', error.message);
            else { console.log(`   ✅ Criado! (ID: ${data.id})`); courseIds[mod.name] = data.id; }
        }
    }

    // 3. Verifica acesso anônimo
    console.log('\n🔓 Verificando acesso anônimo...');
    const anonClient = createClient(SUPABASE_URL, ANON_KEY);
    const { data: anonData, error: anonErr } = await anonClient.from('courses').select('id, title');
    
    if (!anonErr && anonData && anonData.length > 0) {
        console.log(`   ✅ Anon key OK — ${anonData.length} curso(s) visíveis`);
        anonData.forEach(c => console.log(`      → ${c.title} (${c.id})`));
    } else {
        console.log('   ❌ Anon key bloqueada por RLS');
        console.log('\n========================================');
        console.log('⚡ AÇÃO NECESSÁRIA — Execute no Supabase:');
        console.log('========================================');
        console.log('URL: https://supabase.com/dashboard/project/mxbozqcnpurgyvymfycc/sql/new');
        console.log('\nSQL a executar:');
        console.log('--');
        console.log('ALTER TABLE courses  DISABLE ROW LEVEL SECURITY;');
        console.log('ALTER TABLE lessons  DISABLE ROW LEVEL SECURITY;');
        console.log('ALTER TABLE sectors  DISABLE ROW LEVEL SECURITY;');
        console.log('ALTER TABLE articles DISABLE ROW LEVEL SECURITY;');
        console.log('--');
        console.log('\nApós executar, recarregue o app — os dados voltarão automaticamente.');
    }

    // 4. Estado final
    const { data: allCourses } = await supabase.from('courses').select('id, title');
    const { data: allLessons } = await supabase.from('lessons').select('id, title, courseId');
    
    console.log('\n📊 ESTADO ATUAL DO BANCO:');
    console.log(`   Cursos: ${allCourses?.length ?? 0}`);
    allCourses?.forEach(c => console.log(`      → ${c.title} (${c.id})`));
    console.log(`   Aulas: ${allLessons?.length ?? 0}`);
    if (allLessons?.length > 0) allLessons.forEach(l => console.log(`      → [${l.courseId?.substring(0,8)}] ${l.title}`));
    else console.log('      → Nenhuma aula no banco. Adicione via Admin ou aulas.txt.');
    console.log('');
}

main().catch(err => console.error('❌ Erro fatal:', err));
