import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Course {
    id: string;
    title: string;
    instructor: string;
    instructorTitle?: string;
    duration: string;
    icon: string;
    progress: number;
    videoUrl?: string;
    thumbnailUrl?: string;
    watchedSeconds?: number;
    totalSeconds?: number;
    lastWatchedAt?: number;
    description?: string;
    tags?: string[];
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
    updateProgress: (courseId: string, watchedSeconds: number, newProgress: number, totalSeconds?: number) => void;
}

// Default content — used ONLY if Supabase returns 0 rows (first-time setup)
const defaultCourses: Course[] = [
    { id: '00000000-0000-0000-0000-000000000001', title: 'Modernização de Sistemas Estruturais', instructor: 'Dr. Julian Vance', duration: '00h 00m', icon: 'architecture', progress: 0, thumbnailUrl: '/thumbnails/hero.png', watchedSeconds: 0, totalSeconds: 0, lastWatchedAt: 0, videoUrl: 'https://cdn.pixabay.com/video/2021/08/04/83906-584732168_tiny.mp4' },
    { id: '00000000-0000-0000-0000-000000000002', title: 'Rede Estratégica de Inteligência', instructor: 'Sarah Chen', duration: '00h 00m', icon: 'hub', progress: 0, thumbnailUrl: '/thumbnails/course_2.png', watchedSeconds: 0, totalSeconds: 0, lastWatchedAt: 0 },
    { id: '00000000-0000-0000-0000-000000000003', title: 'Operações Neurais Nível 4', instructor: 'Marcus Thorne', duration: '00h 00m', icon: 'psychology', progress: 0, thumbnailUrl: '/thumbnails/course_3.png', watchedSeconds: 0, totalSeconds: 0, lastWatchedAt: 0 },
    { id: '00000000-0000-0000-0000-000000000004', title: 'Sistemas de Iluminação', instructor: 'Elias Thorne', duration: '00h 00m', icon: 'lightbulb', progress: 0, watchedSeconds: 0, totalSeconds: 0, lastWatchedAt: 0 },
    { id: '00000000-0000-0000-0000-000000000005', title: 'Operações Globais e Escala', instructor: 'Elena Rostova', duration: '00h 00m', icon: 'public', progress: 0, watchedSeconds: 0, totalSeconds: 0, lastWatchedAt: 0 },
    { id: '00000000-0000-0000-0000-000000000006', title: 'Estratégia Cyber: Arquitetura', instructor: 'Elias Thorne', duration: '00h 00m', icon: 'terminal', progress: 0, watchedSeconds: 0, totalSeconds: 0, lastWatchedAt: 0 },
];

const defaultSectors: Sector[] = [
    { id: '00000000-0000-0000-0000-000000000011', name: 'Estratégia Empresarial' },
    { id: '00000000-0000-0000-0000-000000000012', name: 'Liderança' },
    { id: '00000000-0000-0000-0000-000000000013', name: 'Finanças' },
    { id: '00000000-0000-0000-0000-000000000014', name: 'Marketing' },
    { id: '00000000-0000-0000-0000-000000000015', name: 'Habilidades Tech' },
    { id: '00000000-0000-0000-0000-000000000016', name: 'Psicologia e Mindset' },
    { id: '00000000-0000-0000-0000-000000000017', name: 'Produtividade' },
    { id: '00000000-0000-0000-0000-000000000018', name: 'Cíber-Segurança' },
];

const defaultArticles: Article[] = [
    {
        id: '00000000-0000-0000-0000-000000000021',
        sectorId: '00000000-0000-0000-0000-000000000011',
        title: 'Os 5 Pilares da Estratégia Empresarial Moderna',
        content: `A estratégia empresarial eficaz se baseia em cinco pilares fundamentais que sustentam qualquer organização de alto desempenho.\n\n**1. Visão Clara**\nUma visão bem definida orienta todas as decisões táticas e estratégicas. Sem visão, a empresa navega sem rumo.\n\n**2. Análise de Mercado**\nConhecer profundamente o mercado, concorrentes e oportunidades é essencial para posicionamento competitivo.\n\n**3. Execução Disciplinada**\nA melhor estratégia sem execução vale zero. Times de elite executam com velocidade, precisão e accountability.\n\n**4. Adaptabilidade**\nMercados mudam. Empresas que dominam a arte da adaptação sobrevivem e prosperam em ciclos de disrupção.\n\n**5. Cultura de Performance**\nCultura come estratégia no café da manhã. Construir equipes motivadas e alinhadas é o diferencial real.`,
        author: 'ATL Academy',
        createdAt: Date.now() - 86400000 * 2,
    },
    {
        id: '00000000-0000-0000-0000-000000000022',
        sectorId: '00000000-0000-0000-0000-000000000012',
        title: 'Liderança Situacional: Adapte seu Estilo',
        content: `Líderes de alto impacto não têm apenas um estilo de liderança — eles se adaptam ao contexto e à maturidade de cada colaborador.\n\n**O que é Liderança Situacional?**\nÉ a capacidade de identificar o nível de desenvolvimento de cada pessoa e aplicar o estilo de liderança mais adequado: diretivo, treinador, apoiador ou delegador.\n\n**Na Prática:**\n- Com iniciantes: seja diretivo, dê instruções claras\n- Com aprendizes intermediários: combine direção com suporte emocional\n- Com competentes mas inseguros: apoio emocional com menos monitoramento técnico\n- Com especialistas: delegue e confie\n\n**Resultado:** Times mais engajados, produtivos e autônomos.`,
        author: 'ATL Academy',
        createdAt: Date.now() - 86400000,
    },
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const userId = user?.id ?? null;

    const [courses, setCourses] = useState<Course[]>(defaultCourses);
    const [sectors, setSectors] = useState<Sector[]>(defaultSectors);
    const [articles, setArticles] = useState<Article[]>(defaultArticles);
    const [isLoading, setIsLoading] = useState(true);

    // ── Initial Fetch ──────────────────────────────────────────────────────
    useEffect(() => {
        const fetchData = async () => {
            if (!isSupabaseConfigured) { setIsLoading(false); return; }

            try {
                const [coursesRes, sectorsRes, articlesRes] = await Promise.all([
                    supabase.from('courses').select('*'),
                    supabase.from('sectors').select('*'),
                    supabase.from('articles').select('*'),
                ]);

                // ── Courses: DB is authoritative. Only fall back to defaults if DB is empty.
                if (coursesRes.data && coursesRes.data.length > 0) {
                    setCourses(coursesRes.data);
                }
                // If 0 rows: keep defaultCourses so admin has something to start with

                if (sectorsRes.data && sectorsRes.data.length > 0) {
                    setSectors(sectorsRes.data);
                }

                if (articlesRes.data && articlesRes.data.length > 0) {
                    setArticles(articlesRes.data);
                }

                // ── Load per-user progress and merge into courses ──────────
                if (userId && coursesRes.data && coursesRes.data.length > 0) {
                    const { data: progressRows } = await supabase
                        .from('user_progress')
                        .select('*')
                        .eq('user_id', userId);

                    if (progressRows && progressRows.length > 0) {
                        setCourses(prev => prev.map(course => {
                            const p = progressRows.find((r: any) => r.course_id === course.id);
                            if (!p) return course;
                            return {
                                ...course,
                                progress: p.progress ?? course.progress,
                                watchedSeconds: p.watched_seconds ?? course.watchedSeconds,
                                lastWatchedAt: p.last_watched_at ?? course.lastWatchedAt,
                            };
                        }));
                    }
                }
            } catch (err) {
                console.error('Error fetching data from Supabase:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId]); // Re-fetch when user changes (login/logout)

    // ── Courses CRUD ───────────────────────────────────────────────────────
    const addCourse = async (course: Omit<Course, 'id'>) => {
        const tempId = crypto.randomUUID();
        const newCourse = { ...course, id: tempId };
        setCourses(prev => [...prev, newCourse]);

        if (isSupabaseConfigured) {
            const { data, error } = await supabase.from('courses').insert([{ ...course }]).select().single();
            if (!error && data) {
                setCourses(prev => prev.map(c => c.id === tempId ? data : c));
            }
        }
    };

    const updateCourse = async (id: string, updatedFields: Partial<Course>) => {
        const currentLocal = courses.find(c => c.id === id);
        const fullUpdatedCourse = { ...currentLocal, ...updatedFields } as Course;
        setCourses(prev => prev.map(c => c.id === id ? fullUpdatedCourse : c));

        if (isSupabaseConfigured) {
            // Only send content fields — progress is managed via user_progress table
            const contentFields = ['id', 'title', 'instructor', 'instructorTitle', 'duration', 'icon',
                'videoUrl', 'thumbnailUrl', 'description', 'tags'];
            const payload: Record<string, unknown> = {};
            for (const key of contentFields) {
                const val = (fullUpdatedCourse as unknown as Record<string, unknown>)[key];
                if (val !== undefined) payload[key] = val;
            }
            const { error } = await supabase.from('courses').upsert(payload);
            if (error) console.warn('updateCourse error:', error.message);
        }
    };

    const deleteCourse = async (id: string) => {
        setCourses(prev => prev.filter(c => c.id !== id));
        if (isSupabaseConfigured) {
            await supabase.from('courses').delete().eq('id', id);
        }
    };

    // ── Per-user progress tracking ─────────────────────────────────────────
    // Progress: always keep the maximum reached (never go backward when rewinding)
    const updateProgress = async (courseId: string, watchedSeconds: number, newProgress: number, totalSeconds?: number) => {
        setCourses(prev => prev.map(c => {
            if (c.id !== courseId) return c;
            const maxProgress = Math.max(c.progress ?? 0, newProgress); // Never decrease
            return {
                ...c,
                watchedSeconds,
                progress: maxProgress,
                lastWatchedAt: Date.now(),
                ...(totalSeconds ? { totalSeconds } : {}),
            };
        }));

        // Persist to user_progress table (per-user, not global)
        if (isSupabaseConfigured && userId) {
            const currentProgress = courses.find(c => c.id === courseId)?.progress ?? 0;
            const maxProgress = Math.max(currentProgress, newProgress);
            const { error } = await supabase.from('user_progress').upsert({
                user_id: userId,
                course_id: courseId,
                watched_seconds: watchedSeconds,
                progress: maxProgress,
                last_watched_at: Date.now(),
            }, { onConflict: 'user_id,course_id' });
            if (error) console.warn('updateProgress error:', error.message);
        }
    };

    // ── Sectors CRUD ───────────────────────────────────────────────────────
    const addSector = async (name: string) => {
        const tempId = crypto.randomUUID();
        setSectors(prev => [...prev, { id: tempId, name }]);
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.from('sectors').insert([{ name }]).select().single();
            if (!error && data) setSectors(prev => prev.map(s => s.id === tempId ? data : s));
        }
    };

    const updateSector = async (id: string, name: string) => {
        const full = { ...sectors.find(s => s.id === id), name } as Sector;
        setSectors(prev => prev.map(s => s.id === id ? full : s));
        if (isSupabaseConfigured) await supabase.from('sectors').upsert(full);
    };

    const deleteSector = async (id: string) => {
        setSectors(prev => prev.filter(s => s.id !== id));
        setArticles(prev => prev.filter(a => a.sectorId !== id));
        if (isSupabaseConfigured) await supabase.from('sectors').delete().eq('id', id);
    };

    // ── Articles CRUD ──────────────────────────────────────────────────────
    const addArticle = async (article: Omit<Article, 'id' | 'createdAt'>) => {
        const tempId = crypto.randomUUID();
        const newArticle: Article = { ...article, id: tempId, createdAt: Date.now() };
        setArticles(prev => [newArticle, ...prev]);
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.from('articles').insert([{
                sectorId: article.sectorId, title: article.title,
                content: article.content, author: article.author, createdAt: newArticle.createdAt
            }]).select().single();
            if (!error && data) setArticles(prev => prev.map(a => a.id === tempId ? data : a));
        }
    };

    const updateArticle = async (id: string, updated: Partial<Article>) => {
        const full = { ...articles.find(a => a.id === id), ...updated } as Article;
        setArticles(prev => prev.map(a => a.id === id ? full : a));
        if (isSupabaseConfigured) await supabase.from('articles').upsert(full);
    };

    const deleteArticle = async (id: string) => {
        setArticles(prev => prev.filter(a => a.id !== id));
        if (isSupabaseConfigured) await supabase.from('articles').delete().eq('id', id);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-t-2 border-primary border-r-2 animate-spin"></div>
            </div>
        );
    }

    return (
        <DataContext.Provider value={{
            courses, sectors, articles,
            addCourse, updateCourse, deleteCourse,
            addSector, updateSector, deleteSector,
            addArticle, updateArticle, deleteArticle,
            updateProgress,
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
