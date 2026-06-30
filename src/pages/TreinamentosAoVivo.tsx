import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
// ── Tipos ────────────────────────────────────────────────────────────────────
export interface LiveTraining {
    id: string;
    title: string;
    type: string;          // 'Treinamento' | 'Evento'
    presenter: string;
    description: string | null;
    scheduledAt: number;   // epoch ms
    liveUrl: string | null;
    artUrl: string | null;
    status: string | null; // 'upcoming' | 'live' | 'ended'
    recordingUrl: string | null;
    presenterVideoUrl: string | null;
    position: number | null;
}
type Filter = 'all' | 'Treinamento' | 'Evento';
type View = 'agenda' | 'gravacoes';
// ── Cores por tipo: verde (Treinamento) / âmbar (Evento) ─────────────────────
export const typeStyle = (type: string) => type === 'Evento'
    ? { badge: 'bg-amber-500/15 text-amber-300 border-amber-400/30', dot: 'bg-amber-400', text: 'text-amber-300', grad: 'from-amber-500/30 via-orange-500/10 to-transparent' }
    : { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30', dot: 'bg-emerald-400', text: 'text-emerald-300', grad: 'from-emerald-500/30 via-green-500/10 to-transparent' };
// ── Status dinâmico ──────────────────────────────────────────────────────────
export const getStatus = (e: LiveTraining, now: number = Date.now()) => {
    const start = e.scheduledAt;
    const end = start + 3_600_000; // ao vivo por 1h, depois encerrado
    if (now >= start && now <= end) return { label: 'Ao Vivo', cls: 'bg-red-500/20 text-red-300 border-red-400/40', pulse: true };
    const isToday = new Date(start).toDateString() === new Date(now).toDateString();
    if (now < start && isToday) return { label: 'Hoje', cls: 'bg-amber-500/20 text-amber-200 border-amber-400/40', pulse: false };
    if (now < start) return { label: 'Próximo', cls: 'bg-primary/20 text-primary border-primary/40', pulse: false };
    return { label: 'Finalizado', cls: 'bg-white/10 text-white/40 border-white/20', pulse: false };
};
// ── Helpers de data ──────────────────────────────────────────────────────────
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const formatFullDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
};
export const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
// ── Add-to-calendar + download ───────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');
const toICSDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
};
const escapeICS = (s: string) => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
export const googleCalUrl = (e: LiveTraining) => {
    const start = toICSDate(e.scheduledAt);
    const end = toICSDate(e.scheduledAt + 3_600_000);
    const details = `${e.type} com ${e.presenter}${e.description ? ' — ' + e.description : ''}${e.liveUrl ? '\n\nLink: ' + e.liveUrl : ''}`;
    const params = new URLSearchParams({ action: 'TEMPLATE', text: e.title, dates: `${start}/${end}`, details });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
export const downloadICS = (e: LiveTraining) => {
    const desc = `${e.type} com ${e.presenter}${e.description ? ' — ' + e.description : ''}`;
    const lines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ATL Academy//Treinamentos ao Vivo//PT-BR', 'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT', `UID:${e.id}@atlacademy`, `DTSTAMP:${toICSDate(Date.now())}`,
        `DTSTART:${toICSDate(e.scheduledAt)}`, `DTEND:${toICSDate(e.scheduledAt + 3_600_000)}`,
        `SUMMARY:${escapeICS(e.title)}`, `DESCRIPTION:${escapeICS(desc)}`, e.liveUrl ? `URL:${e.liveUrl}` : '',
        'END:VEVENT', 'END:VCALENDAR',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${e.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
};
export const downloadArt = async (e: LiveTraining) => {
    if (!e.artUrl) return;
    try {
        const res = await fetch(e.artUrl);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${e.title.replace(/[^a-z0-9]/gi, '_')}_arte`;
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch { window.open(e.artUrl, '_blank'); }
};
// ── WhatsApp Share ────────────────────────────────────────────────────────────
export const buildWhatsAppUrl = (e: LiveTraining) => {
    const st = getStatus(e);
    // previewUrl PRIMEIRO — WhatsApp usa a 1a URL para gerar o card com imagem
    const previewUrl = `${window.location.origin}/api/event-preview?ev=${e.id}`;
    const lines = [
        previewUrl,
        ``,
        `*${e.type.toUpperCase()} ATL ACADEMY*`,
        ``,
        `*${e.title}*`,
        `Apresentador: ${e.presenter}`,
        `Data: ${formatFullDate(e.scheduledAt)} as ${formatTime(e.scheduledAt)}`,
    ];
    if (st.label === 'Ao Vivo') lines.push(``, `*Esta acontecendo AGORA!*`);
    else if (st.label === 'Hoje') lines.push(``, `*Acontece hoje!*`);
    if (e.liveUrl) lines.push(``, `Entrar na live: ${e.liveUrl}`);
    if (e.description) lines.push(``, e.description);
    lines.push(``, `_ATL Academy — Conhecimento que transforma._`);
    return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
};
// ── Countdown ────────────────────────────────────────────────────────────────
const useCountdown = (target: number | null) => {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);
    if (target == null) return null;
    const diff = Math.max(0, target - now);
    return {
        dias: Math.floor(diff / 86_400_000),
        horas: Math.floor((diff % 86_400_000) / 3_600_000),
        minutos: Math.floor((diff % 3_600_000) / 60_000),
        segundos: Math.floor((diff % 60_000) / 1000),
        ended: diff === 0,
    };
};
export const EventCountdown: React.FC<{ target: number; size?: 'sm' | 'lg' }> = ({ target, size = 'lg' }) => {
    const c = useCountdown(target);
    if (!c) return null;
    const box = size === 'lg' ? 'w-16 h-16 md:w-20 md:h-20' : 'w-12 h-12';
    const num = size === 'lg' ? 'text-2xl md:text-3xl' : 'text-lg';
    return (
        <div className="flex gap-3">
            {[{ v: c.dias, l: 'Dias' }, { v: c.horas, l: 'Horas' }, { v: c.minutos, l: 'Min' }, { v: c.segundos, l: 'Seg' }].map(u => (
                <div key={u.l} className={`flex flex-col items-center justify-center bg-black/30 border border-white/10 rounded-2xl ${box}`}>
                    <span className={`font-mono ${num} font-bold text-white tabular-nums`}>{String(u.v).padStart(2, '0')}</span>
                    <span className="font-label text-[8px] tracking-widest uppercase text-white/40 mt-0.5">{u.l}</span>
                </div>
            ))}
        </div>
    );
};
// ── Página ───────────────────────────────────────────────────────────────────
const TreinamentosAoVivo: React.FC = () => {
    const [events, setEvents] = useState<LiveTraining[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('all');
    const [view, setView] = useState<View>('agenda');
    const [selected, setSelected] = useState<LiveTraining | null>(null);
    const [dayList, setDayList] = useState<LiveTraining[] | null>(null);
    const [shared, setShared] = useState(false);
    const didDeepLink = useRef(false);
    const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const didInitCursor = useRef(false);
    const [now, setNow] = useState(Date.now());
    useEffect(() => { const id = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(id); }, []);
    useEffect(() => {
        let active = true;
        (async () => {
            const { data, error } = await supabase.from('live_trainings').select('*').order('scheduledAt', { ascending: true });
            if (!active) return;
            if (!error && data) setEvents(data.map((e: Record<string, unknown>) => ({ ...e, scheduledAt: Number(e.scheduledAt) })) as LiveTraining[]);
            setIsLoading(false);
        })();
        return () => { active = false; };
    }, []);
    useEffect(() => {
        if (didInitCursor.current || events.length === 0) return;
        const now = Date.now();
        const upcoming = [...events].filter(e => e.scheduledAt >= now).sort((a, b) => a.scheduledAt - b.scheduledAt)[0];
        const target = upcoming ?? [...events].sort((a, b) => b.scheduledAt - a.scheduledAt)[0];
        if (target) { const d = new Date(target.scheduledAt); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }
        didInitCursor.current = true;
    }, [events]);
    // Deep-link: abre automaticamente o evento de ?ev=ID
    useEffect(() => {
        if (didDeepLink.current || events.length === 0) return;
        const ev = new URLSearchParams(window.location.search).get('ev');
        if (ev) { const found = events.find(e => e.id === ev); if (found) setSelected(found); }
        didDeepLink.current = true;
    }, [events]);
    const shareEvent = async (e: LiveTraining) => {
        const url = `${window.location.origin}/treinamentos?ev=${e.id}`;
        const text = `${e.type}: ${e.title} — ${formatFullDate(e.scheduledAt)} às ${formatTime(e.scheduledAt)}`;
        try {
            if (navigator.share) { await navigator.share({ title: e.title, text, url }); }
            else { await navigator.clipboard.writeText(`${text}\n${url}`); setShared(true); setTimeout(() => setShared(false), 2000); }
        } catch { /* cancelado pelo usuário */ }
    };
    const filtered = useMemo(() => filter === 'all' ? events : events.filter(e => e.type === filter), [events, filter]);
    const recordings = useMemo(
        () => [...filtered].filter(e => e.recordingUrl && e.recordingUrl.trim()).sort((a, b) => b.scheduledAt - a.scheduledAt),
        [filtered]
    );
    const agendaList = useMemo(
        () => [...filtered].filter(e => getStatus(e, now).label !== 'Finalizado').sort((a, b) => a.scheduledAt - b.scheduledAt).slice(0, 6),
        [filtered, now]
    );
    const nextEvent = useMemo(() => {
        return [...filtered].filter(e => e.scheduledAt >= now).sort((a, b) => a.scheduledAt - b.scheduledAt)[0] ?? null;
    }, [filtered, now]);
    const calendarDays = useMemo(() => {
        const year = cursor.getFullYear(); const month = cursor.getMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells: (Date | null)[] = [];
        for (let i = 0; i < firstWeekday; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
        while (cells.length % 7 !== 0) cells.push(null);
        return cells;
    }, [cursor]);
    const eventsOnDay = (day: Date) => filtered.filter(e => sameDay(new Date(e.scheduledAt), day));
    const goMonth = (delta: number) => setCursor(c => new Date(c.getFullYear(), c.getMonth() + delta, 1));
    const today = new Date();
    return (
        <div className="bg-[#030303] text-white/90 min-h-screen font-body relative overflow-x-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[#030303]" />
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-blue-500/5 blur-3xl" />
                <div className="dot-grid absolute inset-0 opacity-[0.03]" />
            </div>
            <Navbar />
            <main className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-32 md:pt-40 pb-24">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary text-[18px]">live_tv</span>
                        <span className="font-label text-[10px] tracking-[4px] uppercase text-primary/80">Agenda ao Vivo</span>
                    </div>
                    <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50">Treinamentos ao Vivo</h1>
                    <p className="text-white/40 text-sm md:text-base mt-4 max-w-2xl leading-relaxed">Acompanhe os próximos treinamentos e eventos da ATL. Marque na agenda, entre ao vivo e reveja as gravações.</p>
                </motion.div>
                {/* Tabs Agenda / Gravações */}
                <div className="inline-flex p-1 rounded-full bg-black/30 border border-white/10 mb-8">
                    {([{ k: 'agenda', l: 'Agenda', i: 'calendar_month' }, { k: 'gravacoes', l: 'Gravações', i: 'video_library' }] as { k: View; l: string; i: string }[]).map(t => (
                        <button key={t.k} onClick={() => setView(t.k)}
                            className={`px-5 py-2 rounded-full font-label text-[10px] font-bold tracking-[2px] uppercase transition-all duration-300 flex items-center gap-2 ${view === t.k ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}`}>
                            <span className="material-symbols-outlined text-[15px]">{t.i}</span>{t.l}
                        </button>
                    ))}
                </div>
                {/* Filtros */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {([{ key: 'all', label: 'Todos', icon: 'apps' }, { key: 'Treinamento', label: 'Treinamentos', icon: 'school' }, { key: 'Evento', label: 'Eventos', icon: 'celebration' }] as { key: Filter; label: string; icon: string }[]).map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className={`px-5 py-2.5 rounded-full font-label text-[10px] font-semibold tracking-[2px] uppercase transition-all duration-300 border flex items-center gap-2 ${filter === f.key ? 'bg-primary text-black border-primary shadow-[0_0_20px_rgba(0,240,255,0.25)]' : 'text-white/40 border-white/10 bg-white/[0.02] hover:text-white hover:bg-white/5'}`}>
                            <span className="material-symbols-outlined text-[14px]">{f.icon}</span>{f.label}
                        </button>
                    ))}
                </div>
                {isLoading ? (
                    <div className="py-24 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-t-2 border-primary border-r-2 animate-spin" />
                        <p className="text-white/30 font-label text-[10px] uppercase tracking-widest">Carregando agenda...</p>
                    </div>
                ) : view === 'gravacoes' ? (
                    /* ── Aba de gravações ── */
                    recordings.length === 0 ? (
                        <div className="liquid-glass-soft p-16 text-center border-white/5 rounded-3xl">
                            <span className="material-symbols-outlined text-white/10 text-6xl block mb-4">video_library</span>
                            <p className="text-white/30 font-label text-[11px] tracking-widest uppercase">Nenhuma gravação disponível ainda</p>
                            <p className="text-white/20 text-xs mt-2">As gravações aparecem aqui após os treinamentos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {recordings.map((e, i) => {
                                const st = typeStyle(e.type);
                                return (
                                    <motion.div key={e.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.4) }}
                                        className="liquid-glass-soft rounded-3xl overflow-hidden border-white/5 hover:border-primary/20 transition-all duration-300 group flex flex-col">
                                        <button onClick={() => setSelected(e)} className="relative aspect-video bg-black/40 overflow-hidden text-left">
                                            {e.artUrl ? <img src={e.artUrl} alt={e.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                : <div className={`w-full h-full bg-gradient-to-br ${st.grad} flex items-center justify-center`}><span className="material-symbols-outlined text-white/20 text-6xl">movie</span></div>}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-white text-5xl">play_circle</span></div>
                                            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full font-label text-[9px] font-bold tracking-[2px] uppercase backdrop-blur-md border ${st.badge}`}>{e.type}</div>
                                        </button>
                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="font-headline text-base font-bold text-white leading-tight line-clamp-2">{e.title}</h3>
                                            <p className="text-white/35 text-xs mt-1.5">{e.presenter} · {formatFullDate(e.scheduledAt)}</p>
                                            <a href={e.recordingUrl!} target="_blank" rel="noopener noreferrer"
                                                className="mt-4 w-full bg-white/[0.04] hover:bg-primary hover:text-black border border-white/10 hover:border-primary text-white font-label text-[10px] font-bold tracking-[2px] uppercase py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-[16px]">play_circle</span>Assistir gravação
                                            </a>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    /* ── Aba agenda ── */
                    <>
                        <AnimatePresence mode="wait">
                            {nextEvent && (
                                <motion.div key={nextEvent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                    className="liquid-glass-soft rounded-2xl overflow-hidden border-white/5 mb-8 relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-blue-500/10 pointer-events-none" />
                                    <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-5 p-5 md:p-6 items-center">
                                        <div className="flex flex-col justify-center">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#00F0FF]" />
                                                <span className="font-label text-[9px] tracking-[3px] uppercase text-primary">Próximo ao vivo</span>
                                                <span className={`px-2 py-0.5 rounded-full font-label text-[8px] font-bold tracking-wider uppercase border ${typeStyle(nextEvent.type).badge}`}>{nextEvent.type}</span>
                                            </div>
                                            <h2 className="font-headline text-lg md:text-2xl font-bold text-white leading-tight line-clamp-2">{nextEvent.title}</h2>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-white/50 text-xs">
                                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-primary/70">person</span>{nextEvent.presenter}</span>
                                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-primary/70">calendar_month</span>{formatFullDate(nextEvent.scheduledAt)}</span>
                                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-primary/70">schedule</span>{formatTime(nextEvent.scheduledAt)}</span>
                                            </div>
                                            <div className="mt-4 flex flex-wrap items-center gap-4">
                                                <EventCountdown target={nextEvent.scheduledAt} size="sm" />
                                                <button onClick={() => setSelected(nextEvent)} className="self-end bg-primary text-black hover:bg-white font-label text-[10px] font-bold tracking-[2px] uppercase px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                                                    <span className="material-symbols-outlined text-[15px]">visibility</span>Detalhes
                                                </button>
                                            </div>
                                        </div>
                                        <div className="hidden md:flex items-center justify-center">
                                            {nextEvent.artUrl ? (
                                                <img src={nextEvent.artUrl} alt={nextEvent.title} className="max-w-full max-h-[240px] w-auto h-auto rounded-xl border border-white/10" />
                                            ) : (
                                                <div className={`w-full aspect-video rounded-xl border border-white/10 bg-gradient-to-br ${typeStyle(nextEvent.type).grad} flex flex-col items-center justify-center gap-2`}><span className="material-symbols-outlined text-white/30 text-5xl">live_tv</span><span className="font-label text-[9px] tracking-widest uppercase text-white/30">ATL Academy</span></div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8">
                            {/* Calendário */}
                            <div className="liquid-glass-soft rounded-3xl border-white/5 p-5 md:p-7">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-headline text-lg md:text-xl font-bold text-white">{MESES[cursor.getMonth()]} <span className="text-white/40 font-normal">{cursor.getFullYear()}</span></h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => goMonth(-1)} className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] transition-colors"><span className="material-symbols-outlined text-white/60 text-[18px]">chevron_left</span></button>
                                        <button onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-4 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] transition-colors font-label text-[9px] tracking-widest uppercase text-white/60">Hoje</button>
                                        <button onClick={() => goMonth(1)} className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] transition-colors"><span className="material-symbols-outlined text-white/60 text-[18px]">chevron_right</span></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {DIAS_SEMANA.map(d => <div key={d} className="text-center font-label text-[9px] tracking-widest uppercase text-white/30 py-2">{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {calendarDays.map((day, i) => {
                                        if (!day) return <div key={i} className="min-h-[58px]" />;
                                        const dayEvents = eventsOnDay(day);
                                        const isToday = sameDay(day, today);
                                        const has = dayEvents.length > 0;
                                        return (
                                            <button key={i} onClick={() => { if (dayEvents.length === 1) setSelected(dayEvents[0]); else if (dayEvents.length > 1) setDayList([...dayEvents].sort((a, b) => a.scheduledAt - b.scheduledAt)); }} disabled={!has}
                                                className={`min-h-[58px] rounded-xl flex flex-col items-center justify-start pt-1.5 gap-1 relative transition-all duration-200 border ${has ? 'bg-white/[0.03] border-white/10 hover:bg-primary/10 hover:border-primary/30 cursor-pointer' : 'border-transparent cursor-default'} ${isToday ? 'ring-1 ring-primary/50' : ''}`}>
                                                <span className={`text-xs md:text-sm font-mono ${has ? 'text-white font-bold' : isToday ? 'text-primary' : 'text-white/40'}`}>{day.getDate()}</span>
                                                {has && (
                                                    <div className="w-full px-1 flex flex-col gap-0.5">
                                                        {dayEvents.slice(0, 2).map(ev => (
                                                            <span key={ev.id} className={`block w-full h-1.5 rounded-full ${typeStyle(ev.type).dot}`} />
                                                        ))}
                                                        {dayEvents.length > 2 && <span className="font-mono text-[8px] text-white/40 leading-none">+{dayEvents.length - 2}</span>}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-5 mt-6 pt-5 border-t border-white/[0.06]">
                                    <span className="flex items-center gap-2 font-label text-[9px] tracking-widest uppercase text-white/40"><span className="w-3 h-1.5 rounded-full bg-emerald-400" />Treinamento</span>
                                    <span className="flex items-center gap-2 font-label text-[9px] tracking-widest uppercase text-white/40"><span className="w-3 h-1.5 rounded-full bg-amber-400" />Evento</span>
                                </div>
                            </div>
                            {/* Agenda lateral */}
                            <div>
                                <h3 className="font-headline text-lg md:text-xl font-bold text-white mb-5">Agenda</h3>
                                {agendaList.length === 0 ? (
                                    <div className="liquid-glass-soft p-12 text-center border-white/5 rounded-3xl">
                                        <span className="material-symbols-outlined text-white/10 text-5xl block mb-3">event_busy</span>
                                        <p className="text-white/30 font-label text-[11px] tracking-widest uppercase">Nenhum evento agendado</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[560px] overflow-y-auto custom-scrollbar-premium pr-1">
                                        {agendaList.map((e, i) => {
                                            const st = getStatus(e, now); const ts = typeStyle(e.type);
                                            return (
                                                <motion.button key={e.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }} onClick={() => setSelected(e)}
                                                    className={`w-full text-left liquid-glass-soft rounded-2xl border-white/5 hover:border-primary/20 transition-all duration-300 p-4 flex items-center gap-4 group ${st.label === 'Finalizado' ? 'opacity-60' : ''}`}>
                                                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-black/30 border border-white/10 shrink-0">
                                                        <span className="font-mono text-lg font-bold text-white leading-none">{new Date(e.scheduledAt).getDate()}</span>
                                                        <span className="font-label text-[8px] tracking-widest uppercase text-white/40 mt-1">{MESES[new Date(e.scheduledAt).getMonth()].slice(0, 3)}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-0.5 rounded-full font-label text-[8px] font-bold tracking-wider uppercase border ${ts.badge}`}>{e.type}</span>
                                                            <span className={`px-2 py-0.5 rounded-full font-label text-[8px] font-bold tracking-wider uppercase border ${st.cls} flex items-center gap-1`}>{st.pulse && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}{st.label}</span>
                                                        </div>
                                                        <h4 className="font-headline text-sm font-bold text-white leading-tight truncate">{e.title}</h4>
                                                        <p className="text-white/35 text-xs mt-0.5 truncate">{e.presenter} · {formatTime(e.scheduledAt)}</p>
                                                    </div>
                                                    <span className="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors text-[18px] shrink-0">chevron_right</span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
            {/* Seletor de eventos do dia (quando há mais de um) */}
            <AnimatePresence>
                {dayList && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDayList(null)}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} onClick={ev => ev.stopPropagation()}
                            className="relative w-full max-w-md rounded-3xl border border-white/10 p-6" style={{ background: 'rgba(5,8,15,0.97)', backdropFilter: 'blur(40px)' }}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <span className="font-label text-[9px] tracking-[3px] uppercase text-primary/70 block mb-1">{dayList.length} eventos neste dia</span>
                                    <h3 className="font-headline text-lg font-bold text-white">{new Date(dayList[0].scheduledAt).getDate()} de {MESES[new Date(dayList[0].scheduledAt).getMonth()]}</h3>
                                </div>
                                <button onClick={() => setDayList(null)} className="w-9 h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors"><span className="material-symbols-outlined text-white text-[18px]">close</span></button>
                            </div>
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar-premium pr-1">
                                {dayList.map(e => {
                                    const st = getStatus(e, now); const ts = typeStyle(e.type);
                                    return (
                                        <button key={e.id} onClick={() => { setSelected(e); setDayList(null); }}
                                            className="w-full text-left liquid-glass-soft rounded-2xl border-white/5 hover:border-primary/20 transition-all duration-300 p-3 flex items-center gap-3 group">
                                            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-black/30 border border-white/10 shrink-0">
                                                <span className="material-symbols-outlined text-primary/70 text-[18px]">schedule</span>
                                                <span className="font-mono text-[10px] font-bold text-white mt-0.5">{formatTime(e.scheduledAt)}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className={`px-2 py-0.5 rounded-full font-label text-[8px] font-bold tracking-wider uppercase border ${ts.badge}`}>{e.type}</span>
                                                    <span className={`px-2 py-0.5 rounded-full font-label text-[8px] font-bold tracking-wider uppercase border ${st.cls} flex items-center gap-1`}>{st.pulse && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}{st.label}</span>
                                                </div>
                                                <h4 className="font-headline text-sm font-bold text-white leading-tight truncate">{e.title}</h4>
                                                <p className="text-white/35 text-xs mt-0.5 truncate">{e.presenter}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors text-[18px] shrink-0">chevron_right</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Modal */}
            <AnimatePresence>
                {selected && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} onClick={ev => ev.stopPropagation()}
                            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar-premium rounded-3xl border border-white/10" style={{ background: 'rgba(5,8,15,0.97)', backdropFilter: 'blur(40px)' }}>
                            {(() => {
                                const st = getStatus(selected, now); const ts = typeStyle(selected.type); const future = selected.scheduledAt > now;
                                return (
                                    <>
                                        <div className={`relative overflow-hidden bg-gradient-to-br ${ts.grad}`}>
                                            {selected.artUrl
                                                ? <img src={selected.artUrl} alt={selected.title} className="w-full h-auto block" />
                                                : <div className="w-full min-h-[200px] flex flex-col items-center justify-center gap-3"><span className="material-symbols-outlined text-white/30 text-7xl">live_tv</span><span className="font-label text-[10px] tracking-widest uppercase text-white/30">ATL Academy</span></div>}
                                            {/* Botões top-right: fechar / compartilhar nativo / WhatsApp */}
                                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                                <a href={buildWhatsAppUrl(selected)} target="_blank" rel="noopener noreferrer" title="Compartilhar no WhatsApp"
                                                    className="w-10 h-10 rounded-full bg-[#25D366]/80 hover:bg-[#25D366] border border-[#25D366]/40 flex items-center justify-center transition-colors backdrop-blur-md">
                                                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                                    </svg>
                                                </a>
                                                <button onClick={() => shareEvent(selected)} title="Compartilhar" className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-md"><span className="material-symbols-outlined text-white text-[18px]">{shared ? 'check' : 'share'}</span></button>
                                                <button onClick={() => setSelected(null)} className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-md"><span className="material-symbols-outlined text-white text-[20px]">close</span></button>
                                            </div>
                                            <div className="absolute top-4 left-4 flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full font-label text-[9px] font-bold tracking-[2px] uppercase backdrop-blur-md border ${ts.badge}`}>{selected.type}</span>
                                                <span className={`px-3 py-1 rounded-full font-label text-[9px] font-bold tracking-[2px] uppercase backdrop-blur-md border ${st.cls} flex items-center gap-1.5`}>{st.pulse && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}{st.label}</span>
                                            </div>
                                            {/* Vídeo do palestrante — mini player canto inferior esquerdo */}
                                            {selected.presenterVideoUrl && (
                                                <div className="absolute bottom-3 left-3 w-28 rounded-xl overflow-hidden border border-white/20 shadow-xl backdrop-blur-sm bg-black/40" style={{ aspectRatio: '16/9' }}>
                                                    <video src={selected.presenterVideoUrl} controls playsInline preload="metadata" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            {selected.artUrl && (
                                                <button onClick={() => downloadArt(selected)} className="absolute bottom-4 right-4 px-3 py-2 rounded-xl bg-black/55 hover:bg-black/80 border border-white/15 backdrop-blur-md text-white font-label text-[10px] font-bold tracking-[1px] uppercase flex items-center gap-2 transition-colors">
                                                    <span className="material-symbols-outlined text-[15px]">download</span>Baixar arte
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-7 md:p-8">
                                            <h2 className="font-headline text-2xl md:text-3xl font-bold text-white leading-tight">{selected.title}</h2>
                                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-white/50 text-sm">
                                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-primary/70">person</span>{selected.presenter}</span>
                                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-primary/70">calendar_month</span>{formatFullDate(selected.scheduledAt)}</span>
                                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-primary/70">schedule</span>{formatTime(selected.scheduledAt)}</span>
                                            </div>
                                            {future && (
                                                <div className="mt-5">
                                                    <span className="font-label text-[9px] tracking-[3px] uppercase text-white/30 block mb-2">Começa em</span>
                                                    <EventCountdown target={selected.scheduledAt} size="sm" />
                                                </div>
                                            )}
                                            {selected.description && <p className="text-white/45 text-sm leading-relaxed mt-5">{selected.description}</p>}
                                            {/* Adicionar ao calendário */}
                                            <div className="mt-6 pt-5 border-t border-white/[0.06]">
                                                <span className="font-label text-[9px] tracking-[3px] uppercase text-white/30 flex items-center gap-1.5 mb-3"><span className="material-symbols-outlined text-[14px] text-primary/60">event_available</span>Adicionar ao meu calendário</span>
                                                <div className="flex flex-wrap gap-2">
                                                    <a href={googleCalUrl(selected)} target="_blank" rel="noopener noreferrer" className="bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-primary/30 text-white font-label text-[10px] font-bold tracking-[1px] uppercase py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center gap-2"><span className="material-symbols-outlined text-[15px] text-primary">calendar_add_on</span>Google Agenda</a>
                                                </div>
                                            </div>
                                            {/* Ações */}
                                            <div className="flex flex-wrap gap-3 mt-6">
                                                {selected.liveUrl && <a href={selected.liveUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[160px] bg-primary text-black hover:bg-white font-label text-[10px] font-bold tracking-[2px] uppercase py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,240,255,0.25)]"><span className="material-symbols-outlined text-[16px]">sensors</span>Entrar na live</a>}
                                                {selected.recordingUrl && <a href={selected.recordingUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[160px] bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-white font-label text-[10px] font-bold tracking-[2px] uppercase py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"><span className="material-symbols-outlined text-[16px]">play_circle</span>Assistir gravação</a>}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default TreinamentosAoVivo;
