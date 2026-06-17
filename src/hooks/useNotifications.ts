import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';

const LS_NOTIF_KEY  = 'atl_notifications_v1';
const LS_KNOWN_KEY  = 'atl_known_items_v1';
const TTL_MS        = 24 * 60 * 60 * 1000; // 24 horas

export interface Notification {
    id: string;
    type: 'course' | 'lesson';
    title: string;
    subtitle: string;
    itemId: string;
    createdAt: number;
    read: boolean;
}

// ── localStorage helpers ───────────────────────────────────────────────────────
const loadNotifs = (): Notification[] => {
    try {
        const raw = localStorage.getItem(LS_NOTIF_KEY);
        if (!raw) return [];
        const all: Notification[] = JSON.parse(raw);
        // Remove expired (>24h) automatically
        return all.filter(n => Date.now() - n.createdAt < TTL_MS);
    } catch { return []; }
};

const saveNotifs = (notifs: Notification[]) => {
    localStorage.setItem(LS_NOTIF_KEY, JSON.stringify(notifs));
};

const loadKnownIds = (): Set<string> => {
    try {
        const raw = localStorage.getItem(LS_KNOWN_KEY);
        if (!raw) return new Set();
        return new Set(JSON.parse(raw) as string[]);
    } catch { return new Set(); }
};

const saveKnownIds = (ids: Set<string>) => {
    localStorage.setItem(LS_KNOWN_KEY, JSON.stringify([...ids]));
};

// ── Hook ───────────────────────────────────────────────────────────────────────
export const useNotifications = () => {
    const { courses, lessons, isLoading } = useData();
    const [notifications, setNotifications] = useState<Notification[]>(() => loadNotifs());

    useEffect(() => {
        if (isLoading || (courses.length === 0 && lessons.length === 0)) return;

        const knownIds  = loadKnownIds();
        const isFirstRun = knownIds.size === 0; // First ever load — seed silently

        const existing   = loadNotifs();
        const notifiedIds = new Set(existing.map(n => n.itemId));
        const newNotifs  = [...existing];
        const now        = Date.now();

        // ── Courses ─────────────────────────────────────────────────────────
        courses.forEach(course => {
            if (!isFirstRun && !knownIds.has(course.id) && !notifiedIds.has(course.id)) {
                newNotifs.push({
                    id: `notif-course-${course.id}`,
                    type: 'course',
                    title: course.title,
                    subtitle: 'Novo módulo adicionado',
                    itemId: course.id,
                    createdAt: now,
                    read: false,
                });
                notifiedIds.add(course.id);
            }
            knownIds.add(course.id);
        });

        // ── Lessons ─────────────────────────────────────────────────────────
        lessons.forEach(lesson => {
            if (!isFirstRun && !knownIds.has(lesson.id) && !notifiedIds.has(lesson.id)) {
                const parentCourse = courses.find(c => c.id === lesson.courseId);
                newNotifs.push({
                    id: `notif-lesson-${lesson.id}`,
                    type: 'lesson',
                    title: lesson.title,
                    subtitle: parentCourse
                        ? `Nova aula em "${parentCourse.title}"`
                        : 'Nova aula disponível',
                    itemId: lesson.id,
                    createdAt: now,
                    read: false,
                });
                notifiedIds.add(lesson.id);
            }
            knownIds.add(lesson.id);
        });

        saveKnownIds(knownIds);
        saveNotifs(newNotifs);
        setNotifications(newNotifs);
    }, [courses, lessons, isLoading]);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
            saveNotifs(updated);
            return updated;
        });
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => {
            const updated = prev.map(n => ({ ...n, read: true }));
            saveNotifs(updated);
            return updated;
        });
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return { notifications, unreadCount, markAsRead, markAllAsRead };
};
