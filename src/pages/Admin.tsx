import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useData, type Course } from '../context/DataContext';
import Navbar from '../components/Navbar';
import { getYouTubeId, getYouTubeThumbnail, getYouTubeDuration, loadYouTubeAPI, fmtDuration } from '../lib/youtube';

// ── Image compression ──────────────────────────────────────────────────────
const compressImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            if (w > 1280) { h = h * 1280 / w; w = 1280; }
            if (h > 720) { w = w * 720 / h; h = 720; }
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx ? (ctx.drawImage(img, 0, 0, w, h), resolve(canvas.toDataURL('image/jpeg', 0.85))) : resolve(event.target?.result as string);
        };
        img.onerror = reject;
    };
    reader.onerror = reject;
});

// ── Icon data ──────────────────────────────────────────────────────────────
const ICONS = [
    { i: 'business_center', l: 'Negócios' }, { i: 'trending_up', l: 'Crescimento' },
    { i: 'analytics', l: 'Analytics' }, { i: 'insights', l: 'Insights' },
    { i: 'monetization_on', l: 'Finanças' }, { i: 'account_balance', l: 'Banco' },
    { i: 'savings', l: 'Poupança' }, { i: 'groups', l: 'Equipes' },
    { i: 'psychology', l: 'Psicologia' }, { i: 'handshake', l: 'Parceria' },
    { i: 'emoji_events', l: 'Conquistas' }, { i: 'military_tech', l: 'Medalha' },
    { i: 'workspace_premium', l: 'Premium' }, { i: 'star', l: 'Estrela' },
    { i: 'terminal', l: 'Código' }, { i: 'code', l: 'Dev' },
    { i: 'cloud', l: 'Cloud' }, { i: 'hub', l: 'Hub' },
    { i: 'memory', l: 'IA/Tech' }, { i: 'security', l: 'Segurança' },
    { i: 'wifi', l: 'Rede' }, { i: 'smartphone', l: 'Mobile' },
    { i: 'school', l: 'Escola' }, { i: 'menu_book', l: 'Livro' },
    { i: 'article', l: 'Artigo' }, { i: 'play_lesson', l: 'Aula' },
    { i: 'video_library', l: 'Vídeos' }, { i: 'mic', l: 'Podcast' },
    { i: 'record_voice_over', l: 'Palestrante' }, { i: 'co_present', l: 'Apresentação' },
    { i: 'campaign', l: 'Marketing' }, { i: 'language', l: 'Web' },
    { i: 'public', l: 'Global' }, { i: 'share', l: 'Social' },
    { i: 'ads_click', l: 'Ads' }, { i: 'rocket_launch', l: 'Lançamento' },
    { i: 'lightbulb', l: 'Ideia' }, { i: 'architecture', l: 'Arquitetura' },
    { i: 'settings', l: 'Processos' }, { i: 'checklist', l: 'Checklist' },
    { i: 'timer', l: 'Produtividade' }, { i: 'bolt', l: 'Velocidade' },
    { i: 'self_improvement', l: 'Mindset' }, { i: 'fitness_center', l: 'Saúde' },
    { i: 'local_fire_department', l: 'Motivação' }, { i: 'bar_chart', l: 'Dados' },
    { i: 'manage_search', l: 'Pesquisa' }, { i: 'biotech', l: 'Ciência' },
];

// ── Portal Icon Picker ─────────────────────────────────────────────────────
const IconPicker: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [pos, setPos] = useState({ top: 0, left: 0, width: 320 });
    const btnRef = useRef<HTMLButtonElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);

    const openPicker = () => {
        if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            const dropH = 320;
            const spaceBelow = window.innerHeight - r.bottom;
            // Use viewport coords directly (position: fixed doesn't need scrollY offset)
            const top = spaceBelow >= dropH ? r.bottom + 8 : r.top - dropH - 8;
            setPos({ top, left: r.left, width: Math.max(r.width, 380) });
        }
        setOpen(true);
    };

    useEffect(() => {
        if (!open) return;
        const fn = (e: MouseEvent) => {
            if (!btnRef.current?.contains(e.target as Node) && !dropRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, [open]);

    const filtered = search ? ICONS.filter(x => x.l.toLowerCase().includes(search.toLowerCase()) || x.i.includes(search)) : ICONS;
    const label = ICONS.find(x => x.i === value)?.l ?? 'Selecionar ícone';

    return (
        <>
            <div>
                <label className="font-label text-[9px] uppercase text-white/40 block mb-1.5">Ícone do Módulo</label>
                <button ref={btnRef} type="button" onClick={openPicker}
                    className="w-full flex items-center gap-3 bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 hover:border-primary/40 transition-all">
                    <span className="material-symbols-outlined text-primary text-xl">{value || 'play_lesson'}</span>
                    <span className="text-white/60 text-sm flex-1 text-left">{label}</span>
                    <span className="material-symbols-outlined text-white/30 text-base">{open ? 'expand_less' : 'expand_more'}</span>
                </button>
            </div>
            {open && createPortal(
                <div ref={dropRef} style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 99999 }}
                    className="bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-3 border-b border-white/5">
                        <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ícone..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50" />
                    </div>
                    <div className="grid grid-cols-6 gap-1 p-3 max-h-56 overflow-y-auto">
                        {filtered.map(({ i, l }) => (
                            <button key={i} type="button" title={l} onClick={() => { onChange(i); setOpen(false); setSearch(''); }}
                                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all hover:bg-primary/10 border ${value === i ? 'bg-primary/10 border-primary/20' : 'border-transparent'}`}>
                                <span className={`material-symbols-outlined text-xl ${value === i ? 'text-primary' : 'text-white/50'}`}>{i}</span>
                                <span className="text-[7px] text-white/30 font-label text-center leading-tight">{l}</span>
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

// ── Video URL Input with YouTube detection ─────────────────────────────────
const VideoUrlInput: React.FC<{
    value: string;
    onUrlChange: (url: string) => void;
    onDurationDetected: (d: string, secs: number) => void;
    onThumbnailDetected: (url: string) => void;
}> = ({ value, onUrlChange, onDurationDetected, onThumbnailDetected }) => {
    const [status, setStatus] = useState<'idle' | 'detecting' | 'youtube' | 'mp4' | 'error'>('idle');

    const handleChange = async (raw: string) => {
        onUrlChange(raw);
        setStatus('idle');
        if (!raw) return;

        const ytId = getYouTubeId(raw);
        if (ytId) {
            setStatus('detecting');
            onThumbnailDetected(getYouTubeThumbnail(ytId));
            try {
                const secs = await getYouTubeDuration(ytId);
                if (secs > 0) { onDurationDetected(fmtDuration(secs), secs); }
            } catch { }
            setStatus('youtube');
            return;
        }

        if (raw.match(/\.(mp4|webm|ogg)/i)) {
            setStatus('detecting');
            const video = document.createElement('video');
            video.src = raw;
            video.onloadedmetadata = () => { onDurationDetected(fmtDuration(video.duration), video.duration); setStatus('mp4'); };
            video.onerror = () => setStatus('error');
        }
    };

    return (
        <div className="space-y-2">
            <label className="font-label text-[9px] uppercase text-white/40 flex justify-between items-center">
                <span>URL do Vídeo</span>
                {status === 'detecting' && <span className="text-white/40 text-[8px] animate-pulse">Detectando duração...</span>}
                {status === 'youtube' && <span className="text-red-400 text-[8px] flex items-center gap-1"><span className="material-symbols-outlined text-[11px]">smart_display</span>YouTube · duração detectada</span>}
                {status === 'mp4' && <span className="text-primary text-[8px] flex items-center gap-1"><span className="material-symbols-outlined text-[11px]">check_circle</span>Duração detectada</span>}
                {status === 'error' && <span className="text-red-400 text-[8px]">Erro ao carregar vídeo</span>}
            </label>
            <input
                className={`w-full bg-black/50 border rounded-xl px-4 py-3.5 focus:outline-none transition-all text-sm ${status === 'youtube' ? 'border-red-500/40' : status === 'mp4' ? 'border-primary/40' : 'border-white/10 focus:border-primary'}`}
                value={value}
                onChange={e => handleChange(e.target.value)}
                placeholder="https://youtube.com/watch?v=... ou .mp4"
            />
        </div>
    );
};

// ── Admin Panel ────────────────────────────────────────────────────────────
const Admin: React.FC = () => {
    const { courses, sectors, articles, addCourse, updateCourse, deleteCourse, addSector, updateSector, deleteSector, addArticle, updateArticle, deleteArticle } = useData();
    const navigate = useNavigate();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (localStorage.getItem('atl_admin_is_master') === 'true') setIsAuthenticated(true);
        loadYouTubeAPI(); // pre-load API
    }, []);

    const [isEditingCourse, setIsEditingCourse] = useState(false);
    const [cur, setCur] = useState<Partial<Course>>({});

    const [newSectorName, setNewSectorName] = useState('');
    const [editingSectorId, setEditingSectorId] = useState<string | null>(null);
    const [editingSectorName, setEditingSectorName] = useState('');

    const [isEditingArticle, setIsEditingArticle] = useState(false);
    const [curArticle, setCurArticle] = useState<{ id?: string; sectorId: string; title: string; content: string; author: string }>({ sectorId: '', title: '', content: '', author: 'ATL Academy' });

    // Tags helper: convert comma-separated string ↔ string[]
    const tagsToStr = (tags?: string[]) => (tags || []).join(', ');
    const strToTags = (s: string): string[] => s.split(',').map(t => t.trim()).filter(Boolean);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'juliano.atl' && password === 'Temp482*') {
            localStorage.setItem('atl_admin_is_master', 'true');
            window.location.reload();
        } else setError('Credenciais inválidas. Acesso negado.');
    };

    const handleLogout = () => {
        localStorage.removeItem('atl_admin_is_master');
        navigate('/login');
    };

    const handleSaveCourse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cur.title || !cur.instructor) return;
        if (cur.id) { updateCourse(cur.id, cur as Course); }
        else {
            addCourse({
                title: cur.title!, instructor: cur.instructor!, duration: cur.duration || '00h 00m',
                icon: cur.icon || 'play_lesson', progress: 0, videoUrl: cur.videoUrl || '',
                thumbnailUrl: cur.thumbnailUrl || '', description: cur.description,
                instructorTitle: cur.instructorTitle, tags: cur.tags,
            });
        }
        setIsEditingCourse(false);
        setCur({});
    };

    // ── RESTRICTED SCREEN ──
    if (!isAuthenticated) {
        return (
            <div className="bg-[#030303] min-h-screen flex items-center justify-center font-body">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[#030303]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-3xl"></div>
                    <div className="dot-grid absolute inset-0 opacity-[0.03]"></div>
                </div>
                <div className="relative z-10 w-full max-w-[400px] p-6">
                    <div className="liquid-glass p-10 flex flex-col items-center space-y-8 border-red-500/20 shadow-[0_20px_60px_rgba(255,0,0,0.1)]">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <span className="material-symbols-outlined text-red-500 text-3xl">admin_panel_settings</span>
                        </div>
                        <div className="text-center space-y-2">
                            <h1 className="font-headline text-2xl font-bold text-white tracking-tight">Área Restrita</h1>
                            <p className="text-white/40 text-xs font-label tracking-widest uppercase">Acesso Nível Administrador</p>
                        </div>
                        <form onSubmit={handleLogin} className="w-full space-y-4">
                            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs text-center">{error}</div>}
                            <input className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-all text-sm" placeholder="Usuário Master" value={username} onChange={e => setUsername(e.target.value)} required />
                            <input className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-all text-sm" placeholder="Senha de Acesso" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                            <button type="submit" className="w-full bg-white text-black font-headline font-bold py-4 rounded-xl text-xs tracking-[2px] hover:bg-red-500 hover:text-white transition-all uppercase">Verificar Credenciais</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // ── ADMIN PANEL ──
    return (
        <div className="bg-[#030303] text-white/90 min-h-screen font-body relative pb-32">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[#030303]"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-3xl"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.03]"></div>
            </div>
            <Navbar />

            <main className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-10 py-24 md:py-32 space-y-10 md:space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6 md:pb-8">
                    <div>
                        <h1 className="font-headline text-3xl md:text-5xl font-bold uppercase tracking-tight text-white/90">Central de Comando</h1>
                        <p className="font-label text-[9px] md:text-xs text-white/40 tracking-[3px] uppercase mt-1">Gerenciamento de Conteúdo Global</p>
                    </div>
                    <button onClick={handleLogout} className="w-full md:w-auto px-6 py-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/10 transition-colors uppercase font-label text-[10px] tracking-[2px] flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">exit_to_app</span> Sair do Painel
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
                    {/* Courses */}
                    <section className="lg:col-span-2 space-y-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <h2 className="font-headline text-xl font-bold uppercase tracking-tight">Módulos Inteligentes</h2>
                            <button onClick={() => { setCur({ icon: 'play_lesson' }); setIsEditingCourse(true); }} className="w-full sm:w-auto premium-pill py-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-black transition-all">+ Novo Módulo</button>
                        </div>

                        {isEditingCourse && (
                            <div className="liquid-glass-soft p-6 md:p-8 space-y-6 border-primary/20">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-headline text-lg text-primary uppercase">{cur.id ? 'Editar' : 'Novo'} Módulo</h3>
                                    <button type="button" onClick={() => { setIsEditingCourse(false); setCur({}); }} className="text-white/40 hover:text-white font-label text-[10px] uppercase tracking-widest">Cancelar</button>
                                </div>

                                <form onSubmit={handleSaveCourse} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* LEFT */}
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="font-label text-[9px] uppercase text-white/40">Título *</label>
                                                <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all" value={cur.title || ''} onChange={e => setCur({ ...cur, title: e.target.value })} required placeholder="Ex: Estratégia de Vendas" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="font-label text-[9px] uppercase text-white/40">Instrutor *</label>
                                                <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all" value={cur.instructor || ''} onChange={e => setCur({ ...cur, instructor: e.target.value })} required placeholder="Nome do instrutor" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="font-label text-[9px] uppercase text-white/40">Cargo do Instrutor</label>
                                                <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all" value={cur.instructorTitle || ''} onChange={e => setCur({ ...cur, instructorTitle: e.target.value })} placeholder="Ex: CEO da ATL Academy" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="font-label text-[9px] uppercase text-white/40 flex justify-between"><span>Duração</span><span className="text-primary/50 text-[8px]">Auto-preenchida</span></label>
                                                <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all" value={cur.duration || ''} onChange={e => setCur({ ...cur, duration: e.target.value })} placeholder="Ex: 1h 30m" />
                                            </div>
                                            <IconPicker value={cur.icon || 'play_lesson'} onChange={icon => setCur({ ...cur, icon })} />
                                        </div>

                                        {/* RIGHT */}
                                        <div className="space-y-4">
                                            <VideoUrlInput
                                                value={cur.videoUrl || ''}
                                                onUrlChange={url => setCur({ ...cur, videoUrl: url })}
                                                onDurationDetected={(duration, totalSeconds) => setCur(p => ({ ...p, duration, totalSeconds }))}
                                                onThumbnailDetected={thumbnailUrl => setCur(p => ({ ...p, thumbnailUrl }))}
                                            />
                                            <div className="space-y-1.5">
                                                <label className="font-label text-[9px] uppercase text-white/40 flex justify-between"><span>Thumbnail</span><span className="text-primary/40 text-[8px]">Auto-preenchida p/ YouTube</span></label>
                                                <div className="flex gap-2">
                                                    <input className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all text-sm" value={cur.thumbnailUrl || ''} onChange={e => setCur({ ...cur, thumbnailUrl: e.target.value })} placeholder="URL ou faça upload" />
                                                    <label className="cursor-pointer px-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
                                                        <span className="material-symbols-outlined text-base">upload</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={async e => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            if (file.size > 20 * 1024 * 1024) { alert('Máximo 20MB'); return; }
                                                            try { setCur({ ...cur, thumbnailUrl: await compressImage(file) }); } catch { alert('Erro ao processar imagem.'); }
                                                        }} />
                                                    </label>
                                                </div>
                                                {cur.thumbnailUrl && (
                                                    <div className="relative aspect-video rounded-2xl border border-white/10 overflow-hidden bg-black/40 group mt-2">
                                                        <img src={cur.thumbnailUrl} className="w-full h-full object-cover opacity-60 mix-blend-luminosity grayscale" alt="" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                                        <button type="button" onClick={() => setCur({ ...cur, thumbnailUrl: '' })} className="absolute bottom-2 right-2 text-red-400 hover:text-red-300">
                                                            <span className="material-symbols-outlined text-base">delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description & Tags */}
                                    <div className="space-y-4 border-t border-white/5 pt-5">
                                        <div className="space-y-1.5">
                                            <label className="font-label text-[9px] uppercase text-white/40">Conteúdo da Sessão (descrição)</label>
                                            <textarea className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all text-sm resize-none" rows={3} value={cur.description || ''} onChange={e => setCur({ ...cur, description: e.target.value })} placeholder="Descreva o conteúdo desta aula para os alunos..." />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-label text-[9px] uppercase text-white/40">Tags / Filtros <span className="normal-case text-white/20 tracking-normal">(separados por vírgula)</span></label>
                                            <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all text-sm" value={tagsToStr(cur.tags)} onChange={e => setCur({ ...cur, tags: strToTags(e.target.value) })} placeholder="Ex: 4K Ultra HD, Dolby Atmos, Legendas PT" />
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full bg-white text-black font-bold uppercase rounded-xl py-4 text-xs tracking-[2px] hover:bg-primary transition-all shadow-lg">Salvar Módulo</button>
                                </form>
                            </div>
                        )}

                        {/* List */}
                        <div className="space-y-4">
                            {courses.map(course => (
                                <div key={course.id} className="liquid-glass-soft p-4 md:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between border-white/5 hover:bg-white/[0.03] group transition-all">
                                    <div className="flex gap-4 items-center flex-1">
                                        <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center border border-white/10 relative overflow-hidden shrink-0">
                                            {course.thumbnailUrl && <img src={course.thumbnailUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" alt="" />}
                                            <span className="material-symbols-outlined text-white/60 text-2xl font-light relative z-10 group-hover:text-primary transition-colors">{course.icon}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-headline text-base font-bold text-white truncate">{course.title}</h4>
                                            <div className="flex items-center gap-3 mt-1 font-label text-[9px] text-white/40 uppercase tracking-widest flex-wrap">
                                                <span className="truncate max-w-[120px]">{course.instructor}</span>
                                                <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                                <span>{course.duration}</span>
                                                {getYouTubeId(course.videoUrl || '') && <span className="text-red-400 flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">smart_display</span>YT</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => { setCur(course); setIsEditingCourse(true); }} className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-label text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5">
                                            <span className="material-symbols-outlined text-[16px]">edit</span><span className="hidden sm:inline">Editar</span>
                                        </button>
                                        <button onClick={() => deleteCourse(course.id)} className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/20 font-label text-[9px] uppercase tracking-widest transition-all flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">delete</span><span className="hidden sm:inline">Excluir</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Sectors */}
                    <aside className="space-y-6">
                        <h2 className="font-headline text-xl font-bold uppercase tracking-tight">Setores Ativos</h2>
                        <form onSubmit={e => { e.preventDefault(); if (newSectorName.trim()) { addSector(newSectorName); setNewSectorName(''); } }} className="liquid-glass-soft p-5 space-y-4 border-white/5">
                            <label className="font-label text-[9px] uppercase text-white/40">Adicionar Novo Setor</label>
                            <div className="flex gap-2">
                                <input value={newSectorName} onChange={e => setNewSectorName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm transition-all" placeholder="Nome do Setor..." />
                                <button type="submit" className="bg-white text-black px-4 rounded-xl hover:bg-primary transition-all shrink-0"><span className="material-symbols-outlined">add</span></button>
                            </div>
                        </form>
                        <div className="liquid-glass-soft p-4 space-y-2 border-white/5">
                            {sectors.map(sector => (
                                <div key={sector.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.05] transition-all group gap-2">
                                    {editingSectorId === sector.id ? (
                                        <input autoFocus value={editingSectorName} onChange={e => setEditingSectorName(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { updateSector(sector.id, editingSectorName); setEditingSectorId(null); } if (e.key === 'Escape') setEditingSectorId(null); }}
                                            onBlur={() => { updateSector(sector.id, editingSectorName); setEditingSectorId(null); }}
                                            className="flex-1 bg-black/50 border border-primary/40 rounded-lg px-3 py-1.5 text-sm outline-none text-white" />
                                    ) : (
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary shrink-0" />
                                            <span className="text-sm text-white/80 truncate">{sector.name}</span>
                                        </div>
                                    )}
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={() => { setEditingSectorId(sector.id); setEditingSectorName(sector.name); }} className="text-white/20 hover:text-white p-1"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                                        <button onClick={() => deleteSector(sector.id)} className="text-white/20 hover:text-red-400 p-1"><span className="material-symbols-outlined text-[16px]">close</span></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>

                {/* Intelligence Hub */}
                <section className="space-y-6 border-t border-white/10 pt-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="font-headline text-xl font-bold uppercase tracking-tight">Hub de Inteligência</h2>
                            <p className="font-label text-[10px] text-white/30 tracking-widest uppercase mt-1">Tutoriais e artigos por setor</p>
                        </div>
                        <button onClick={() => { setCurArticle({ sectorId: sectors[0]?.id || '', title: '', content: '', author: 'ATL Academy' }); setIsEditingArticle(true); }} className="w-full sm:w-auto premium-pill py-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-black transition-all">+ Novo Artigo</button>
                    </div>

                    {isEditingArticle && (
                        <div className="liquid-glass-soft p-6 md:p-8 space-y-5 border-primary/20">
                            <div className="flex items-center justify-between">
                                <h3 className="font-headline text-lg text-primary uppercase">{curArticle.id ? 'Editar' : 'Novo'} Artigo</h3>
                                <button onClick={() => setIsEditingArticle(false)} className="text-white/40 hover:text-white font-label text-[10px] uppercase tracking-widest">Cancelar</button>
                            </div>
                            <form onSubmit={e => { e.preventDefault(); if (!curArticle.title || !curArticle.sectorId || !curArticle.content) return; if (curArticle.id) { updateArticle(curArticle.id, curArticle); } else { addArticle({ sectorId: curArticle.sectorId, title: curArticle.title, content: curArticle.content, author: curArticle.author }); } setIsEditingArticle(false); setCurArticle({ sectorId: '', title: '', content: '', author: 'ATL Academy' }); }} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Setor *</label>
                                        <select value={curArticle.sectorId} onChange={e => setCurArticle(p => ({ ...p, sectorId: e.target.value }))} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm text-white">
                                            <option value="" disabled>Selecionar Setor...</option>
                                            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Autor</label>
                                        <input value={curArticle.author} onChange={e => setCurArticle(p => ({ ...p, author: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm transition-all" placeholder="ATL Academy" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Título *</label>
                                    <input value={curArticle.title} onChange={e => setCurArticle(p => ({ ...p, title: e.target.value }))} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Conteúdo *</label>
                                    <textarea value={curArticle.content} onChange={e => setCurArticle(p => ({ ...p, content: e.target.value }))} required rows={8} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm resize-y font-mono" />
                                </div>
                                <button type="submit" className="px-8 py-3.5 bg-primary text-black font-label font-bold text-[10px] uppercase tracking-[2px] rounded-xl hover:bg-white transition-all">Publicar Artigo</button>
                            </form>
                        </div>
                    )}

                    {articles.length === 0 ? (
                        <div className="liquid-glass-soft p-10 text-center border-white/5">
                            <span className="material-symbols-outlined text-white/10 text-5xl block mb-3">article</span>
                            <p className="text-white/20 font-label text-[10px] tracking-widest uppercase">Nenhum artigo publicado ainda</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {articles.map(article => {
                                const sector = sectors.find(s => s.id === article.sectorId);
                                return (
                                    <div key={article.id} className="liquid-glass-soft p-5 flex flex-col gap-3 border-white/5 hover:border-white/10 transition-all">
                                        {sector && <span className="text-[9px] tracking-widest uppercase font-label text-primary/70">{sector.name}</span>}
                                        <h4 className="font-headline text-base font-bold text-white leading-tight">{article.title}</h4>
                                        <p className="text-white/30 text-xs leading-relaxed flex-1 line-clamp-2">{article.content.replace(/\*\*/g, '').split('\n').filter(l => l.trim())[0]}</p>
                                        <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
                                            <span className="text-white/20 font-label text-[9px] tracking-widest uppercase">{article.author}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setCurArticle({ id: article.id, sectorId: article.sectorId, title: article.title, content: article.content, author: article.author }); setIsEditingArticle(true); }} className="text-white/30 hover:text-white p-1"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                                                <button onClick={() => deleteArticle(article.id)} className="text-white/20 hover:text-red-400 p-1"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Admin;
