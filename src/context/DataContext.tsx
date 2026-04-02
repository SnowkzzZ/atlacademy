import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Course {
    id: string; // no supabase usaremos uuid ou string gerada
    title: string;
    instructor: string;
    duration: string;
    icon: string;
    progress: number;
    videoUrl?: string;
    thumbnailUrl?: string;
    watchedSeconds?: number;
    totalSeconds?: number;
    lastWatchedAt?: number;
}

export interface Sector {
    id: string;
    name: string;
}

export interface Article {
    id: string;
    sectorId: string;
    title: string;
    content: string;
    author: string;
    createdAt: number;
}

interface DataContextType {
    courses: Course[];
    sectors: Sector[];
    articles: Article[];
    addCourse: (course: Omit<Course, 'id'>) => void;
    updateCourse: (id: string, updatedCourse: Partial<Course>) => void;
    deleteCourse: (id: string) => void;
    addSector: (name: string) => void;
    updateSector: (id: string, name: string) => void;
    deleteSector: (id: string) => void;
    addArticle: (article: Omit<Article, 'id' | 'createdAt'>) => void;
    updateArticle: (id: string, updated: Partial<Article>) => void;
    deleteArticle: (id: string) => void;
}

const defaultCourses: Course[] = [
    { id: '1', title: 'Modernização de Sistemas Estruturais', instructor: 'Dr. Julian Vance', duration: '00h 00m', icon: 'architecture', progress: 0, thumbnailUrl: '/thumbnails/hero.png', watchedSeconds: 0, totalSeconds: 0, lastWatchedAt: 0, videoUrl: 'https://cdn.pixabay.com/video/2021/08/04/83906-584732168_tiny.mp4' },
    { id: '2', title: 'Rede Estratégica de Inteligência', instructor: 'Sarah Chen', duration: '00h 00m', icon: 'hub', progress: 0, thumbnailUrl: '/thumbnails/course_2.png', watchedSeconds: 0, totalSeconds: 0, lastWatchedAt: 0 },
    { id: '3', title: 'Operações Neurais Nível 4', instructor: 'Marcus Thorne', duration: '00h 00m', icon: 'psychology', progress: 0, thumbnailUrl: '/thumbnails/course_3.png', watchedSeconds: 0, totalSeconds: 0, lastWatchedAt: 0 },
    { id: '4', title: 'Sistemas de Iluminação', instructor: 'Elias Thorne', duration: '00h 00m', icon: 'lightbulb', progress: 0, watchedSeconds: 0, totalSeconds: 0, lastWatchedAt: 0 },
    { id: '5', title: 'Operações Globais e Escala', instructor: 'Elena Rostova', duration: '00h 00m', icon: 'public', progress: 0, watchedSeconds: 0, totalSeconds: 0, lastWatchedAt: 0 },
    { id: '6', title: 'Estratégia Cyber: Arquitetura', instructor: 'Elias Thorne', duration: '00h 00m', icon: 'terminal', progress: 0, watchedSeconds: 0, totalSeconds: 0, lastWatchedAt: 0 },
];

const defaultSectors: Sector[] = [
    { id: 's1', name: 'Estratégia Empresarial' },
    { id: 's2', name: 'Liderança' },
    { id: 's3', name: 'Finanças' },
    { id: 's4', name: 'Marketing' },
    { id: 's5', name: 'Habilidades Tech' },
    { id: 's6', name: 'Psicologia e Mindset' },
    { id: 's7', name: 'Produtividade' },
    { id: 's8', name: 'Cíber-Segurança' },
];

const defaultArticles: Article[] = [
    {
        id: 'a1',
        sectorId: 's1',
        title: 'Os 5 Pilares da Estratégia Empresarial Moderna',
        content: `A estratégia empresarial eficaz se baseia em cinco pilares fundamentais que sustentam qualquer organização de alto desempenho.\n\n**1. Visão Clara**\nUma visão bem definida orienta todas as decisões táticas e estratégicas. Sem visão, a empresa navega sem rumo.\n\n**2. Análise de Mercado**\nConhecer profundamente o mercado, concorrentes e oportunidades é essencial para posicionamento competitivo.\n\n**3. Execução Disciplinada**\nA melhor estratégia sem execução vale zero. Times de elite executam com velocidade, precisão e accountability.\n\n**4. Adaptabilidade**\nMercados mudam. Empresas que dominam a arte da adaptação sobrevivem e prosperam em ciclos de disrupção.\n\n**5. Cultura de Performance**\nCultura come estratégia no café da manhã. Construir equipes motivadas e alinhadas é o diferencial real.`,
        author: 'ATL Academy',
        createdAt: Date.now() - 86400000 * 2,
    },
    {
        id: 'a2',
        sectorId: 's2',
        title: 'Liderança Situacional: Adapte seu Estilo',
        content: `Líderes de alto impacto não têm apenas um estilo de liderança — eles se adaptam ao contexto e à maturidade de cada colaborador.\n\n**O que é Liderança Situacional?**\nÉ a capacidade de identificar o nível de desenvolvimento de cada pessoa e aplicar o estilo de liderança mais adequado: diretivo, treinador, apoiador ou delegador.\n\n**Na Prática:**\n- Com iniciantes: seja diretivo, dê instruções claras\n- Com aprendizes intermediários: combine direção com suporte emocional\n- Com competentes mas inseguros: apoio emocional com menos monitoramento técnico\n- Com especialistas: delegue e confie\n\n**Resultado:** Times mais engajados, produtivos e autônomos.`,
        author: 'ATL Academy',
        createdAt: Date.now() - 86400000,
    },
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [courses, setCourses] = useState<Course[]>(defaultCourses);
    const [sectors, setSectors] = useState<Sector[]>(defaultSectors);
    const [articles, setArticles] = useState<Article[]>(defaultArticles);

    // Initial Fetch from Supabase
    useEffect(() => {
        const fetchData = async () => {
            if (!isSupabaseConfigured) return; // Se nao tiver URL configurada, aborta
            
            try {
                const [coursesRes, sectorsRes, articlesRes] = await Promise.all([
                    supabase.from('courses').select('*'),
                    supabase.from('sectors').select('*'),
                    supabase.from('articles').select('*')
                ]);

                if (coursesRes.data && coursesRes.data.length > 0) setCourses(coursesRes.data);
                if (sectorsRes.data && sectorsRes.data.length > 0) setSectors(sectorsRes.data);
                if (articlesRes.data && articlesRes.data.length > 0) setArticles(articlesRes.data);
            } catch (err) {
                console.error("Error fetching data from Supabase:", err);
            }
        };
        fetchData();
    }, []);

    const addCourse = async (course: Omit<Course, 'id'>) => {
        const tempId = Date.now().toString();
        const newCourse = { ...course, id: tempId };
        setCourses(prev => [...prev, newCourse]); // Optimistic Update

        if (isSupabaseConfigured) {
           const { data, error } = await supabase.from('courses').insert([{ ...course }]).select().single();
           if (!error && data) {
               setCourses(prev => prev.map(c => c.id === tempId ? data : c));
           }
        }
    };

    const updateCourse = async (id: string, updatedFields: Partial<Course>) => {
        setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('courses').update(updatedFields).eq('id', id);
            if (error) {
                console.error("Supabase Save Error:", error);
                alert("Falha ao salvar no banco. A capa é muito pesada ou há instabilidade de rede.");
            }
        }
    };

    const deleteCourse = async (id: string) => {
        setCourses(prev => prev.filter(c => c.id !== id));
        if (isSupabaseConfigured) {
            await supabase.from('courses').delete().eq('id', id);
        }
    };

    const addSector = async (name: string) => {
        const tempId = Date.now().toString();
        const newSector = { id: tempId, name };
        setSectors(prev => [...prev, newSector]);

        if (isSupabaseConfigured) {
            const { data, error } = await supabase.from('sectors').insert([{ name }]).select().single();
            if (!error && data) {
                setSectors(prev => prev.map(s => s.id === tempId ? data : s));
            }
        }
    };

    const updateSector = async (id: string, name: string) => {
        setSectors(prev => prev.map(s => s.id === id ? { ...s, name } : s));
        if (isSupabaseConfigured) {
            await supabase.from('sectors').update({ name }).eq('id', id);
        }
    };

    const deleteSector = async (id: string) => {
        setSectors(prev => prev.filter(s => s.id !== id));
        setArticles(prev => prev.filter(a => a.sectorId !== id));
        if (isSupabaseConfigured) {
            await supabase.from('sectors').delete().eq('id', id);
        }
    };

    const addArticle = async (article: Omit<Article, 'id' | 'createdAt'>) => {
        const tempId = Date.now().toString();
        const newArticle: Article = { ...article, id: tempId, createdAt: Date.now() };
        setArticles(prev => [newArticle, ...prev]);

        if (isSupabaseConfigured) {
            const { data, error } = await supabase.from('articles').insert([{ 
                sectorId: article.sectorId,
                title: article.title,
                content: article.content,
                author: article.author,
                createdAt: newArticle.createdAt
            }]).select().single();
            if (!error && data) {
                 setArticles(prev => prev.map(a => a.id === tempId ? data : a));
            }
        }
    };

    const updateArticle = async (id: string, updated: Partial<Article>) => {
        setArticles(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
        if (isSupabaseConfigured) {
            await supabase.from('articles').update(updated).eq('id', id);
        }
    };

    const deleteArticle = async (id: string) => {
        setArticles(prev => prev.filter(a => a.id !== id));
        if (isSupabaseConfigured) {
            await supabase.from('articles').delete().eq('id', id);
        }
    };

    return (
        <DataContext.Provider value={{
            courses, sectors, articles,
            addCourse, updateCourse, deleteCourse,
            addSector, updateSector, deleteSector,
            addArticle, updateArticle, deleteArticle,
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within a DataProvider');
    return context;
};
