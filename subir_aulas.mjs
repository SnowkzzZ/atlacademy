import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = 'https://mxbozqcnpurgyvymfycc.supabase.co';
// Usando a chave de serviço (Service Role Key) para ignorar RLS e ter permissão total de escrita
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const DESKTOP_AULAS = 'C:\\Users\\snowk\\OneDrive\\Desktop\\AULAS';
const AULAS_TXT = join(DESKTOP_AULAS, 'aulas.txt');

// Criar um template de aulas.txt se não existir
if (!existsSync(AULAS_TXT)) {
    writeFileSync(AULAS_TXT, 
`# Cole as suas aulas aqui no formato: Módulo | Título da Aula | Link do YouTube
# Exemplo:
# NEX | Aula 01: Boas-vindas | https://www.youtube.com/watch?v=aqz-KE-bpKQ
# ONMED | Aula 01: Introdução à Medicina | https://www.youtube.com/watch?v=aqz-KE-bpKQ
`, 'utf-8');
}

async function main() {
    console.log('\n🚀 AUTOMACÃO DE UPLOAD — ATL ACADEMY\n');
    
    if (!SUPABASE_SERVICE_KEY) {
        console.error('❌ ERRO: A chave SUPABASE_SERVICE_ROLE_KEY não foi encontrada.');
        console.log('\nPor favor, defina a chave rodando o comando com a chave de serviço do seu Supabase.');
        console.log('Exemplo no PowerShell:');
        console.log('  $env:SUPABASE_SERVICE_ROLE_KEY="sua_chave_service_role_aqui"');
        console.log('  node subir_aulas.mjs\n');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false }
    });

    // 1. Criar ou Atualizar os Módulos (NEX e ONMED)
    const modulosParaCriar = [
        { title: 'NEX', icon: 'wifi', file: 'ATL NEX.png', desc: 'Módulo ATL NEX — Conectividade e Inovação.' },
        { title: 'ONMED', icon: 'health_and_safety', file: 'ATL ONMED.png', desc: 'Módulo ATL ONMED — Saúde e Alta Performance.' }
    ];

    const courseIds = {};

    for (const mod of modulosParaCriar) {
        console.log(`📦 Verificando módulo ATL ${mod.title}...`);
        
        let base64Capa = '';
        const capapath = join(DESKTOP_AULAS, mod.file);
        if (existsSync(capapath)) {
            const buffer = readFileSync(capapath);
            base64Capa = `data:image/png;base64,${buffer.toString('base64')}`;
            console.log(`   🎨 Capa carregada com sucesso (${Math.round(base64Capa.length / 1024)} KB)`);
        } else {
            console.log(`   ⚠️ Capa não encontrada em: ${capapath}`);
        }

        // Procura se o curso já existe
        const { data: existing } = await supabase
            .from('courses')
            .select('id')
            .eq('title', mod.title)
            .maybeSingle();

        // Montamos o payload tentando incluir os campos adicionais de capa, se der erro de coluna tentamos o básico
        let courseId = '';
        const payloadBase = {
            title: mod.title,
            subtitle: 'ATL',
            instructor: 'ATL Academy',
            instructorTitle: 'Especialista ATL',
            duration: '00h 00m',
            icon: mod.icon,
            description: mod.desc,
            tags: ['ATL', mod.title]
        };

        if (existing) {
            courseId = existing.id;
            console.log(`   Módulo ATL ${mod.title} já existe (ID: ${courseId}). Atualizando dados...`);
            
            // Tenta atualizar incluindo a capa em cardThumbnail e thumbnailUrl
            let { error } = await supabase.from('courses').update({
                ...payloadBase,
                thumbnailUrl: base64Capa,
                cardThumbnail: base64Capa,
                cardTitle: mod.title,
                cardSubtitle: 'ATL'
            }).eq('id', courseId);

            if (error && error.message.includes('cardSubtitle')) {
                // Se as colunas customizadas não existirem na tabela, atualiza apenas as básicas
                console.log('   ⚠️ Colunas estendidas não encontradas. Salvando no formato padrão...');
                const { error: err2 } = await supabase.from('courses').update({
                    ...payloadBase,
                    thumbnailUrl: base64Capa
                }).eq('id', courseId);
                if (err2) console.error('   ❌ Erro ao atualizar:', err2.message);
            }
        } else {
            console.log(`   Módulo ATL ${mod.title} não existe. Criando novo...`);
            
            let data, error;
            // Tenta criar com todas as colunas
            ({ data, error } = await supabase.from('courses').insert([{
                ...payloadBase,
                thumbnailUrl: base64Capa,
                cardThumbnail: base64Capa,
                cardTitle: mod.title,
                cardSubtitle: 'ATL'
            }]).select().maybeSingle());

            if (error && error.message.includes('cardSubtitle')) {
                console.log('   ⚠️ Colunas estendidas não encontradas. Criando no formato padrão...');
                ({ data, error } = await supabase.from('courses').insert([{
                    ...payloadBase,
                    thumbnailUrl: base64Capa
                }]).select().maybeSingle());
            }

            if (error) {
                console.error('   ❌ Erro ao criar módulo:', error.message);
                continue;
            }
            courseId = data.id;
            console.log(`   ✅ Módulo criado com sucesso (ID: ${courseId})`);
        }

        courseIds[mod.title] = courseId;
    }

    // 2. Processar o arquivo aulas.txt
    if (!existsSync(AULAS_TXT)) {
        console.log(`\n📝 Criamos um arquivo de exemplo em: ${AULAS_TXT}`);
        console.log('Por favor, edite esse arquivo colocando a lista das suas aulas e execute novamente.');
        return;
    }

    const content = readFileSync(AULAS_TXT, 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

    if (lines.length === 0) {
        console.log('\n📭 Nenhuma aula encontrada para subir no arquivo aulas.txt.');
        return;
    }

    console.log(`\n📖 Lendo aulas do arquivo (${lines.length} encontradas)...`);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split('|').map(p => p.trim());
        
        if (parts.length < 3) {
            console.log(`   ⚠️ Linha inválida (pulada): ${line}`);
            continue;
        }

        const modName = parts[0].toUpperCase();
        const aulaTitle = parts[1];
        const videoUrl = parts[2];

        const courseId = courseIds[modName];

        if (!courseId) {
            console.log(`   ❌ Erro: Módulo "${modName}" não mapeado ou não criado para a aula: ${aulaTitle}`);
            continue;
        }

        console.log(`🚀 Subindo Aula [${modName}]: ${aulaTitle}...`);

        // Extrai o ID do Youtube para miniatura
        let thumbnailUrl = '';
        const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (ytMatch) {
            thumbnailUrl = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
        }

        // Insere aula no Supabase
        const { data: existingLesson } = await supabase
            .from('lessons')
            .select('id')
            .eq('courseId', courseId)
            .eq('title', aulaTitle)
            .maybeSingle();

        if (existingLesson) {
            console.log(`   ⚠️ Aula já cadastrada. Atualizando link...`);
            await supabase.from('lessons').update({
                videoUrl,
                thumbnailUrl
            }).eq('id', existingLesson.id);
        } else {
            // Obter última posição
            const { data: lessonsInCourse } = await supabase
                .from('lessons')
                .select('position')
                .eq('courseId', courseId);
            
            const position = lessonsInCourse ? lessonsInCourse.length : 0;

            const { error } = await supabase.from('lessons').insert([{
                courseId,
                title: aulaTitle,
                videoUrl,
                thumbnailUrl,
                duration: '00h 00m',
                position
            }]);

            if (error) {
                console.error(`   ❌ Erro ao salvar aula:`, error.message);
            } else {
                console.log(`   ✅ Cadastrada com sucesso!`);
            }
        }
    }

    console.log('\n🎉 PROCESSO CONCLUÍDO COM SUCESSO!\n');
}

main().catch(err => {
    console.error('❌ Ocorreu um erro fatal:', err);
});
