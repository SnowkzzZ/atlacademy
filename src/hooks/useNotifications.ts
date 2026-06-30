import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';

const LS_NOTIF_KEY     = 'atl_notifications_v1';
const LS_KNOWN_KEY     = 'atl_known_items_v1';
const LS_KNOWN_TR_KEY  = 'atl_known_trainings_v1';
const LS_SOON_TR_KEY   = 'atl_soon_notified_v1';
const TTL_MS           = 24 * 60 * 60 * 1000; // 24 horas
const SOON_MS          = 60 * 60 * 1000;      // 1 hora antes

export interface Notification {
    id: string;
    type: 'course' | 'lesson' | 'training';
    title: string;
    subtitle: string;
    itemId: string;
    createdAt: number;
    read: boolean;
}

interface TrainingLite {
    id: string;
    title: string;
    type: string;
    scheduledAt: number;
}

// ── localStorage helpers ───────────────────────────────────────────────────────
const loadNotifs = (): Notification[] => {
    try {
        const raw = localStorage.getItem(LS_NOTIF_KEY);
        if (!raw) return [];
        const all: Notification[] = JSON.parse(raw);
        return all.filter(n => Date.now() - n.createdAt < TTL_MS);
    } catch { return []; }
};
const saveNotifs = (notifs: Notification[]) => localStorage.setItem(LS_NOTIF_KEY, JSON.stringify(notifs));

const loadSet = (key: string): Set<string> => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return new Set();
        return new Set(JSON.parse(raw) as string[]);
    } catch { return new Set(); }
};
const saveSet = (key: string, ids: Set<string>) => localStorage.setItem(key, JSON.stringify([...ids]));

// ── Hook ───────────────────────────────────────────────────────────────────────
export const useNotifications = () => {
    const { courses, lessons, isLoading } = useData();
    const [trainings, setTrainings] = useState<TrainingLite[]>([]);
    const [tick, setTick] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>(() => loadNotifs());

    // Busca treinamentos (independente do DataContext)
    useEffect(() => {
        let active = true;
        (async () => {
            const { data } = await supabase.from('live_trainings').select('id,title,type,scheduledAt');
            if (active && data) setTrainings(data.map((t: Record<string, unknown>) => ({
                id: String(t.id), title: String(t.title), type: String(t.type), scheduledAt: Number(t.scheduledAt),
            })));
        })();
        return () => { active = false; };
    }, []);

    // Relógio para checar "prestes a começar"
    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 60_000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (isLoading) return;
        if (courses.length === 0 && lessons.length === 0 && trainings.length === 0) return;

        const knownIds  = loadSet(LS_KNOWN_KEY);
        const isFirstRun = knownIds.size === 0;
        const existing   = loadNotifs();
        const notifiedIds = new Set(existing.map(n => n.itemId));
        const newNotifs  = [...existing];
        const now        = Date.now();

        // ── Cursos ──────────────────────────────────────────────────────────
        courses.forEach(course => {
            if (!isFirstRun && !knownIds.has(course.id) && !notifiedIds.has(course.id)) {
                newNotifs.push({ id: `notif-course-${course.id}`, type: 'course', title: course.title, subtitle: 'Novo módulo adicionado', itemId: course.id, createdAt: now, read: false });
                notifiedIds.add(course.id);
            }
            knownIds.add(course.id);
        });

        // ── Aulas ───────────────────────────────────────────────────────────
        lessons.forEach(lesson => {
            if (!isFirstRun && !knownIds.has(lesson.id) && !notifiedIds.has(lesson.id)) {
                const parentCourse = courses.find(c => c.id === lesson.courseId);
                newNotifs.push({ id: `notif-lesson-${lesson.id}`, type: 'lesson', title: lesson.title, subtitle: parentCourse ? `Nova aula em "${parentCourse.title}"` : 'Nova aula disponível', itemId: lesson.id, createdAt: now, read: false });
                notifiedIds.add(lesson.id);
            }
            knownIds.add(lesson.id);
        });

        // ── Treinamentos ao vivo: novos ─────────────────────────────────────
        const trSeeded = localStorage.getItem(LS_KNOWN_TR_KEY) !== null; // primeira vez = só semeia, sem notificar
        const knownTr  = loadSet(LS_KNOWN_TR_KEY);
        trainings.forEach(t => {
            const key = `tr-${t.id}`;
            if (trSeeded && !knownTr.has(t.id) && !notifiedIds.has(key)) {
                newNotifs.push({ id: `notif-training-${t.id}`, type: 'training', title: t.title, subtitle: `Novo ${t.type.toLowerCase()} ao vivo`, itemId: key, createdAt: now, read: false });
                notifiedIds.add(key);
            }
            knownTr.add(t.id);
        });
        saveSet(LS_KNOWN_TR_KEY, knownTr);

        // ── Treinamentos ao vivo: prestes a começar (até 1h antes) ──────────
        const soonSet = loadSet(LS_SOON_TR_KEY);
        trainings.forEach(t => {
            const dt = t.scheduledAt - now;
            const key = `soon-${t.id}`;
            if (dt > 0 && dt <= SOON_MS && !soonSet.has(t.id) && !notifiedIds.has(key)) {
                newNotifs.push({ id: `notif-soon-${t.id}`, type: 'training', title: t.title, subtitle: 'Começa em breve — entre ao vivo', itemId: key, createdAt: now, read: false });
                notifiedIds.add(key);
                soonSet.add(t.id);
            }
        });
        saveSet(LS_SOON_TR_KEY, soonSet);

        saveSet(LS_KNOWN_KEY, knownIds);
        saveNotifs(newNotifs);
        setNotifications(newNotifs);
    }, [courses, lessons, trainings, isLoading, tick]);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => { const updated = prev.map(n => n.id === id ? { ...n, read: true } : n); saveNotifs(updated); return updated; });
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => { const updated = prev.map(n => ({ ...n, read: true })); saveNotifs(updated); return updated; });
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return { notifications, unreadCount, markAsRead, markAllAsRead };
};
