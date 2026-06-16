import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Course {
    id: string;
    title: string;
    subtitle?: string; // New: For "IA PARA" style prefix
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
    lastPosition?: number;
    lastLessonId?: string;
    description?: string;
    tags?: string[];
    // Card Customization (Miniatura)
    cardTitle?: string;
    cardSubtitle?: string;
    cardIcon?: string;
    cardThumbnail?: string;
    position?: number;
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
    lastPosition?: number;
    lastWatchedAt?: number;
    module?: string;
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
    updateProgress: (itemId: string, watchedSeconds: number, newProgress: number, totalSeconds?: number, lastPosition?: number) => void;
    clearLocalCache: () => void;
    isSyncing: boolean;
    syncStatus: 'synced' | 'syncing' | 'error' | 'local-mode';
    updateCoursesOrder: (orderedCourses: Course[]) => Promise<void>;
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
const LS_PROGRESS_KEY = 'atl_progress_v3';

interface ProgressEntry {
    watched_seconds: number;   // Tempo real ACUMULADO assistindo
    last_position: number;     // Última posição do player (para resume)
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

// ── localStorage content helpers (Dual-Sync Fallback) ─────────────────────
const LS_CONTENT_KEY = 'atl_content_v3';

interface ContentSync {
    courses: Course[];
    lessons: Lesson[];
    sectors: Sector[];
    articles: Article[];
    updatedAt: number;
}

function lsLoadContent(): ContentSync {
    try {
        const data = JSON.parse(localStorage.getItem(LS_CONTENT_KEY) ?? 'null');
        return data || { courses: [], lessons: [], sectors: [], articles: [], updatedAt: 0 };
    } catch { return { courses: [], lessons: [], sectors: [], articles: [], updatedAt: 0 }; }
}

function lsSaveContent(content: Partial<ContentSync>) {
    try {
        const current = lsLoadContent();
        const next = { ...current, ...content, updatedAt: Date.now() };
        localStorage.setItem(LS_CONTENT_KEY, JSON.stringify(next));
    } catch { }
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const isBypassUser = userId === 'admin-master';

    const [courses, setCourses] = useState<Course[]>(() => {
        const local = lsLoadContent();
        const baseCourses = local.courses.length > 0 ? local.courses : defaultCourses;
        const lsProg = lsLoadProgress();
        
        const mapped = baseCourses.map(c => {
            // Pick up the course's directly saved progress, or search lessons
            const cProg = lsProg[c.id];
            
            // To ensure the Hero Banner sorts correctly on first millisecond:
            // Find max last_watched_at among its lessons from lsProg
            let maxWatchedAt = cProg?.last_watched_at || 0;
            Object.keys(lsProg).forEach(key => {
                if (key.startsWith(c.id + '_')) {
                    if ((lsProg[key]?.last_watched_at || 0) > maxWatchedAt) {
                        maxWatchedAt = lsProg[key].last_watched_at;
                    }
                }
            });

            return {
                ...c,
                progress: cProg?.progress || 0,
                lastWatchedAt: maxWatchedAt
            };
        });
        return mapped.sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999));
    });
    const [lessons, setLessons] = useState<Lesson[]>(() => lsLoadContent().lessons);
    const [sectors, setSectors] = useState<Sector[]>(() => {
        const local = lsLoadContent();
        return local.sectors.length > 0 ? local.sectors : defaultSectors;
    });
    const [articles, setArticles] = useState<Article[]>(() => {
        const local = lsLoadContent();
        return local.articles.length > 0 ? local.articles : defaultArticles;
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'local-mode'>('synced');

    const persistLocal = (content: Partial<ContentSync>) => {
        lsSaveContent(content);
    };

    // ── Fetch and Sync ─────────────────────────────────────────────────────
    useEffect(() => {
        const fetchData = async () => {
            if (!isSupabaseConfigured) {
                setSyncStatus('local-mode');
                setIsLoading(false);
                return;
            }
            setIsSyncing(true);
            setSyncStatus('syncing');

            try {
                const local = lsLoadContent();
                
                const fetchPromise = Promise.all([
                    supabase.from('courses').select('*'),
                    supabase.from('lessons').select('*').order('position', { ascending: true }),
                    supabase.from('sectors').select('*'),
                    supabase.from('articles').select('*'),
                ]);

                const [coursesRes, lessonsRes, sectorsRes, articlesRes] = await fetchPromise;

                // 1. Prioritize Supabase Courses
                const sbCourses: Course[] = coursesRes.data?.map((c: any) => ({
                    id: c.id,
                    title: c.title,
                    subtitle: c.subtitle || '', // Map subtitle
                    instructor: c.instructor,
                    instructorTitle: c.instructorTitle,
                    duration: c.duration,
                    icon: c.icon,
                    progress: 0,
                    videoUrl: c.videoUrl,
                    thumbnailUrl: c.thumbnailUrl,
                    watchedSeconds: 0,
                    totalSeconds: c.totalSeconds,
                    lastWatchedAt: 0,
                    description: c.description,
                    tags: c.tags || [],
                    cardTitle: c.cardTitle || c.card_title || '',
                    cardSubtitle: c.cardSubtitle || c.card_subtitle || '',
                    cardIcon: c.cardIcon || c.card_icon || '',
                    cardThumbnail: c.cardThumbnail || c.card_thumbnail || '',
                    position: (c.position !== undefined && c.position !== null) ? c.position : 9999,
                })) || [];
                
                // ── Se Supabase retornou 0 cursos, mantém o estado atual (não sobrescreve)
                // Isso previne perda de dados por falha temporária de RLS ou conexão
                const mergedCourses = sbCourses.length > 0
                    ? [...sbCourses, ...(() => {
                        const sbIds = new Set(sbCourses.map(c => c.id));
                        return (local.courses || []).filter((c: any) => !sbIds.has(c.id));
                    })()]
                    : local.courses.length > 0
                        ? local.courses
                        : courses; // Mantém estado atual do React se tudo falhar

                // 2. Prioritize Supabase Lessons
                const sbLessons: Lesson[] = lessonsRes.data?.map((l: any) => ({
                    id: l.id,
                    courseId: l.courseId || l.course_id || '',
                    title: l.title,
                    videoUrl: l.videoUrl || l.video_url || '',
                    thumbnailUrl: l.thumbnailUrl || l.thumbnail_url || '',
                    duration: l.duration,
                    totalSeconds: l.totalSeconds || l.total_seconds || 0,
                    position: l.position || 0,
                    module: l.module || '',
                    progress: 0,
                    watchedSeconds: 0,
                })) || [];

                // ── Se Supabase retornou 0 aulas mas temos local, mantém local
                const mergedLessons = sbLessons.length > 0
                    ? [...sbLessons, ...(() => {
                        const sbIds = new Set(sbLessons.map(l => l.id));
                        return (local.lessons || []).filter((l: any) => !sbIds.has(l.id));
                    })()]
                    : local.lessons.length > 0
                        ? local.lessons
                        : lessons; // Mantém estado atual do React
                
                setSectors(sectorsRes.data && sectorsRes.data.length > 0 ? sectorsRes.data : local.sectors.length > 0 ? local.sectors : defaultSectors);
                setArticles(articlesRes.data && articlesRes.data.length > 0 ? articlesRes.data : local.articles.length > 0 ? local.articles : defaultArticles);

                // ── Salva no localStorage os dados mesclados para evitar perda de dados locais
                if (mergedCourses.length > 0) persistLocal({ courses: mergedCourses });
                if (mergedLessons.length > 0) persistLocal({ lessons: mergedLessons });

                // 4. Load & Merge Progress
                const lsProgress = lsLoadProgress();
                let serverProgress: any[] = [];
                if (userId && isSupabaseConfigured) {
                    console.log(`[DataContext] Fetching progress for user: ${userId}`);
                    const { data, error } = await supabase.from('user_progress').select('*').eq('user_id', userId);
                    if (error) console.error('[DataContext] Progress fetch error:', error);
                    serverProgress = data ?? [];
                    console.log(`[DataContext] Server progress loaded: ${serverProgress.length} items`);
                }

                const getMergedProgress = (itemId: string) => {
                    const s = serverProgress.find(r => r.course_id === itemId);
                    const l = lsProgress[itemId];
                    if (s) return { progress: s.progress ?? 0, watchedSeconds: s.watched_seconds ?? 0, last_position: s.last_position ?? 0, lastWatchedAt: s.last_watched_at ?? 0 };
                    if (l) return { progress: l.progress ?? 0, watchedSeconds: l.watched_seconds ?? 0, last_position: l.last_position ?? 0, lastWatchedAt: l.last_watched_at ?? 0 };
                    return { progress: 0, watchedSeconds: 0, last_position: 0, lastWatchedAt: 0 };
                };

                // 5. Final Mapping with Progress
                const finalLessons = mergedLessons.map(l => {
                    const prog = getMergedProgress(l.id);
                    return {
                        ...l,
                        progress: prog.progress,
                        watchedSeconds: prog.watchedSeconds,
                        lastPosition: prog.last_position,
                        lastWatchedAt: prog.lastWatchedAt
                    };
                });

                const finalCourses = mergedCourses.map(c => {
                    const cProg = getMergedProgress(c.id); // For course-level progress if any
                    const cLessons = finalLessons.filter(l => l.courseId === c.id);
                    const avgProgressRaw = cLessons.length > 0 
                        ? (cLessons.reduce((acc, curr) => acc + (curr.progress || 0), 0) / cLessons.length) 
                        : (cProg.progress || 0);
                    const avgProgress = avgProgressRaw > 0 ? Math.max(1, Math.ceil(avgProgressRaw)) : 0;
                    
                    const courseWatchedSeconds = cLessons.reduce((acc, curr) => acc + (curr.watchedSeconds || 0), 0);
                    const lastWatchedLesson = [...cLessons].sort((a, b) => (b.lastWatchedAt || 0) - (a.lastWatchedAt || 0))[0];

                    return {
                        ...c,
                        progress: avgProgress,
                        watchedSeconds: courseWatchedSeconds || cProg.watchedSeconds || 0,
                        lastWatchedAt: lastWatchedLesson?.lastWatchedAt || cProg.lastWatchedAt || 0,
                        lastLessonId: lastWatchedLesson?.id
                    };
                }).sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999));

                // ── Só atualiza o estado se tiver dados reais do Supabase ou locais válidos
                if (finalCourses.length > 0) setCourses(finalCourses);
                if (finalLessons.length > 0) setLessons(finalLessons);

                console.log(`[DataContext] Sync: ${finalCourses.length} cursos, ${finalLessons.length} aulas`);
                setSyncStatus('synced');
            } catch (err) {
                console.error('[DataContext] Background sync failed:', err);
                setSyncStatus('error');
            } finally {
                setIsSyncing(false);
                setIsLoading(false);
            }
        };
        fetchData();
    }, [userId, isBypassUser]);

    // Removed separate progress effect to unify loading above

    // ── Mutations ──────────────────────────────────────────────────────────
    const updateCoursesOrder = async (orderedCourses: Course[]) => {
        const updatedCourses = orderedCourses.map((c, index) => ({
            ...c,
            position: index
        }));

        setCourses(updatedCourses);
        persistLocal({ courses: updatedCourses });

        if (isSupabaseConfigured) {
            try {
                const promises = updatedCourses.map(c => 
                    supabaseAdmin.from('courses').update({ position: c.position }).eq('id', c.id)
                );
                const results = await Promise.all(promises);
                results.forEach((res, i) => {
                    if (res.error) {
                        console.error(`[DataContext] Error updating course "${updatedCourses[i].title}" order on Supabase:`, res.error.message);
                    }
                });
            } catch (err) {
                console.error('[DataContext] Error updating courses order on Supabase:', err);
            }
        }
    };

    const addCourse = async (course: Omit<Course, 'id'>) => {
        const tempId = crypto.randomUUID();
        const newCourse = { ...course, id: tempId, progress: 0, position: courses.length };
        setCourses(prev => { const next = [...prev, newCourse].sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999)); persistLocal({ courses: next }); return next; });
        if (isSupabaseConfigured) {
            const sbInsert: any = {
                id: tempId,
                title: course.title,
                subtitle: course.subtitle || '',
                instructor: course.instructor,
                "instructorTitle": course.instructorTitle || 'Especialista ATL',
                duration: course.duration,
                icon: course.icon,
                "videoUrl": course.videoUrl || '',
                "thumbnailUrl": course.thumbnailUrl || '',
                description: course.description || '',
                tags: course.tags || [],
                position: newCourse.position,
                "cardTitle": course.cardTitle || '',
                "cardSubtitle": course.cardSubtitle || '',
                "cardIcon": course.cardIcon || '',
                "cardThumbnail": course.cardThumbnail || ''
            };
            const { data, error } = await supabaseAdmin.from('courses').insert([sbInsert]).select().single();
            if (!error && data) setCourses(prev => { const next = prev.map(c => c.id === tempId ? { ...data, progress: 0 } : c).sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999)); persistLocal({ courses: next }); return next; });
            else if (error) console.error('[DataContext] addCourse error:', error.message);
        }
    };

    const updateCourse = async (id: string, updated: Partial<Course>) => {
        setCourses(prev => { const next = prev.map(c => c.id === id ? { ...c, ...updated } : c); persistLocal({ courses: next }); return next; });
        if (isSupabaseConfigured) {
            const sbUpdate: any = {};
            if (updated.title !== undefined) sbUpdate.title = updated.title;
            if (updated.subtitle !== undefined) sbUpdate.subtitle = updated.subtitle;
            if (updated.instructor !== undefined) sbUpdate.instructor = updated.instructor;
            if (updated.instructorTitle !== undefined) sbUpdate["instructorTitle"] = updated.instructorTitle;
            if (updated.duration !== undefined) sbUpdate.duration = updated.duration;
            if (updated.icon !== undefined) sbUpdate.icon = updated.icon;
            if (updated.videoUrl !== undefined) sbUpdate["videoUrl"] = updated.videoUrl;
            if (updated.thumbnailUrl !== undefined) sbUpdate["thumbnailUrl"] = updated.thumbnailUrl;
            if (updated.watchedSeconds !== undefined) sbUpdate["watchedSeconds"] = updated.watchedSeconds;
            if (updated.totalSeconds !== undefined) sbUpdate["totalSeconds"] = updated.totalSeconds;
            if (updated.lastWatchedAt !== undefined) sbUpdate["lastWatchedAt"] = updated.lastWatchedAt;
            if (updated.description !== undefined) sbUpdate.description = updated.description;
            if (updated.tags !== undefined) sbUpdate.tags = updated.tags;
            if (updated.cardTitle !== undefined) sbUpdate["cardTitle"] = updated.cardTitle;
            if (updated.cardSubtitle !== undefined) sbUpdate["cardSubtitle"] = updated.cardSubtitle;
            if (updated.cardIcon !== undefined) sbUpdate["cardIcon"] = updated.cardIcon;
            if (updated.cardThumbnail !== undefined) sbUpdate["cardThumbnail"] = updated.cardThumbnail;
            if (updated.position !== undefined) sbUpdate.position = updated.position;

            if (Object.keys(sbUpdate).length > 0) {
                const { error } = await supabaseAdmin.from('courses').update(sbUpdate).eq('id', id);
                if (error) console.error('[DataContext] updateCourse error:', error.message);
            }
        }
    };

    const deleteCourse = async (id: string) => {
        setCourses(prev => { const next = prev.filter(c => c.id !== id); persistLocal({ courses: next }); return next; });
        if (isSupabaseConfigured) await supabaseAdmin.from('courses').delete().eq('id', id);
    };

    const addLesson = async (lesson: Omit<Lesson, 'id'>) => {
        const tempId = crypto.randomUUID();
        const newLesson = { ...lesson, id: tempId, progress: 0 };
        setLessons(prev => { const next = [...prev, newLesson]; persistLocal({ lessons: next }); return next; });
        if (isSupabaseConfigured) {
            const { data, error } = await supabaseAdmin.from('lessons').insert([{
                id: tempId,
                "courseId": lesson.courseId,
                "title": lesson.title,
                "videoUrl": lesson.videoUrl,
                "thumbnailUrl": lesson.thumbnailUrl,
                "duration": lesson.duration,
                "totalSeconds": lesson.totalSeconds || 0,
                "position": lesson.position,
                "module": lesson.module || '',
            }]).select().single();
            if (!error && data) {
                setLessons(prev => {
                    const next = prev.map(l => l.id === tempId ? { ...data, courseId: data.courseId, progress: 0 } : l);
                    persistLocal({ lessons: next });
                    return next;
                });
            } else if (error) {
                console.error('[DataContext] addLesson Supabase Error:', error.message);
                throw error;
            }
        }
    };

    const updateLesson = async (id: string, updated: Partial<Lesson>) => {
        setLessons(prev => {
            const next = prev.map(l => l.id === id ? { ...l, ...updated } : l);
            persistLocal({ lessons: next });
            return next;
        });
        if (isSupabaseConfigured) {
            const sbUpdate: any = {};
            if (updated.title !== undefined) sbUpdate.title = updated.title;
            if (updated.courseId !== undefined) sbUpdate["courseId"] = updated.courseId;
            if (updated.videoUrl !== undefined) sbUpdate["videoUrl"] = updated.videoUrl;
            if (updated.thumbnailUrl !== undefined) sbUpdate["thumbnailUrl"] = updated.thumbnailUrl;
            if (updated.duration !== undefined) sbUpdate["duration"] = updated.duration;
            if (updated.totalSeconds !== undefined) sbUpdate["totalSeconds"] = updated.totalSeconds;
            if (updated.position !== undefined) sbUpdate["position"] = updated.position;
            if (updated.module !== undefined) sbUpdate["module"] = updated.module;

            const { error } = await supabaseAdmin.from('lessons').update(sbUpdate).eq('id', id);
            if (error) {
                console.error('[DataContext] updateLesson Supabase Error:', error.message);
                throw error;
            }
        }
    };

    const deleteLesson = async (id: string) => {
        setLessons(prev => { const next = prev.filter(l => l.id !== id); persistLocal({ lessons: next }); return next; });
        if (isSupabaseConfigured) await supabaseAdmin.from('lessons').delete().eq('id', id);
    };

    const addSector = async (name: string) => {
        const tempId = crypto.randomUUID();
        setSectors(prev => { const next = [...prev, { id: tempId, name }]; persistLocal({ sectors: next }); return next; });
        if (isSupabaseConfigured) {
            const { data, error } = await supabaseAdmin.from('sectors').insert([{ name }]).select().single();
            if (!error && data) setSectors(prev => { const next = prev.map(s => s.id === tempId ? data : s); persistLocal({ sectors: next }); return next; });
        }
    };
    const updateSector = async (id: string, name: string) => {
        setSectors(prev => { const next = prev.map(s => s.id === id ? { ...s, name } : s); persistLocal({ sectors: next }); return next; });
        if (isSupabaseConfigured) await supabaseAdmin.from('sectors').update({ name }).eq('id', id);
    };
    const deleteSector = async (id: string) => {
        setSectors(prev => { const next = prev.filter(s => s.id !== id); persistLocal({ sectors: next }); return next; });
        if (isSupabaseConfigured) await supabaseAdmin.from('sectors').delete().eq('id', id);
    };

    const addArticle = async (article: Omit<Article, 'id' | 'createdAt'>) => {
        const tempId = crypto.randomUUID();
        const createdAt = Date.now();
        setArticles(prev => { const next = [{ ...article, id: tempId, createdAt }, ...prev]; persistLocal({ articles: next }); return next; });
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.from('articles').insert([{ ...article, createdAt }]).select().single();
            if (!error && data) setArticles(prev => { const next = prev.map(a => a.id === tempId ? data : a); persistLocal({ articles: next }); return next; });
        }
    };
    const updateArticle = async (id: string, updated: Partial<Article>) => {
        setArticles(prev => { const next = prev.map(a => a.id === id ? { ...a, ...updated } : a); persistLocal({ articles: next }); return next; });
        if (isSupabaseConfigured) await supabase.from('articles').update(updated).eq('id', id);
    };
    const deleteArticle = async (id: string) => {
        setArticles(prev => { const next = prev.filter(a => a.id !== id); persistLocal({ articles: next }); return next; });
        if (isSupabaseConfigured) await supabase.from('articles').delete().eq('id', id);
    };

    const updateProgress = async (itemId: string, watchedSeconds: number, newProgress: number, lastPosition?: number) => {
        const lastWatchedAt = Date.now();
        const entry: ProgressEntry = { watched_seconds: watchedSeconds, last_position: lastPosition ?? watchedSeconds, progress: newProgress, last_watched_at: lastWatchedAt };
        lsSaveProgress(itemId, entry);
        localStorage.setItem('atl_last_watched_lesson_id', itemId);

        let parentCourseId: string | undefined;

        setLessons(prev => {
            const nextLessons = prev.map(l => {
                if (l.id === itemId) {
                    parentCourseId = l.courseId;
                    return { ...l, progress: newProgress, watchedSeconds, lastPosition: lastPosition ?? watchedSeconds, lastWatchedAt };
                }
                return l;
            });

            // If we have a parent course, update its aggregate progress
            if (parentCourseId) {
                const cId = parentCourseId;
                setCourses(prevCourses => prevCourses.map(c => {
                    if (c.id === cId) {
                        const courseLessons = nextLessons.filter(l => l.courseId === cId);
                        const totalLessonProgress = courseLessons.reduce((acc, curr) => acc + (curr.progress || 0), 0);
                        const avgProgressRaw = courseLessons.length > 0 ? (totalLessonProgress / courseLessons.length) : 0;
                        const avgProgress = avgProgressRaw > 0 ? Math.max(1, Math.ceil(avgProgressRaw)) : 0;
                        
                        const courseWatchedTotal = courseLessons.reduce((acc, curr) => acc + (curr.watchedSeconds || 0), 0);

                        return {
                            ...c,
                            progress: avgProgress,
                            watchedSeconds: courseWatchedTotal,
                            lastWatchedAt,
                            lastLessonId: itemId
                        };
                    }
                    return c;
                }));
            }

            return nextLessons;
        });

        if (userId && isSupabaseConfigured) {
            console.log(`[DataContext] Saving progress online for ${itemId}: ${newProgress}%`);
            const { error } = await supabase.from('user_progress').upsert({
                user_id: userId,
                course_id: itemId,
                watched_seconds: watchedSeconds,
                last_position: lastPosition ?? watchedSeconds,
                progress: newProgress,
                last_watched_at: lastWatchedAt
            }, { onConflict: 'user_id,course_id' });
            if (error) {
                console.error('[DataContext] Error saving online progress:', error.message, error);
            } else {
                console.log(`[DataContext] Progress saved online: ${itemId} → ${newProgress}%`);
            }
        }
    };

    const clearLocalCache = () => { localStorage.removeItem(LS_CONTENT_KEY); window.location.reload(); };

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
            updateProgress, clearLocalCache, isSyncing, syncStatus,
            updateCoursesOrder
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
