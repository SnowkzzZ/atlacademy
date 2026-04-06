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

export interface Lesson {
    id: string;
    courseId: string;
    title: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    duration: string;
    totalSeconds?: number;
    position: number;
    progress?: number;
    watchedSeconds?: number;
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
    lessons: Lesson[];
    sectors: Sector[];
    articles: Article[];
    addCourse: (course: Omit<Course, 'id'>) => void;
    updateCourse: (id: string, updatedCourse: Partial<Course>) => void;
    deleteCourse: (id: string) => void;
    addLesson: (lesson: Omit<Lesson, 'id'>) => void;
    updateLesson: (id: string, updated: Partial<Lesson>) => void;
    deleteLesson: (id: string) => void;
    addSector: (name: string) => void;
    updateSector: (id: string, name: string) => void;
    deleteSector: (id: string) => void;
    addArticle: (article: Omit<Article, 'id' | 'createdAt'>) => void;
    updateArticle: (id: string, updated: Partial<Article>) => void;
    deleteArticle: (id: string) => void;
    updateProgress: (itemId: string, watchedSeconds: number, newProgress: number, totalSeconds?: number) => void;
}

const defaultCourses: Course[] = [
    { id: '00000000-0000-0000-0000-000000000001', title: 'Modernização de Sistemas Estruturais', instructor: 'Dr. Julian Vance', duration: '00h 00m', icon: 'architecture', progress: 0, thumbnailUrl: '/thumbnails/hero.png', watchedSeconds: 0, totalSeconds: 0, lastWatchedAt: 0, videoUrl: 'https://cdn.pixabay.com/video/2021/08/04/83906-584732168_tiny.mp4' },
    { id: '00000000-0000-0000-0000-000000000002', title: 'Rede Estratégica de Inteligência', instructor: 'Sarah Chen', duration: '00h 00m', icon: 'hub', progress: 0, thumbnailUrl: '/thumbnails/course_2.png', watchedSeconds: 0, totalSeconds: 0, lastWatchedAt: 0 },
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
    { id: '00000000-0000-0000-0000-000000000021', sectorId: '00000000-0000-0000-0000-000000000011', title: 'Os 5 Pilares da Estratégia Empresarial Moderna', content: `A estratégia empresarial eficaz se baseia em cinco pilares fundamentais.\n\n**1. Visão Clara**\nUma visão bem definida orienta todas as decisões táticas e estratégicas.\n\n**2. Análise de Mercado**\nConhecer profundamente o mercado é essencial para posicionamento competitivo.\n\n**3. Execução Disciplinada**\nA melhor estratégia sem execução vale zero.\n\n**4. Adaptabilidade**\nEmpresas que dominam a adaptação prosperam em ciclos de disrupção.\n\n**5. Cultura de Performance**\nConstruir equipes motivadas é o diferencial real.`, author: 'ATL Academy', createdAt: Date.now() - 86400000 * 2 },
    { id: '00000000-0000-0000-0000-000000000022', sectorId: '00000000-0000-0000-0000-000000000012', title: 'Liderança Situacional: Adapte seu Estilo', content: `Líderes de alto impacto se adaptam ao contexto de cada colaborador.\n\n**O que é Liderança Situacional?**\nIdentificar o nível de desenvolvimento de cada pessoa e aplicar o estilo mais adequado.\n\n**Na Prática:**\n- Com iniciantes: seja diretivo\n- Com aprendizes: combine direção com suporte\n- Com especialistas: delegue e confie\n\n**Resultado:** Times mais engajados e autônomos.`, author: 'ATL Academy', createdAt: Date.now() - 86400000 },
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const userId = user?.id ?? null;

    const [courses, setCourses] = useState<Course[]>(defaultCourses);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [sectors, setSectors] = useState<Sector[]>(defaultSectors);
    const [articles, setArticles] = useState<Article[]>(defaultArticles);
    const [isLoading, setIsLoading] = useState(true);

    // ── Fetch all data ─────────────────────────────────────────────────────
    useEffect(() => {
        const fetchData = async () => {
            if (!isSupabaseConfigured) { setIsLoading(false); return; }
            try {
                const [coursesRes, lessonsRes, sectorsRes, articlesRes] = await Promise.all([
                    supabase.from('courses').select('*'),
                    supabase.from('lessons').select('*').order('position', { ascending: true }),
                    supabase.from('sectors').select('*'),
                    supabase.from('articles').select('*'),
                ]);

                // DB is authoritative — only fall back to defaults if DB is empty
                let finalCourses: Course[] = defaultCourses;
                if (coursesRes.data && coursesRes.data.length > 0) {
                    finalCourses = coursesRes.data;
                }

                // Load per-user progress and merge into courses
                if (userId && finalCourses.length > 0) {
                    const { data: progressRows } = await supabase
                        .from('user_progress')
                        .select('*')
                        .eq('user_id', userId);

                    if (progressRows && progressRows.length > 0) {
                        finalCourses = finalCourses.map(course => {
                            const p = progressRows.find((r: any) => r.course_id === course.id);
                            return p ? { ...course, progress: p.progress ?? 0, watchedSeconds: p.watched_seconds ?? 0, lastWatchedAt: p.last_watched_at ?? 0 } : course;
                        });

                        // Also merge lesson progress
                        if (lessonsRes.data) {
                            const mergedLessons = lessonsRes.data.map((l: any) => {
                                const p = progressRows.find((r: any) => r.course_id === l.id);
                                return p ? { ...l, progress: p.progress ?? 0, watchedSeconds: p.watched_seconds ?? 0 } : l;
                            });
                            setLessons(mergedLessons);
                        }
                    } else if (lessonsRes.data) {
                        setLessons(lessonsRes.data);
                    }
                } else if (lessonsRes.data) {
                    setLessons(lessonsRes.data);
                }

                setCourses(finalCourses);
                if (sectorsRes.data && sectorsRes.data.length > 0) setSectors(sectorsRes.data);
                if (articlesRes.data && articlesRes.data.length > 0) setArticles(articlesRes.data);

            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    // ── Courses ────────────────────────────────────────────────────────────
    const addCourse = async (course: Omit<Course, 'id'>) => {
        const tempId = crypto.randomUUID();
        setCourses(prev => [...prev, { ...course, id: tempId }]);
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.from('courses').insert([{ ...course }]).select().single();
            if (!error && data) setCourses(prev => prev.map(c => c.id === tempId ? data : c));
        }
    };

    const updateCourse = async (id: string, updatedFields: Partial<Course>) => {
        const full = { ...courses.find(c => c.id === id), ...updatedFields } as Course;
        setCourses(prev => prev.map(c => c.id === id ? full : c));
        if (isSupabaseConfigured) {
            const fields = ['id', 'title', 'instructor', 'instructorTitle', 'duration', 'icon', 'videoUrl', 'thumbnailUrl', 'description', 'tags'];
            const payload: Record<string, unknown> = {};
            for (const key of fields) {
                const val = (full as unknown as Record<string, unknown>)[key];
                if (val !== undefined) payload[key] = val;
            }
            const { error } = await supabase.from('courses').upsert(payload);
            if (error) console.warn('updateCourse:', error.message);
        }
    };

    const deleteCourse = async (id: string) => {
        setCourses(prev => prev.filter(c => c.id !== id));
        setLessons(prev => prev.filter(l => l.courseId !== id));
        if (isSupabaseConfigured) await supabase.from('courses').delete().eq('id', id);
    };

    // ── Lessons ────────────────────────────────────────────────────────────
    const addLesson = async (lesson: Omit<Lesson, 'id'>) => {
        const tempId = crypto.randomUUID();
        setLessons(prev => [...prev, { ...lesson, id: tempId }]);
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.from('lessons').insert([{
                courseId: lesson.courseId, title: lesson.title,
                videoUrl: lesson.videoUrl, thumbnailUrl: lesson.thumbnailUrl,
                duration: lesson.duration, totalSeconds: lesson.totalSeconds || 0, position: lesson.position,
            }]).select().single();
            if (!error && data) setLessons(prev => prev.map(l => l.id === tempId ? { ...data, courseId: data.courseId } : l));
        }
    };

    const updateLesson = async (id: string, updated: Partial<Lesson>) => {
        const full = { ...lessons.find(l => l.id === id), ...updated } as Lesson;
        setLessons(prev => prev.map(l => l.id === id ? full : l));
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('lessons').upsert({
                id: full.id, courseId: full.courseId, title: full.title,
                videoUrl: full.videoUrl, thumbnailUrl: full.thumbnailUrl,
                duration: full.duration, totalSeconds: full.totalSeconds || 0, position: full.position,
            });
            if (error) console.warn('updateLesson:', error.message);
        }
    };

    const deleteLesson = async (id: string) => {
        setLessons(prev => prev.filter(l => l.id !== id));
        if (isSupabaseConfigured) await supabase.from('lessons').delete().eq('id', id);
    };

    // ── Progress (per user, per item — works for both courses and lessons) ─
    const updateProgress = async (itemId: string, watchedSeconds: number, newProgress: number, totalSeconds?: number) => {
        // Update local lesson state
        setLessons(prev => prev.map(l => {
            if (l.id !== itemId) return l;
            return { ...l, watchedSeconds, progress: Math.max(l.progress ?? 0, newProgress), ...(totalSeconds ? { totalSeconds } : {}) };
        }));
        // Update local course state (for course-level items without lessons)
        setCourses(prev => prev.map(c => {
            if (c.id !== itemId) return c;
            return { ...c, watchedSeconds, progress: Math.max(c.progress ?? 0, newProgress), lastWatchedAt: Date.now(), ...(totalSeconds ? { totalSeconds } : {}) };
        }));
        // Save to Supabase
        if (isSupabaseConfigured && userId) {
            const existing = [...lessons, ...courses].find(x => x.id === itemId);
            const maxProgress = Math.max((existing as any)?.progress ?? 0, newProgress);
            await supabase.from('user_progress').upsert({
                user_id: userId, course_id: itemId,
                watched_seconds: watchedSeconds, progress: maxProgress, last_watched_at: Date.now(),
            }, { onConflict: 'user_id,course_id' });
        }
    };

    // ── Sectors ────────────────────────────────────────────────────────────
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

    // ── Articles ───────────────────────────────────────────────────────────
    const addArticle = async (article: Omit<Article, 'id' | 'createdAt'>) => {
        const tempId = crypto.randomUUID();
        const newArticle: Article = { ...article, id: tempId, createdAt: Date.now() };
        setArticles(prev => [newArticle, ...prev]);
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.from('articles').insert([{ sectorId: article.sectorId, title: article.title, content: article.content, author: article.author, createdAt: newArticle.createdAt }]).select().single();
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
            courses, lessons, sectors, articles,
            addCourse, updateCourse, deleteCourse,
            addLesson, updateLesson, deleteLesson,
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
