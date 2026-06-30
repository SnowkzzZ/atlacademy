import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LiveTraining {
    id: string;
    title: string;
    type: 'Treinamento' | 'Evento';
    presenter: string;
    description: string;
    scheduledAt: number;
    liveUrl: string;
    artUrl: string;
    status: 'upcoming' | 'live' | 'finished';
    recordingUrl: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAYS   = ['seg','ter','qua','qui','sex','sáb','dom'];

function getStatus(scheduledAt: number): 'live' | 'today' | 'upcoming' | 'finished' {
    const now  = Date.now();
    const diff = scheduledAt - now;
    if (diff < 0 && diff > -3 * 60 * 60 * 1000) return 'live';
    const d = new Date(scheduledAt), t = new Date();
    if (d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()) return 'today';
    if (scheduledAt < now) return 'finished';
    return 'upcoming';
}

function formatCountdown(ms: number): string | null {
    const diff = ms - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    return `${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}min`;
}

function formatDate(ms: number): string {
    const d = new Date(ms);
    return `${String(d.getDate()).padStart(2,'0')} de ${MONTHS[d.getMonth()]} · ${String(d.getHours()).padStart(2,'0')}h${String(d.getMinutes()).padStart(2,'0')}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, { label: string; cls: string }> = {
        live:     { label: 'Ao vivo',    cls: 'bg-red-500/15 border-red-500/30 text-red-400' },
        today:    { label: 'Hoje',       cls: 'bg-primary/10 border-primary/25 text-primary' },
        upcoming: { label: 'Próximo',    cls: 'bg-white/5 border-white/10 text-white/40' },
        finished: { label: 'Finalizado', cls: 'bg-green-500/10 border-green-500/20 text-green-400' },
    };
    const { label, cls } = map[status] || map.upcoming;
    return (
        <span className={`inline-flex items-center gap-1.5 font-label text-[9px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-full border ${cls}`}>
            {status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
            {label}
        </span>
    );
};

// ─── Arte Banner ─────────────────────────────────────────────────────────────
const ArteBanner: React.FC<{ training: LiveTraining }> = ({ training }) => {
    const gradients: Record<string, string> = {
        Treinamento: 'from-[#050B14] via-[#0a1628] to-[#0d2040]',
        Evento:      'from-[#0f0a00] via-[#1a1200] to-[#2a1e00]',
    };

    if (training.artUrl) {
        return (
            <div className="relative w-full h-44 overflow-hidden">
                <img src={training.artUrl} alt={training.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute top-3 right-3 font-label text-[9px] font-bold text-white bg-black/40 border border-white/20 rounded-full px-3 py-1 backdrop-blur-sm">
                    {formatDate(training.scheduledAt)}
                </span>
            </div>
        );
    }

    const isEvento = training.type === 'Evento';
    return (
        <div className={`relative w-full h-44 bg-gradient-to-br ${gradients[training.type] || gradients.Treinamento} flex items-center justify-center overflow-hidden`}>
            {/* Glow */}
            <div className={`absolute inset-0 ${isEvento ? 'bg-yellow-500/5' : 'bg-primary/5'}`} />
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-3xl ${isEvento ? 'bg-yellow-500/10' : 'bg-primary/10'}`} />

            <div className="text-center px-6 relative z-10">
                <p className="font-label text-[8px] tracking-[0.4em] uppercase text-white/30 mb-2">ATL Academy</p>
                <p className={`font-headline text-xl font-bold text-white mb-1`}>{training.presenter}</p>
                <p className={`font-label text-[10px] tracking-wider uppercase ${isEvento ? 'text-yellow-400/70' : 'text-primary/70'}`}>{training.type}</p>
            </div>

            <span className="absolute top-3 right-3 font-label text-[9px] font-bold text-white/60 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                {formatDate(training.scheduledAt)}
            </span>
        </div>
    );
};

// ─── WhatsApp Share ───────────────────────────────────────────────────────────
function buildWhatsAppUrl(training: LiveTraining): string {
    const emoji  = training.type === 'Evento' ? '🎉' : '🎓';
    const status = getStatus(training.scheduledAt);

    const lines = [
        `${emoji} *${training.type.toUpperCase()} ATL ACADEMY*`,
        ``,
        `📌 *${training.title}*`,
        `👤 ${training.presenter}`,
        `📅 ${formatDate(training.scheduledAt)}`,
    ];

    if (status === 'live') {
        lines.push(``, `🔴 *Está acontecendo AGORA!*`);
    } else if (status === 'today') {
        lines.push(``, `⏰ *Acontece hoje!*`);
    }

    if (training.liveUrl) {
        lines.push(``, `▶️ Acesse: ${training.liveUrl}`);
    }

    if (training.description) {
        lines.push(``, training.description);
    }

    lines.push(``, `_ATL Academy — Conhecimento que transforma._`);

    return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
const TrainingModal: React.FC<{ training: LiveTraining; onClose: () => void }> = ({ training, onClose }) => {
    const status    = getStatus(training.scheduledAt);
    const countdown = formatCountdown(training.scheduledAt);
    const isEvento  = training.type === 'Evento';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }}
                className="w-full max-w-sm rounded-[1.75rem] overflow-hidden border border-white/10"
                style={{ background: 'rgba(5,8,15,0.98)', backdropFilter: 'blur(40px)' }}
                onClick={e => e.stopPropagation()}
            >
                <ArteBanner training={training} />

                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <span className={`font-label text-[8px] tracking-[0.3em] uppercase font-bold mb-2 block ${isEvento ? 'text-yellow-400/70' : 'text-primary/70'}`}>
                                {training.type}
                            </span>
                            <h2 className="font-headline text-lg font-bold text-white leading-tight">{training.title}</h2>
                            <p className="text-white/40 text-xs mt-0.5">{training.presenter}</p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors ml-3 shrink-0">
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    </div>

                    <StatusBadge status={status} />

                    {/* Info */}
                    <div className="mt-4 space-y-2.5">
                        <div className="flex items-center gap-3 text-sm text-white/40">
                            <span className="material-symbols-outlined text-[16px] text-white/20">calendar_today</span>
                            {formatDate(training.scheduledAt)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/40">
                            <span className="material-symbols-outlined text-[16px] text-white/20">person</span>
                            {training.presenter}
                        </div>
                        {training.description && (
                            <p className="text-white/30 text-xs leading-relaxed pt-1">{training.description}</p>
                        )}
                    </div>

                    {countdown && (
                        <div className="mt-4 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                            <span className="font-label text-[9px] uppercase tracking-widest text-white/30">Começa em</span>
                            <span className={`font-headline text-base font-bold ${isEvento ? 'text-yellow-400' : 'text-primary'}`}>{countdown}</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2 mt-5">
                        {training.liveUrl && (
                            <a
                                href={training.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-label text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 ${isEvento ? 'bg-yellow-400/10 hover:bg-yellow-400 hover:text-black border border-yellow-400/20 hover:border-yellow-400 text-yellow-400' : 'bg-primary/10 hover:bg-primary hover:text-black border border-primary/20 hover:border-primary text-primary'} shadow-none hover:shadow-[0_0_20px_rgba(0,240,255,0.25)]`}
                            >
                                <span className="material-symbols-outlined text-[16px]">play_circle</span>
                                Entrar na live
                            </a>
                        )}
                        {status === 'finished' && training.recordingUrl && (
                            <a
                                href={training.recordingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-label text-[10px] font-bold tracking-[0.2em] uppercase bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/60 transition-all duration-300"
                            >
                                <span className="material-symbols-outlined text-[16px]">movie</span>
                                Assistir gravação
                            </a>
                        )}
                        {training.artUrl && (
                            <a
                                href={training.artUrl}
                                download
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-label text-[10px] font-bold tracking-[0.2em] uppercase bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/60 transition-all duration-300"
                            >
                                <span className="material-symbols-outlined text-[16px]">download</span>
                                Baixar arte
                            </a>
                        )}
                        {training.scheduledAt > Date.now() && (
                            <a
                                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(training.title)}&dates=${new Date(training.scheduledAt).toISOString().replace(/[-:]/g,'').split('.')[0]}Z`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-label text-[10px] font-bold tracking-[0.2em] uppercase bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/40 transition-all duration-300"
                            >
                                <span className="material-symbols-outlined text-[16px]">event</span>
                                Adicionar ao Google Agenda
                            </a>
                        )}

                        {/* WhatsApp Share */}
                        <a
                            href={buildWhatsAppUrl(training)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-label text-[10px] font-bold tracking-[0.2em] uppercase bg-[#25D366]/10 hover:bg-[#25D366] hover:text-black border border-[#25D366]/20 hover:border-[#25D366] text-[#25D366] transition-all duration-300"
                        >
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Compartilhar no WhatsApp
                        </a>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── Calendário ───────────────────────────────────────────────────────────────
const CalendarView: React.FC<{
    trainings: LiveTraining[];
    year: number;
    month: number;
    onSelect: (t: LiveTraining) => void;
}> = ({ trainings, year, month, onSelect }) => {
    const firstDay   = new Date(year, month, 1);
    const startDow   = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today      = new Date();

    const byDay = useMemo(() => {
        const map: Record<number, LiveTraining[]> = {};
        trainings.forEach(t => {
            const d = new Date(t.scheduledAt);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                if (!map[day]) map[day] = [];
                map[day].push(t);
            }
        });
        return map;
    }, [trainings, year, month]);

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const pillColor: Record<string, string> = {
        Treinamento: 'bg-primary/15 text-primary/90 border-primary/20',
        Evento:      'bg-yellow-400/10 text-yellow-400/80 border-yellow-400/20',
    };

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < Math.ceil(cells.length / 7); i++) {
        weeks.push(cells.slice(i * 7, i * 7 + 7));
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => (
                    <div key={d} className="text-center font-label text-[9px] uppercase tracking-[0.2em] text-white/20 py-2">
                        {d}
                    </div>
                ))}
            </div>
            {/* Weeks */}
            <div className="border border-white/[0.06] rounded-2xl overflow-hidden">
                {weeks.map((week, wi) => (
                    <div key={wi} className={`grid grid-cols-7 ${wi < weeks.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                        {week.map((day, di) => {
                            const isToday = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                            const events  = day ? byDay[day] || [] : [];
                            return (
                                <div
                                    key={di}
                                    onClick={() => events.length && onSelect(events[0])}
                                    className={[
                                        'min-h-[72px] p-1.5 relative transition-colors duration-200',
                                        di < 6 ? 'border-r border-white/[0.04]' : '',
                                        !day     ? 'bg-white/[0.01]' : '',
                                        isToday  ? 'bg-primary/[0.04]' : '',
                                        events.length && day ? 'cursor-pointer hover:bg-white/[0.03]' : '',
                                    ].join(' ')}
                                >
                                    {day && (
                                        <>
                                            <span className={`font-label text-[10px] font-semibold block mb-1 ${isToday ? 'text-primary' : 'text-white/25'}`}>
                                                {day}
                                            </span>
                                            {events.map(t => (
                                                <span
                                                    key={t.id}
                                                    className={`block truncate font-label text-[9px] font-semibold rounded-md px-1.5 py-0.5 mb-0.5 border ${pillColor[t.type] || pillColor.Treinamento}`}
                                                >
                                                    {t.type === 'Evento' ? t.title : t.presenter}
                                                </span>
                                            ))}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Página principal ─────────────────────────────────────────────────────────
const TreinamentosAoVivo: React.FC = () => {
    const [trainings, setTrainings] = useState<LiveTraining[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [filter,    setFilter]    = useState<string>('Todos');
    const [selected,  setSelected]  = useState<LiveTraining | null>(null);
    const [curDate,   setCurDate]   = useState(new Date());

    const year  = curDate.getFullYear();
    const month = curDate.getMonth();

    useEffect(() => {
        supabase
            .from('live_trainings')
            .select('*')
            .order('scheduledAt', { ascending: true })
            .then(({ data }) => {
                setTrainings((data as LiveTraining[]) || []);
                setLoading(false);
            });
    }, []);

    const filtered = useMemo(() =>
        filter === 'Todos' ? trainings : trainings.filter(t => t.type === filter),
    [trainings, filter]);

    const nextTraining = useMemo(() =>
        trainings.find(t => t.scheduledAt > Date.now()),
    [trainings]);

    const countdown = nextTraining ? formatCountdown(nextTraining.scheduledAt) : null;

    return (
        <div className="bg-[#030303] text-white/90 min-h-screen font-body relative overflow-x-hidden">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[#030303]" />
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-blue-500/5 blur-3xl" />
                <div className="dot-grid absolute inset-0 opacity-[0.03]" />
            </div>

            <Navbar />

            <main className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-32 md:pt-40 pb-24">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.16,1,0.3,1] }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary text-[18px]">live_tv</span>
                        <span className="font-label text-[10px] tracking-[4px] uppercase text-primary/80">ATL Academy</span>
                    </div>
                    <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50">
                        Treinamentos ao Vivo
                    </h1>
                    <p className="text-white/40 text-sm md:text-base mt-4 max-w-2xl leading-relaxed">
                        Acompanhe a programação completa de treinamentos e eventos. Acesse as lives, baixe materiais e nunca perca um treinamento.
                    </p>
                </motion.div>

                {/* Hero — Próximo Treinamento */}
                {nextTraining && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: [0.16,1,0.3,1] }}
                        className="mb-10"
                    >
                        <div
                            onClick={() => setSelected(nextTraining)}
                            className="liquid-glass-soft rounded-3xl border-white/5 hover:border-primary/20 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer transition-all duration-300 group"
                        >
                            <div>
                                <span className="font-label text-[8px] tracking-[0.4em] uppercase text-primary/60 block mb-3">
                                    🔴 Próximo treinamento
                                </span>
                                <h2 className="font-headline text-2xl md:text-3xl font-bold text-white group-hover:text-primary transition-colors duration-300">
                                    {nextTraining.presenter}
                                </h2>
                                <p className="text-white/40 text-sm mt-1">
                                    {nextTraining.type} · {formatDate(nextTraining.scheduledAt)}
                                </p>
                                {nextTraining.liveUrl && (
                                    <a
                                        href={nextTraining.liveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="inline-flex items-center gap-2 mt-4 bg-primary/10 hover:bg-primary hover:text-black border border-primary/20 hover:border-primary text-primary font-label text-[10px] font-bold tracking-[0.2em] uppercase px-5 py-2.5 rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                                    >
                                        <span className="material-symbols-outlined text-[15px]">play_circle</span>
                                        Entrar na live
                                    </a>
                                )}
                            </div>

                            {countdown && (
                                <div className="shrink-0 text-right">
                                    <p className="font-label text-[9px] uppercase tracking-widest text-white/20 mb-1">Começa em</p>
                                    <p className="font-headline text-3xl md:text-4xl font-bold text-primary tabular-nums">
                                        {countdown}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Filtros + Calendário */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: [0.16,1,0.3,1] }}
                >
                    {/* Filtros */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                        <div className="flex gap-2">
                            {['Todos','Treinamentos','Eventos'].map(f => {
                                const val = f === 'Treinamentos' ? 'Treinamento' : f === 'Eventos' ? 'Evento' : 'Todos';
                                const active = filter === val;
                                return (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(val)}
                                        className={`px-5 py-2 rounded-full font-label text-[9px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 border ${active ? 'bg-primary text-black border-primary shadow-[0_0_20px_rgba(0,240,255,0.25)]' : 'text-white/40 border-white/10 bg-white/[0.02] hover:text-white hover:bg-white/5'}`}
                                    >
                                        {f}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Nav mês */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setCurDate(new Date(year, month - 1, 1))}
                                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                            </button>
                            <span className="font-headline text-base font-bold text-white min-w-[160px] text-center">
                                {MONTHS[month]} {year}
                            </span>
                            <button
                                onClick={() => setCurDate(new Date(year, month + 1, 1))}
                                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    {/* Calendário */}
                    {loading ? (
                        <div className="py-24 flex flex-col items-center gap-4">
                            <div className="w-12 h-12 rounded-full border-t-2 border-primary border-r-2 animate-spin" />
                            <p className="text-white/30 font-label text-[10px] uppercase tracking-widest">Carregando treinamentos...</p>
                        </div>
                    ) : (
                        <CalendarView
                            trainings={filtered}
                            year={year}
                            month={month}
                            onSelect={setSelected}
                        />
                    )}

                    {/* Legenda */}
                    <div className="flex items-center gap-6 mt-5">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-sm bg-primary/20 border border-primary/30" />
                            <span className="font-label text-[9px] uppercase tracking-wider text-white/30">Treinamento</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400/15 border border-yellow-400/25" />
                            <span className="font-label text-[9px] uppercase tracking-wider text-white/30">Evento</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-sm bg-primary/5 border border-primary/15" />
                            <span className="font-label text-[9px] uppercase tracking-wider text-white/30">Hoje</span>
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* Modal */}
            <AnimatePresence>
                {selected && (
                    <TrainingModal training={selected} onClose={() => setSelected(null)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default TreinamentosAoVivo;
