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
    isLoading: boolean;
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
    { id: '00000000-0000-0000-0000-000000000001', title: 'Modernização de Sistemas Estruturais', instructor: 'Dr. Julian Vance', duration: '00h 00m', icon: 'architecture', progress: 0, thumbnailUrl: '/thumbnails/hero.png', watchedSeconds: 0, totalSeconds: 0, lastWatchedAt: 0, videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' },
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

// ── localStorage progress helpers ─────────────────────────────────────────
const LS_PROGRESS_KEY = 'atl_progress_v2';

interface ProgressEntry {
    watched_seconds: number;
    progress: number;
    last_watched_at: number;
}

function lsLoadProgress(): Record<string, ProgressEntry> {
    try { return JSON.parse(localStorage.getItem(LS_PROGRESS_KEY) ?? '{}'); } catch { return {}; }
}

function lsSaveProgress(itemId: string, entry: ProgressEntry) {
    try {
        const all = lsLoadProgress();
        all[itemId] = entry;
        localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(all));
    } catch { }
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const isBypassUser = userId === 'admin-master';

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

                // DB is authoritative
                let finalCourses: Course[] = (coursesRes.data && coursesRes.data.length > 0) ? coursesRes.data : defaultCourses;

                // Normalize lessons: Supabase may return "courseId" with quotes as the key
                // We ensure the field is always mapped to `courseId` on the JS object
                let rawLessons: Lesson[] = (lessonsRes.data ?? []).map((l: any) => ({
                    id: l.id,
                    courseId: l.courseId ?? l['courseId'] ?? l.course_id ?? '',
                    title: l.title,
                    videoUrl: l.videoUrl ?? l['videoUrl'] ?? '',
                    thumbnailUrl: l.thumbnailUrl ?? l['thumbnailUrl'] ?? '',
                    duration: l.duration ?? '00h 00m',
                    totalSeconds: l.totalSeconds ?? l['totalSeconds'] ?? 0,
                    position: l.position ?? 0,
                    progress: 0,
                    watchedSeconds: 0,
                }));

                // Load progress
                const lsProgress = lsLoadProgress();
                let serverProgress: any[] = [];

                if (userId && !isBypassUser) {
                    const { data } = await supabase.from('user_progress').select('*').eq('user_id', userId);
                    serverProgress = data ?? [];
                }

                // Merge: Supabase (if exists) takes priority, then LocalStorage
                const getMergedProgress = (itemId: string) => {
                    const s = serverProgress.find(r => r.course_id === itemId);
                    const l = lsProgress[itemId];
                    if (s) return { progress: s.progress ?? 0, watchedSeconds: s.watched_seconds ?? 0, lastWatchedAt: s.last_watched_at ?? 0 };
                    if (l) return { progress: l.progress ?? 0, watchedSeconds: l.watched_seconds ?? 0, lastWatchedAt: l.last_watched_at ?? 0 };
                    return { progress: 0, watchedSeconds: 0, lastWatchedAt: 0 };
                };

                finalCourses = finalCourses.map(c => ({ ...c, ...getMergedProgress(c.id) }));
                rawLessons = rawLessons.map(l => ({ ...l, ...getMergedProgress(l.id) }));

                setCourses(finalCourses);
                setLessons(rawLessons);
                if (sectorsRes.data?.length) setSectors(sectorsRes.data);
                if (articlesRes.data?.length) setArticles(articlesRes.data);

                console.log(`[DataContext] Loaded ${finalCourses.length} courses, ${rawLessons.length} lessons`);
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [userId, isBypassUser]);

    // ── Mutations ──────────────────────────────────────────────────────────
    const addCourse = async (course: Omit<Course, 'id'>) => {
        const tempId = crypto.randomUUID();
        setCourses(prev => [...prev, { ...course, id: tempId, progress: 0 }]);
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.from('courses').insert([course]).select().single();
            if (!error && data) setCourses(prev => prev.map(c => c.id === tempId ? { ...data, progress: 0 } : c));
            else if (error) console.warn('[DataProvider] Supabase insert failed:', error.message);
        }
    };

    const updateCourse = async (id: string, updated: Partial<Course>) => {
        setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('courses').update(updated).eq('id', id);
            if (error) console.warn('[DataProvider] Supabase update failed:', error.message);
        }
    };

    const deleteCourse = async (id: string) => {
        setCourses(prev => prev.filter(c => c.id !== id));
        if (isSupabaseConfigured) await supabase.from('courses').delete().eq('id', id);
    };

    const addLesson = async (lesson: Omit<Lesson, 'id'>) => {
        const tempId = crypto.randomUUID();
        setLessons(prev => [...prev, { ...lesson, id: tempId, progress: 0 }]);
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.from('lessons').insert([{
                courseId: lesson.courseId,
                title: lesson.title,
                videoUrl: lesson.videoUrl,
                thumbnailUrl: lesson.thumbnailUrl,
                duration: lesson.duration,
                totalSeconds: lesson.totalSeconds || 0,
                position: lesson.position,
            }]).select().single();
            if (!error && data) setLessons(prev => prev.map(l => l.id === tempId ? { ...data, courseId: data.courseId, progress: 0 } : l));
            else if (error) console.warn('[DataProvider] Lesson insert failed:', error.message);
        }
    };

    const updateLesson = async (id: string, updated: Partial<Lesson>) => {
        setLessons(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('lessons').update(updated).eq('id', id);
            if (error) console.warn('[DataProvider] Lesson update failed:', error.message);
        }
    };

    const deleteLesson = async (id: string) => {
        setLessons(prev => prev.filter(l => l.id !== id));
        if (isSupabaseConfigured) await supabase.from('lessons').delete().eq('id', id);
    };

    const updateProgress = async (itemId: string, watchedSeconds: number, newProgress: number, totalSeconds?: number) => {
        const now = Date.now();
        const existingLesson = lessons.find(l => l.id === itemId);
        const existingCourse = courses.find(c => c.id === itemId);
        const maxProgress = Math.max((existingLesson?.progress ?? existingCourse?.progress ?? 0), newProgress);

        // UI Update
        const updateItem = (item: any) => ({ ...item, watchedSeconds, progress: maxProgress, lastWatchedAt: now, ...(totalSeconds ? { totalSeconds } : {}) });
        setLessons(prev => prev.map(l => l.id === itemId ? updateItem(l) : l));
        setCourses(prev => prev.map(c => c.id === itemId ? updateItem(c) : c));

        lsSaveProgress(itemId, { watched_seconds: watchedSeconds, progress: maxProgress, last_watched_at: now });

        if (isSupabaseConfigured && userId && !isBypassUser) {
            const { error } = await supabase.from('user_progress').upsert({
                user_id: userId,
                course_id: itemId,
                watched_seconds: watchedSeconds,
                progress: maxProgress,
                last_watched_at: now,
            }, { onConflict: 'user_id,course_id' });
            if (error) console.warn('[Progress] Supabase sync error:', error.message);
        }
    };

    // Sectors & Articles
    const addSector = async (name: string) => {
        const tempId = crypto.randomUUID();
        setSectors(prev => [...prev, { id: tempId, name }]);
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.from('sectors').insert([{ name }]).select().single();
            if (!error && data) setSectors(prev => prev.map(s => s.id === tempId ? data : s));
        }
    };
    const updateSector = async (id: string, name: string) => {
        setSectors(prev => prev.map(s => s.id === id ? { ...s, name } : s));
        if (isSupabaseConfigured) await supabase.from('sectors').update({ name }).eq('id', id);
    };
    const deleteSector = async (id: string) => {
        setSectors(prev => prev.filter(s => s.id !== id));
        if (isSupabaseConfigured) await supabase.from('sectors').delete().eq('id', id);
    };

    const addArticle = async (article: Omit<Article, 'id' | 'createdAt'>) => {
        const tempId = crypto.randomUUID();
        const createdAt = Date.now();
        setArticles(prev => [{ ...article, id: tempId, createdAt }, ...prev]);
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.from('articles').insert([{ ...article, createdAt }]).select().single();
            if (!error && data) setArticles(prev => prev.map(a => a.id === tempId ? data : a));
        }
    };
    const updateArticle = async (id: string, updated: Partial<Article>) => {
        setArticles(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
        if (isSupabaseConfigured) await supabase.from('articles').update(updated).eq('id', id);
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
            courses, lessons, sectors, articles, isLoading,
            addCourse, updateCourse, deleteCourse,
            addLesson, updateLesson, deleteLesson,
            addSector, updateSector, deleteSector,
            addArticle, updateArticle, deleteArticle,
            updateProgress
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
