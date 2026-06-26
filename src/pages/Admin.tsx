import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useData, type Course, type Lesson, type Newsletter, type SupportMaterial } from '../context/DataContext';
import Navbar from '../components/Navbar';
import TreinamentosAdmin from '../components/TreinamentosAdmin';
import { getYouTubeId, getYouTubeThumbnail, getYouTubeDuration, loadYouTubeAPI, fmtDuration } from '../lib/youtube';
import { Reorder } from 'framer-motion';

// ── Image compression ──────────────────────────────────────────────────────
const compressImage = (file: File, mode: 'vertical' | 'square' | 'landscape' = 'landscape'): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            
            if (mode === 'square') {
                // Crop to square (1:1)
                const size = Math.min(w, h);
                const sx = (w - size) / 2;
                const sy = (h - size) / 2;
                
                // target size: max 1080x1080
                const targetSize = Math.min(size, 1080);
                canvas.width = targetSize;
                canvas.height = targetSize;
                
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, sx, sy, size, size, 0, 0, targetSize, targetSize);
                    resolve(canvas.toDataURL('image/webp', 0.95));
                } else {
                    resolve(event.target?.result as string);
                }
            } else if (mode === 'vertical') {
                // Keep portrait (9:16)
                const maxW = 1536;
                const maxH = 2752;
                if (w > maxW) { h = h * maxW / w; w = maxW; }
                if (h > maxH) { w = w * maxH / h; h = maxH; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx ? (ctx.drawImage(img, 0, 0, w, h), resolve(canvas.toDataURL('image/webp', 0.95))) : resolve(event.target?.result as string);
            } else {
                // Standard widescreen 16:9
                const maxW = 1280;
                const maxH = 720;
                if (w > maxW) { h = h * maxW / w; w = maxW; }
                if (h > maxH) { w = w * maxH / h; h = maxH; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx ? (ctx.drawImage(img, 0, 0, w, h), resolve(canvas.toDataURL('image/webp', 0.95))) : resolve(event.target?.result as string);
            }
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
    const { courses, lessons, sectors, articles, newsletters, addCourse, updateCourse, deleteCourse, addLesson, updateLesson, deleteLesson, addSector, updateSector, deleteSector, addArticle, updateArticle, deleteArticle, addNewsletter, updateNewsletter, deleteNewsletter, materialCategories, supportMaterials, addMaterial, updateMaterial, deleteMaterial, addMaterialCategory, deleteMaterialCategory, uploadMaterialFile, clearLocalCache, isSyncing, syncStatus, updateCoursesOrder } = useData();
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

    // Module reordering
    const [isReordering, setIsReordering] = useState(false);
    const [reorderList, setReorderList] = useState<Course[]>([]);

    useEffect(() => {
        if (isReordering) {
            setReorderList(courses);
        }
    }, [isReordering, courses]);

    const [newSectorName, setNewSectorName] = useState('');
    const [editingSectorId, setEditingSectorId] = useState<string | null>(null);
    const [editingSectorName, setEditingSectorName] = useState('');

    const [isEditingArticle, setIsEditingArticle] = useState(false);
    const [isEditingNewsletter, setIsEditingNewsletter] = useState(false);
    const [coursePage, setCoursePage] = useState(0);
    const [sectorPage, setSectorPage] = useState(0);
    const [curNewsletter, setCurNewsletter] = useState<Partial<Newsletter>>({ category: 'IA', tag: '', title: '', summary: '', content: '', readTime: 5, featured: false, thumbnailUrl: '' });
    const [curArticle, setCurArticle] = useState<{ id?: string; sectorId: string; title: string; content: string; author: string; subtitle?: string; thumbnailUrl?: string }>({ sectorId: '', title: '', content: '', author: 'ATL Academy', subtitle: '', thumbnailUrl: '' });

    // ── Materiais de Apoio (Central de Divulgação) ──
    const emptyMaterial = { categoryId: '', title: '', description: '', type: 'post' as 'post' | 'video', fileUrl: '', thumbnailUrl: '', fileName: '', files: [] as { url: string; name: string }[] };
    const [isEditingMaterial, setIsEditingMaterial] = useState(false);
    const [curMaterial, setCurMaterial] = useState<{ id?: string } & typeof emptyMaterial>(emptyMaterial);
    const [uploadingMaterial, setUploadingMaterial] = useState(false);
    const [newMatCatName, setNewMatCatName] = useState('');
    const [matFilterCat, setMatFilterCat] = useState<string>('all');
    const [videoLinkInput, setVideoLinkInput] = useState('');

    // Lesson management (Cronograma)
    const [editingLessonsCourseId, setEditingLessonsCourseId] = useState<string | null>(null);
    const [isAddingLesson, setIsAddingLesson] = useState(false);
    const [curLesson, setCurLesson] = useState<Partial<Lesson & { id?: string }>>({});
    const getCourseLesson = (courseId: string) => lessons.filter(l => l.courseId === courseId).sort((a, b) => a.position - b.position);

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
                instructorTitle: cur.instructorTitle, subtitle: cur.subtitle, tags: cur.tags,
                cardTitle: cur.cardTitle || '',
                cardSubtitle: cur.cardSubtitle || '',
                cardIcon: cur.cardIcon || '',
                cardThumbnail: cur.cardThumbnail || '',
                sectorId: cur.sectorId
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
        <div className="bg-black text-white/90 min-h-screen font-body relative">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-black"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-3xl"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.03]"></div>
            </div>

            <Navbar />

            <div className="relative z-10 pt-20 md:pt-28">
                <main className="max-w-[1440px] mx-auto px-4 md:px-10 py-6 md:py-10 space-y-8 md:space-y-12">
                {/* ── COMMAND CENTER HEADER ── */}
                <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:pb-8">
                    {/* Title Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="min-w-0">
                            <p className="font-label text-[9px] text-white/30 tracking-[3px] uppercase mb-1">Painel de Controle</p>
                            <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-white/90 leading-tight">Central de Comando</h1>
                            <p className="font-label text-[8px] md:text-[10px] text-white/30 tracking-[2px] md:tracking-[3px] uppercase mt-1.5">Gerenciamento de Conteúdo Global</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
                            <button onClick={() => { if (confirm('Isso irá limpar todo o cache local do seu navegador e recarregar os dados do Supabase. Deseja continuar?')) clearLocalCache(); }} className="px-5 py-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 text-yellow-400 transition-colors uppercase font-label text-[10px] tracking-[2px] flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">refresh</span> Limpar Cache Local
                            </button>
                            <button onClick={handleLogout} className="px-5 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/10 transition-colors uppercase font-label text-[10px] tracking-[2px] flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">exit_to_app</span> Sair
                            </button>
                        </div>
                    </div>
                    {/* Sync Status Row */}
                    <div className="flex items-center gap-3">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                            syncStatus === 'local-mode' ? 'bg-orange-500/10 border-orange-500/20' : 
                            syncStatus === 'error' ? 'bg-red-500/10 border-red-500/20' :
                            'bg-primary/10 border-primary/20'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                isSyncing ? 'animate-spin border border-t-transparent border-white' : 'animate-pulse'
                            } ${
                                syncStatus === 'local-mode' ? 'bg-orange-400 shadow-[0_0_8px_#FB923C]' : 
                                syncStatus === 'error' ? 'bg-red-400 shadow-[0_0_8px_#EF4444]' :
                                'bg-primary shadow-[0_0_8px_#00FD86]'
                            }`}></span>
                            <span className={`text-[9px] font-bold tracking-widest uppercase whitespace-nowrap ${
                                syncStatus === 'local-mode' ? 'text-orange-400' : 
                                syncStatus === 'error' ? 'text-red-400' :
                                'text-primary'
                            }`}>
                                {syncStatus === 'syncing' ? 'Sincronizando...' : 
                                 syncStatus === 'error' ? 'Erro na Nuvem (Salvo Local)' :
                                 syncStatus === 'local-mode' ? 'Modo Offline (LocalStorage)' : 
                                 'Conectado ao Supabase'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
                    {/* Courses */}
                    <section className="lg:col-span-2 space-y-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <h2 className="font-headline text-xl font-bold uppercase tracking-tight">Módulos Inteligentes</h2>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button onClick={() => setIsReordering(true)} className="w-full sm:w-auto px-5 py-3 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all font-label text-[10px] tracking-[2px] uppercase flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">swap_vert</span> Reordenar Módulos
                                </button>
                                <button onClick={() => { setCur({ icon: 'play_lesson' }); setIsEditingCourse(true); }} className="w-full sm:w-auto premium-pill py-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-black transition-all">+ Novo Módulo</button>
                            </div>
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
                                                <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all" value={cur.title || ''} onChange={e => setCur({ ...cur, title: e.target.value })} required placeholder="Ex: MARKETING" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="font-label text-[9px] uppercase text-white/40">Subtítulo (Ex: IA PARA)</label>
                                                <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all" value={cur.subtitle || ''} onChange={e => setCur({ ...cur, subtitle: e.target.value })} placeholder="Texto pequeno acima do título" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="font-label text-[9px] uppercase text-white/40">Nome Exibição (Instrutor) *</label>
                                                <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all" value={cur.instructor || ''} onChange={e => setCur({ ...cur, instructor: e.target.value })} required placeholder="Ex: EDUARDO COELHO" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="font-label text-[9px] uppercase text-white/40">Cargo do Instrutor</label>
                                                <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all" value={cur.instructorTitle || ''} onChange={e => setCur({ ...cur, instructorTitle: e.target.value })} placeholder="Ex: CEO da ATL Academy" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="font-label text-[9px] uppercase text-white/40">Modalidade / Categoria</label>
                                                <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all text-sm text-white" value={cur.sectorId || ''} onChange={e => setCur({ ...cur, sectorId: e.target.value || undefined })}>
                                                    <option value="" className="bg-[#0f0f0f]">Sem modalidade</option>
                                                    {sectors.map(s => (
                                                        <option key={s.id} value={s.id} className="bg-[#0f0f0f]">{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <IconPicker value={cur.icon || 'play_lesson'} onChange={icon => setCur({ ...cur, icon })} />
                                        </div>

                                        {/* RIGHT */}
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="font-label text-[9px] uppercase text-white/40 flex justify-between"><span>Thumbnail (9:16)</span></label>
                                                <div className="flex gap-2">
                                                    <input className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all text-sm" value={cur.thumbnailUrl || ''} onChange={e => setCur({ ...cur, thumbnailUrl: e.target.value })} placeholder="URL ou faça upload" />
                                                    <label className="cursor-pointer px-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
                                                        <span className="material-symbols-outlined text-base">upload</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={async e => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            if (file.size > 20 * 1024 * 1024) { alert('Máximo 20MB'); return; }
                                                            try { setCur({ ...cur, thumbnailUrl: await compressImage(file, 'vertical') }); } catch { alert('Erro ao processar imagem.'); }
                                                        }} />
                                                    </label>
                                                </div>
                                                {cur.thumbnailUrl && (
                                                    <div className="relative w-40 aspect-[9/16] rounded-2xl border border-white/10 overflow-hidden bg-black/40 group mt-2">
                                                        <img src={cur.thumbnailUrl} className="w-full h-full object-cover" alt="" />
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

                                    {/* Custom Card Appearance Section */}
                                    <div className="space-y-4 border-t border-white/5 pt-5">
                                        <h4 className="font-label text-[10px] text-primary uppercase tracking-[2px] font-bold">Aparência Personalizada do Card (Dashboard & Explorar)</h4>
                                        <p className="text-[9px] text-white/40 font-label uppercase">Use estes campos opcionais se desejar que o card deste módulo apresente títulos, imagem ou ícone diferentes das informações principais</p>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {/* LEFT */}
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="font-label text-[9px] uppercase text-white/40">Título Personalizado na Capa</label>
                                                    <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-sm" value={cur.cardTitle || ''} onChange={e => setCur({ ...cur, cardTitle: e.target.value })} placeholder="Ex: MÓDULO MARKETING" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="font-label text-[9px] uppercase text-white/40">Subtítulo Personalizado na Capa</label>
                                                    <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-sm" value={cur.cardSubtitle || ''} onChange={e => setCur({ ...cur, cardSubtitle: e.target.value })} placeholder="Ex: MARKETING AVANÇADO" />
                                                </div>
                                                <IconPicker value={cur.cardIcon || ''} onChange={icon => setCur({ ...cur, cardIcon: icon })} />
                                            </div>
                                            
                                            {/* RIGHT */}
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="font-label text-[9px] uppercase text-white/40 flex justify-between"><span>Imagem da Capa Personalizada (1:1)</span></label>
                                                    <div className="flex gap-2">
                                                        <input className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all" value={cur.cardThumbnail || ''} onChange={e => setCur({ ...cur, cardThumbnail: e.target.value })} placeholder="URL da imagem quadrada..." />
                                                        <label className="cursor-pointer px-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
                                                            <span className="material-symbols-outlined text-base">upload</span>
                                                            <input type="file" hidden accept="image/*" onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    try { 
                                                                        const compressed = await compressImage(file, 'square');
                                                                        setCur({ ...cur, cardThumbnail: compressed }); 
                                                                    } catch { alert('Erro ao processar imagem.'); }
                                                                }
                                                            }} />
                                                        </label>
                                                    </div>
                                                    {cur.cardThumbnail && (
                                                        <div className="relative w-28 aspect-square rounded-2xl border border-white/10 overflow-hidden bg-black/40 group mt-2">
                                                            <img src={cur.cardThumbnail} className="w-full h-full object-cover" alt="" />
                                                            <button type="button" onClick={() => setCur({ ...cur, cardThumbnail: '' })} className="absolute bottom-2 right-2 text-red-400 hover:text-red-300">
                                                                <span className="material-symbols-outlined text-base">delete</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full bg-white text-black font-bold uppercase rounded-xl py-4 text-xs tracking-[2px] hover:bg-primary transition-all shadow-lg">Salvar Módulo</button>
                                </form>
                            </div>
                        )}

                        {/* Course List */}
                        {(() => {
                            const C_PAGE = 5;
                            const cTotal = Math.ceil(courses.length / C_PAGE);
                            const pagedCourses = courses.slice(coursePage * C_PAGE, (coursePage + 1) * C_PAGE);
                            return (
                            <>
                        <div className="space-y-4">
                            {pagedCourses.map(course => {
                                const courseLessons = getCourseLesson(course.id);
                                const isManagingLessons = editingLessonsCourseId === course.id;
                                return (
                                    <div key={course.id} className="flex flex-col liquid-glass-soft border-white/5 hover:bg-white/[0.03] group transition-all rounded-2xl overflow-hidden">
                                        {/* Course Row */}
                                        <div className="p-4 md:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
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
                                                        {courseLessons.length > 0 && <span className="text-primary/70 flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">menu_book</span>{courseLessons.length} aula{courseLessons.length !== 1 ? 's' : ''}</span>}
                                                        {(() => {
                                                            const s = sectors.find(sec => sec.id === course.sectorId);
                                                            return s ? (
                                                                <>
                                                                    <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                                                    <span className="text-primary/95 font-bold flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">category</span>{s.name}</span>
                                                                </>
                                                            ) : null;
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                                <button
                                                    onClick={() => { setEditingLessonsCourseId(isManagingLessons ? null : course.id); setIsAddingLesson(false); setCurLesson({}); }}
                                                    className={`px-4 py-2.5 rounded-xl font-label text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 border ${isManagingLessons ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">event_note</span>
                                                    <span className="hidden sm:inline">Cronograma</span>
                                                </button>
                                                <button onClick={() => { setCur(course); setIsEditingCourse(true); setEditingLessonsCourseId(null); }} className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-label text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5">
                                                    <span className="material-symbols-outlined text-[16px]">edit</span><span className="hidden sm:inline">Editar</span>
                                                </button>
                                                <button onClick={() => { if (confirm(`Deseja realmente excluir o módulo "${course.title}"?`)) deleteCourse(course.id); }} className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/20 font-label text-[9px] uppercase tracking-widest transition-all flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Cronograma Panel */}
                                        {isManagingLessons && (
                                            <div className="border-t border-white/5 bg-black/30 p-5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="font-headline text-sm uppercase tracking-widest text-primary">Aulas do Módulo</h5>
                                                    <button onClick={() => { setIsAddingLesson(true); setCurLesson({}); }} className="text-[10px] font-label uppercase tracking-widest text-primary/70 hover:text-primary flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">add</span> Adicionar Aula
                                                    </button>
                                                </div>

                                                {/* Add/Edit Lesson Form */}
                                                {isAddingLesson && (
                                                    <form onSubmit={async e => {
                                                        e.preventDefault();
                                                        try {
                                                            if (curLesson.id) {
                                                                await updateLesson(curLesson.id, curLesson as Lesson);
                                                            } else {
                                                                await addLesson({
                                                                    courseId: course.id,
                                                                    title: curLesson.title!,
                                                                    videoUrl: curLesson.videoUrl || '',
                                                                    thumbnailUrl: curLesson.thumbnailUrl || '',
                                                                    duration: curLesson.duration || '00h 00m',
                                                                    totalSeconds: curLesson.totalSeconds || 0,
                                                                    position: courseLessons.length,
                                                                    module: curLesson.module || '',
                                                                });
                                                            }
                                                            setCurLesson({});
                                                            setIsAddingLesson(false);
                                                        } catch (err: any) {
                                                            console.error('Lesson Save Error:', err);
                                                            alert(`Erro ao salvar aula no banco de dados: ${err?.message || err}. A aula foi salva apenas localmente.`);
                                                        }
                                                    }} className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="font-label text-[10px] uppercase tracking-widest text-white/60">{curLesson.id ? 'Editar Aula' : 'Nova Aula'}</p>
                                                            <button type="button" onClick={() => { setIsAddingLesson(false); setCurLesson({}); }} className="text-white/30 hover:text-white text-[10px] font-label uppercase">Cancelar</button>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="font-label text-[9px] uppercase text-white/40">Título da Aula *</label>
                                                            <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary text-sm" required value={curLesson.title || ''} onChange={e => setCurLesson(p => ({ ...p, title: e.target.value }))} placeholder="Ex: ATL ONMED - CLASS 1" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="font-label text-[9px] uppercase text-white/40">Módulo / Capítulo (Ex: Módulo 1: Fundamentos)</label>
                                                            <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary text-sm" value={curLesson.module || ''} onChange={e => setCurLesson(p => ({ ...p, module: e.target.value }))} placeholder="Ex: Módulo 1: Fundamentos" />
                                                        </div>
                                                        <VideoUrlInput
                                                            value={curLesson.videoUrl || ''}
                                                            onUrlChange={url => setCurLesson(p => ({ ...p, videoUrl: url }))}
                                                            onDurationDetected={(duration, totalSeconds) => setCurLesson(p => ({ ...p, duration, totalSeconds }))}
                                                            onThumbnailDetected={url => {
                                                                // Prioridade para anexo: só sobrescreve se estiver vazio ou se já for uma thumb do YT
                                                                if (!curLesson.thumbnailUrl || curLesson.thumbnailUrl.includes('youtube.com') || curLesson.thumbnailUrl.includes('ytimg.com')) {
                                                                    setCurLesson(p => ({ ...p, thumbnailUrl: url }));
                                                                }
                                                            }}
                                                        />
                                                        <div className="space-y-1.5">
                                                            <label className="font-label text-[9px] uppercase text-white/40 flex justify-between"><span>Thumbnail da Aula (1:1)</span><span className="text-primary/40 text-[8px]">Auto-preenchida p/ YouTube</span></label>
                                                            <div className="flex gap-2">
                                                                <input className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary text-sm transition-all" value={curLesson.thumbnailUrl || ''} onChange={e => setCurLesson(p => ({ ...p, thumbnailUrl: e.target.value }))} placeholder="URL ou faça upload" />
                                                                <label className="cursor-pointer px-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
                                                                    <span className="material-symbols-outlined text-base">upload</span>
                                                                    <input type="file" hidden accept="image/*" onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            try { 
                                                                                const compressed = await compressImage(file, 'square');
                                                                                setCurLesson(p => ({ ...p, thumbnailUrl: compressed })); 
                                                                            } catch { alert('Erro ao processar imagem.'); }
                                                                        }
                                                                    }} />
                                                                </label>
                                                            </div>
                                                            {curLesson.thumbnailUrl && (
                                                                <div className="relative w-28 aspect-square rounded-xl border border-white/10 overflow-hidden bg-black/40 group mt-2">
                                                                    <img src={curLesson.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                                                    <button type="button" onClick={() => setCurLesson(p => ({ ...p, thumbnailUrl: '' }))} className="absolute bottom-2 right-2 text-red-400 hover:text-red-300">
                                                                        <span className="material-symbols-outlined text-base">delete</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="font-label text-[9px] uppercase text-white/40 flex justify-between"><span>Duração</span><span className="text-primary/40 text-[8px]">Auto-preenchida</span></label>
                                                            <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary text-sm" value={curLesson.duration || ''} onChange={e => setCurLesson(p => ({ ...p, duration: e.target.value }))} placeholder="Ex: 00h 33m" />
                                                        </div>
                                                        <button type="submit" className="w-full bg-primary text-black font-bold uppercase rounded-xl py-3 text-[10px] tracking-[2px] hover:bg-white transition-all">Salvar Aula</button>
                                                    </form>
                                                )}

                                                {/* Lesson List */}
                                                {courseLessons.length === 0 && !isAddingLesson && (
                                                    <div className="text-center py-6">
                                                        <span className="material-symbols-outlined text-white/10 text-3xl block">video_library</span>
                                                        <p className="text-white/20 font-label text-[10px] tracking-widest uppercase mt-2">Nenhuma aula adicionada</p>
                                                    </div>
                                                )}
                                                <div className="space-y-2">
                                                    {courseLessons.map((lesson, idx) => (
                                                        <div key={lesson.id} className="flex items-center gap-3 p-3.5 bg-white/[0.03] rounded-xl border border-white/5 group/lesson">
                                                            <div className="w-12 aspect-square rounded-lg bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden shrink-0">
                                                                {lesson.thumbnailUrl ? (
                                                                    <img src={lesson.thumbnailUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
                                                                ) : (
                                                                    <span className="material-symbols-outlined text-white/10 text-xs">image</span>
                                                                )}
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/lesson:opacity-100 transition-opacity z-10">
                                                                    <span className="text-[8px] font-bold text-white uppercase">{idx + 1}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-white/80 truncate">{lesson.title}</p>
                                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                                    <span className="text-[10px] text-white/30 font-label">{lesson.duration || '00h 00m'}</span>
                                                                    {lesson.module && (
                                                                        <span className="text-[8px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                                                            {lesson.module}
                                                                        </span>
                                                                    )}
                                                                    {getYouTubeId(lesson.videoUrl || '') && <span className="text-red-400/60 text-[9px] font-label">YT</span>}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                                                                <button onClick={() => { setCurLesson(lesson); setIsAddingLesson(true); }} className="text-white/30 hover:text-white p-1"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                                                                <button onClick={() => deleteLesson(lesson.id)} className="text-white/20 hover:text-red-400 p-1"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {cTotal > 1 && (
                            <div className="flex items-center justify-between pt-2">
                                <button
                                    onClick={() => setCoursePage(p => Math.max(0, p - 1))}
                                    disabled={coursePage === 0}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] text-white/30 hover:text-white hover:border-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all font-label text-[9px] uppercase tracking-widest"
                                >
                                    <span className="material-symbols-outlined text-[14px]">chevron_left</span> Anterior
                                </button>
                                <div className="flex items-center gap-1.5">
                                    {Array.from({ length: cTotal }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCoursePage(i)}
                                            className={`w-6 h-6 rounded-lg font-label text-[9px] font-bold transition-all ${
                                                i === coursePage
                                                    ? 'bg-primary text-black'
                                                    : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >{i + 1}</button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCoursePage(p => Math.min(cTotal - 1, p + 1))}
                                    disabled={coursePage === cTotal - 1}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] text-white/30 hover:text-white hover:border-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all font-label text-[9px] uppercase tracking-widest"
                                >
                                    Próximo <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                                </button>
                            </div>
                        )}
                            </>
                            );
                        })()}
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
                        {(() => {
                            const PAGE_SIZE = 5;
                            const totalPages = Math.ceil(sectors.length / PAGE_SIZE);
                            const paginated = sectors.slice(sectorPage * PAGE_SIZE, (sectorPage + 1) * PAGE_SIZE);
                            return (
                                <div className="liquid-glass-soft border-white/5 overflow-hidden">
                                    <div className="p-4 space-y-1">
                                        {paginated.map((sector, idx) => (
                                            <div key={sector.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.05] transition-all group gap-2">
                                                {editingSectorId === sector.id ? (
                                                    <input autoFocus value={editingSectorName} onChange={e => setEditingSectorName(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter') { updateSector(sector.id, editingSectorName); setEditingSectorId(null); } if (e.key === 'Escape') setEditingSectorId(null); }}
                                                        onBlur={() => { updateSector(sector.id, editingSectorName); setEditingSectorId(null); }}
                                                        className="flex-1 bg-black/50 border border-primary/40 rounded-lg px-3 py-1.5 text-sm outline-none text-white" />
                                                ) : (
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <span className="font-label text-[9px] text-white/20 w-4 text-right shrink-0">{sectorPage * PAGE_SIZE + idx + 1}</span>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary shrink-0" />
                                                        <span className="text-sm text-white/80 truncate">{sector.name}</span>
                                                    </div>
                                                )}
                                                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingSectorId(sector.id); setEditingSectorName(sector.name); }} className="text-white/30 hover:text-white p-1"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                                                    <button onClick={() => deleteSector(sector.id)} className="text-white/20 hover:text-red-400 p-1"><span className="material-symbols-outlined text-[16px]">close</span></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5">
                                            <button
                                                onClick={() => setSectorPage(p => Math.max(0, p - 1))}
                                                disabled={sectorPage === 0}
                                                className="flex items-center gap-1 text-white/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors font-label text-[9px] uppercase tracking-widest"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                                                Ant.
                                            </button>
                                            <span className="font-label text-[9px] text-white/20 tracking-widest">
                                                {sectorPage + 1} / {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setSectorPage(p => Math.min(totalPages - 1, p + 1))}
                                                disabled={sectorPage === totalPages - 1}
                                                className="flex items-center gap-1 text-white/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors font-label text-[9px] uppercase tracking-widest"
                                            >
                                                Próx.
                                                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </aside>
                </div>

                {/* ── Newsletter Manager ──────────────────────────────────────────────── */}
                <section className="space-y-6 border-t border-white/10 pt-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="font-headline text-xl font-bold uppercase tracking-tight">Newsletters</h2>
                            <p className="font-label text-[10px] text-white/30 tracking-widest uppercase mt-1">Publicações da ATL Academy Intelligence</p>
                        </div>
                        <button
                            onClick={() => { setCurNewsletter({ category: 'IA', tag: '', title: '', summary: '', content: '', readTime: 5, featured: false, thumbnailUrl: '' }); setIsEditingNewsletter(true); }}
                            className="w-full sm:w-auto premium-pill py-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-black transition-all"
                        >+ Nova Newsletter</button>
                    </div>

                    {isEditingNewsletter && (
                        <div className="liquid-glass-soft p-6 md:p-8 space-y-5 border-primary/20">
                            <div className="flex items-center justify-between">
                                <h3 className="font-headline text-lg text-primary uppercase">{curNewsletter.id ? 'Editar' : 'Nova'} Newsletter</h3>
                                <button onClick={() => setIsEditingNewsletter(false)} className="text-white/40 hover:text-white font-label text-[10px] uppercase tracking-widest">Cancelar</button>
                            </div>
                            <form onSubmit={e => {
                                e.preventDefault();
                                if (!curNewsletter.title || !curNewsletter.summary || !curNewsletter.content) return;
                                if (curNewsletter.id) {
                                    updateNewsletter(curNewsletter.id, curNewsletter);
                                } else {
                                    addNewsletter({
                                        title: curNewsletter.title!,
                                        summary: curNewsletter.summary!,
                                        content: curNewsletter.content!,
                                        category: curNewsletter.category || 'IA',
                                        tag: curNewsletter.tag || '',
                                        readTime: curNewsletter.readTime || 5,
                                        featured: curNewsletter.featured || false,
                                        thumbnailUrl: curNewsletter.thumbnailUrl || '',
                                    });
                                }
                                setIsEditingNewsletter(false);
                                setCurNewsletter({ category: 'IA', tag: '', title: '', summary: '', content: '', readTime: 5, featured: false, thumbnailUrl: '' });
                            }} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Categoria *</label>
                                        <select value={curNewsletter.category || 'IA'} onChange={e => setCurNewsletter(p => ({ ...p, category: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm text-white">
                                            <option>IA</option>
                                            <option>MLM</option>
                                            <option>Negócios</option>
                                            <option>Tecnologia</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Tag (ex: Destaque)</label>
                                        <input value={curNewsletter.tag || ''} onChange={e => setCurNewsletter(p => ({ ...p, tag: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm transition-all" placeholder="Ex: Destaque, Novo, Tendência" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Tempo de Leitura (min)</label>
                                        <input type="number" min={1} max={60} value={curNewsletter.readTime || 5} onChange={e => setCurNewsletter(p => ({ ...p, readTime: Number(e.target.value) }))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm transition-all" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/15 rounded-xl">
                                    <input type="checkbox" id="nl-featured" checked={!!curNewsletter.featured} onChange={e => setCurNewsletter(p => ({ ...p, featured: e.target.checked }))} className="w-4 h-4 accent-primary" />
                                    <label htmlFor="nl-featured" className="font-label text-[10px] uppercase tracking-widest text-white/60 cursor-pointer">
                                        Destacar como newsletter principal (featured)
                                    </label>
                                </div>


                                <div className="space-y-2">
                                    <label className="font-label text-[10px] text-white/40 uppercase tracking-widest flex justify-between">
                                        <span>Foto do Card <span className="text-white/20 normal-case tracking-normal">(1536 × 1024px recomendado)</span></span>
                                        {curNewsletter.thumbnailUrl && (
                                            <button type="button" onClick={() => setCurNewsletter(p => ({ ...p, thumbnailUrl: '' }))} className="text-red-400/70 hover:text-red-400 font-label text-[9px] uppercase tracking-widest">Remover</button>
                                        )}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            value={curNewsletter.thumbnailUrl || ''}
                                            onChange={e => setCurNewsletter(p => ({ ...p, thumbnailUrl: e.target.value }))}
                                            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm transition-all"
                                            placeholder="Cole a URL da imagem ou faça upload..."
                                        />
                                        <label className="cursor-pointer px-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors shrink-0 gap-1.5 text-white/50 hover:text-white font-label text-[9px] uppercase tracking-wider">
                                            <span className="material-symbols-outlined text-base">upload</span>
                                            Upload
                                            <input type="file" className="hidden" accept="image/*" onChange={async e => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                try {
                                                    const compressed = await compressImage(file, 'landscape');
                                                    setCurNewsletter(p => ({ ...p, thumbnailUrl: compressed }));
                                                } catch { alert('Erro ao processar imagem.'); }
                                            }} />
                                        </label>
                                    </div>
                                    {curNewsletter.thumbnailUrl && (
                                        <div className="relative w-full aspect-[3/2] rounded-2xl border border-white/10 overflow-hidden bg-black/40 mt-2 max-w-sm">
                                            <img src={curNewsletter.thumbnailUrl} className="w-full h-full object-cover" alt="Preview" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                            <span className="absolute bottom-2 left-3 font-label text-[8px] text-white/40 uppercase tracking-widest">Preview 1536×1024</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Título *</label>
                                    <input value={curNewsletter.title || ''} onChange={e => setCurNewsletter(p => ({ ...p, title: e.target.value }))} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm" placeholder="Título da newsletter..." />
                                </div>

                                <div className="space-y-2">
                                    <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Resumo * <span className="text-white/20 normal-case tracking-normal">(aparece no card)</span></label>
                                    <textarea value={curNewsletter.summary || ''} onChange={e => setCurNewsletter(p => ({ ...p, summary: e.target.value }))} required rows={2} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm resize-none" placeholder="Breve descrição que aparece no card..." />
                                </div>

                                <div className="space-y-2">
                                    <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Conteúdo Completo * <span className="text-white/20 normal-case tracking-normal">(suporta Markdown: ## Título, **negrito**, - lista)</span></label>
                                    <textarea value={curNewsletter.content || ''} onChange={e => setCurNewsletter(p => ({ ...p, content: e.target.value }))} required rows={12} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm resize-y font-mono" placeholder="## Introdução&#10;&#10;Escreva o conteúdo completo aqui..." />
                                </div>

                                <button type="submit" className="px-8 py-3.5 bg-primary text-black font-label font-bold text-[10px] uppercase tracking-[2px] rounded-xl hover:bg-white transition-all">
                                    {curNewsletter.id ? 'Salvar Alterações' : 'Publicar Newsletter'}
                                </button>
                            </form>
                        </div>
                    )}

                    {newsletters.length === 0 ? (
                        <div className="liquid-glass-soft p-10 text-center border-white/5">
                            <span className="material-symbols-outlined text-white/10 text-5xl block mb-3">mail</span>
                            <p className="text-white/20 font-label text-[10px] tracking-widest uppercase">Nenhuma newsletter publicada ainda</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {newsletters.map(nl => (
                                <div key={nl.id} className="liquid-glass-soft p-5 flex flex-col gap-3 border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] tracking-widest uppercase font-label text-primary/70">{nl.category}</span>
                                        <div className="flex items-center gap-2">
                                            {nl.featured && (
                                                <span className="text-[8px] tracking-widest uppercase font-label text-amber-400/70 border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 rounded-full">Featured</span>
                                            )}
                                            {nl.tag && (
                                                <span className="text-[8px] tracking-widest uppercase font-label text-white/30 border border-white/10 px-2 py-0.5 rounded-full">{nl.tag}</span>
                                            )}
                                        </div>
                                    </div>
                                    {nl.thumbnailUrl && (
                                        <div className="relative w-full aspect-[3/2] rounded-xl overflow-hidden bg-black/40 -mx-1 mb-1">
                                            <img src={nl.thumbnailUrl} className="w-full h-full object-cover opacity-80" alt="" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                        </div>
                                    )}
                                    <h4 className="font-headline text-base font-bold text-white leading-tight">{nl.title}</h4>
                                    <p className="text-white/30 text-xs leading-relaxed flex-1 line-clamp-2">{nl.summary}</p>
                                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
                                        <span className="text-white/20 font-label text-[9px] tracking-widest flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                                            {nl.readTime} min
                                        </span>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setCurNewsletter({ ...nl }); setIsEditingNewsletter(true); }} className="text-white/30 hover:text-white p-1">
                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                            </button>
                                            <button onClick={() => { if (confirm('Excluir newsletter?')) deleteNewsletter(nl.id); }} className="text-white/20 hover:text-red-400 p-1">
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Intelligence Hub */}
                <section className="space-y-6 border-t border-white/10 pt-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="font-headline text-xl font-bold uppercase tracking-tight">Hub de Inteligência</h2>
                            <p className="font-label text-[10px] text-white/30 tracking-widest uppercase mt-1">Tutoriais e artigos por setor</p>
                        </div>
                        <button onClick={() => { setCurArticle({ sectorId: sectors[0]?.id || '', title: '', content: '', author: 'ATL Academy', subtitle: '', thumbnailUrl: '' }); setIsEditingArticle(true); }} className="w-full sm:w-auto premium-pill py-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-black transition-all">+ Novo Artigo</button>
                    </div>

                    {isEditingArticle && (
                        <div className="liquid-glass-soft p-6 md:p-8 space-y-5 border-primary/20">
                            <div className="flex items-center justify-between">
                                <h3 className="font-headline text-lg text-primary uppercase">{curArticle.id ? 'Editar' : 'Novo'} Artigo</h3>
                                <button onClick={() => setIsEditingArticle(false)} className="text-white/40 hover:text-white font-label text-[10px] uppercase tracking-widest">Cancelar</button>
                            </div>
                            <form onSubmit={e => { 
                                e.preventDefault(); 
                                if (!curArticle.title || !curArticle.sectorId || !curArticle.content) return; 
                                if (curArticle.id) { 
                                    updateArticle(curArticle.id, curArticle); 
                                } else { 
                                    addArticle({ 
                                        sectorId: curArticle.sectorId, 
                                        title: curArticle.title, 
                                        content: curArticle.content, 
                                        author: curArticle.author || 'ATL Academy', 
                                        subtitle: curArticle.subtitle || '', 
                                        thumbnailUrl: curArticle.thumbnailUrl || '' 
                                    }); 
                                } 
                                setIsEditingArticle(false); 
                                setCurArticle({ sectorId: '', title: '', content: '', author: 'ATL Academy', subtitle: '', thumbnailUrl: '' }); 
                            }} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Setor *</label>
                                        <select value={curArticle.sectorId || ''} onChange={e => setCurArticle(p => ({ ...p, sectorId: e.target.value }))} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm text-white">
                                            <option value="" disabled>Selecionar Setor...</option>
                                            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Autor</label>
                                        <input value={curArticle.author || ''} onChange={e => setCurArticle(p => ({ ...p, author: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm transition-all" placeholder="ATL Academy" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Subtítulo (Ex: Newsletter #145)</label>
                                        <input value={curArticle.subtitle || ''} onChange={e => setCurArticle(p => ({ ...p, subtitle: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm transition-all" placeholder="Ex: Newsletter #145" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-label text-[10px] text-white/40 uppercase tracking-widest flex justify-between"><span>Imagem do Card (Newsletter)</span></label>
                                        <div className="flex gap-2">
                                            <input value={curArticle.thumbnailUrl || ''} onChange={e => setCurArticle(p => ({ ...p, thumbnailUrl: e.target.value }))} className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm transition-all" placeholder="URL ou faça upload" />
                                            <label className="cursor-pointer px-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
                                                <span className="material-symbols-outlined text-base">upload</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={async e => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    try {
                                                        const compressed = await compressImage(file, 'landscape');
                                                        setCurArticle(p => ({ ...p, thumbnailUrl: compressed }));
                                                    } catch {
                                                        alert('Erro ao processar imagem.');
                                                    }
                                                }} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {curArticle.thumbnailUrl && (
                                    <div className="relative w-40 aspect-video rounded-xl border border-white/10 overflow-hidden bg-black/40 group mt-2">
                                        <img src={curArticle.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                        <button type="button" onClick={() => setCurArticle(p => ({ ...p, thumbnailUrl: '' }))} className="absolute bottom-2 right-2 text-red-400 hover:text-red-300">
                                            <span className="material-symbols-outlined text-base">delete</span>
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Título *</label>
                                    <input value={curArticle.title || ''} onChange={e => setCurArticle(p => ({ ...p, title: e.target.value }))} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Conteúdo *</label>
                                    <textarea value={curArticle.content || ''} onChange={e => setCurArticle(p => ({ ...p, content: e.target.value }))} required rows={8} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm resize-y font-mono" />
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
                                        {article.subtitle && <p className="text-[10px] text-primary/70 uppercase tracking-wider font-label">{article.subtitle}</p>}
                                        <p className="text-white/30 text-xs leading-relaxed flex-1 line-clamp-2">{article.content.replace(/\*\*/g, '').split('\n').filter(l => l.trim())[0]}</p>
                                        <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
                                            <span className="text-white/20 font-label text-[9px] tracking-widest uppercase">{article.author}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setCurArticle({ id: article.id, sectorId: article.sectorId, title: article.title, content: article.content, author: article.author, subtitle: article.subtitle || '', thumbnailUrl: article.thumbnailUrl || '' }); setIsEditingArticle(true); }} className="text-white/30 hover:text-white p-1"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                                                <button onClick={() => deleteArticle(article.id)} className="text-white/20 hover:text-red-400 p-1"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ── Materiais de Apoio ──────────────────────────────────────────────── */}
                <section className="space-y-6 border-t border-white/10 pt-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="font-headline text-xl font-bold uppercase tracking-tight">Materiais de Apoio</h2>
                            <p className="font-label text-[10px] text-white/30 tracking-widest uppercase mt-1">Posts e vídeos para divulgação — por produto</p>
                        </div>
                        <button onClick={() => { setCurMaterial({ ...emptyMaterial, categoryId: materialCategories[0]?.id || '' }); setIsEditingMaterial(true); }} className="w-full sm:w-auto premium-pill py-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-black transition-all">+ Novo Material</button>
                    </div>

                    {/* Gerenciar categorias (submenus) */}
                    <div className="liquid-glass-soft p-5 border-white/5 space-y-3">
                        <p className="font-label text-[10px] text-white/40 uppercase tracking-widest">Categorias (Submenus)</p>
                        <div className="flex flex-wrap gap-2">
                            {materialCategories.map(cat => (
                                <span key={cat.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/70 font-label text-[10px] uppercase tracking-wider">
                                    {cat.icon && <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>}
                                    {cat.name}
                                    <button onClick={() => { if (confirm(`Excluir a categoria "${cat.name}" e seus materiais?`)) deleteMaterialCategory(cat.id); }} className="text-white/20 hover:text-red-400 ml-1"><span className="material-symbols-outlined text-[14px]">close</span></button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2 max-w-md">
                            <input value={newMatCatName} onChange={e => setNewMatCatName(e.target.value)} placeholder="Nova categoria..." className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm" />
                            <button onClick={() => { if (newMatCatName.trim()) { addMaterialCategory(newMatCatName.trim()); setNewMatCatName(''); } }} className="bg-white/10 hover:bg-primary hover:text-black text-white px-4 rounded-xl transition-all shrink-0"><span className="material-symbols-outlined">add</span></button>
                        </div>
                    </div>

                    {/* Formulário */}
                    {isEditingMaterial && (
                        <div className="liquid-glass-soft p-6 md:p-8 space-y-5 border-primary/20">
                            <div className="flex items-center justify-between">
                                <h3 className="font-headline text-lg text-primary uppercase">{curMaterial.id ? 'Editar' : 'Novo'} Material</h3>
                                <button onClick={() => { setIsEditingMaterial(false); setCurMaterial(emptyMaterial); }} className="text-white/40 hover:text-white font-label text-[10px] uppercase tracking-widest">Cancelar</button>
                            </div>
                            <form onSubmit={e => {
                                e.preventDefault();
                                const mfiles = curMaterial.files || [];
                                if (!curMaterial.categoryId || !curMaterial.title || mfiles.length === 0) { alert('Preencha categoria, título e anexe ao menos um arquivo.'); return; }
                                const primary = mfiles[0];
                                if (curMaterial.id) {
                                    updateMaterial(curMaterial.id, { categoryId: curMaterial.categoryId, title: curMaterial.title, description: curMaterial.description, type: curMaterial.type, files: mfiles, fileUrl: primary.url, thumbnailUrl: curMaterial.thumbnailUrl, fileName: primary.name });
                                } else {
                                    addMaterial({ categoryId: curMaterial.categoryId, title: curMaterial.title, description: curMaterial.description, type: curMaterial.type, files: mfiles, fileUrl: primary.url, thumbnailUrl: curMaterial.thumbnailUrl, fileName: primary.name, position: supportMaterials.length });
                                }
                                setIsEditingMaterial(false); setCurMaterial(emptyMaterial);
                            }} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Categoria *</label>
                                        <select value={curMaterial.categoryId} onChange={e => setCurMaterial(p => ({ ...p, categoryId: e.target.value }))} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm text-white">
                                            <option value="" disabled>Selecionar categoria...</option>
                                            {materialCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Tipo *</label>
                                        <select value={curMaterial.type} onChange={e => setCurMaterial(p => ({ ...p, type: e.target.value as 'post' | 'video' }))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm text-white">
                                            <option value="post">Post (imagem)</option>
                                            <option value="video">Vídeo</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Título *</label>
                                    <input value={curMaterial.title} onChange={e => setCurMaterial(p => ({ ...p, title: e.target.value }))} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm" placeholder="Ex: Story ATL Energy - Promo Junho" />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Descrição</label>
                                    <textarea value={curMaterial.description} onChange={e => setCurMaterial(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm resize-y" placeholder="Instruções de uso (opcional)" />
                                </div>

                                {/* Arquivo */}
                                <div className="space-y-2">
                                    <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Arquivo(s) para download * {curMaterial.type === 'video' ? '(vídeo)' : '(imagem)'} — pode anexar vários no mesmo material</label>
                                    <div className="flex items-center gap-3">
                                        <label className="cursor-pointer px-5 py-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors text-sm">
                                            <span className="material-symbols-outlined text-base">{uploadingMaterial ? 'progress_activity' : 'upload'}</span>
                                            {uploadingMaterial ? 'Enviando...' : 'Enviar arquivo(s)'}
                                            <input type="file" multiple className="hidden" accept={curMaterial.type === 'video' ? 'video/*' : 'image/*'} disabled={uploadingMaterial} onChange={async e => {
                                                const files = e.target.files;
                                                if (!files || files.length === 0) return;
                                                if (!curMaterial.categoryId) { alert('Selecione a categoria antes de enviar.'); e.target.value = ''; return; }
                                                const cat = materialCategories.find(c => c.id === curMaterial.categoryId);
                                                setUploadingMaterial(true);
                                                try {
                                                    const uploaded: { url: string; name: string }[] = [];
                                                    for (const file of Array.from(files)) {
                                                        const { url, fileName } = await uploadMaterialFile(file, cat?.slug || 'geral');
                                                        uploaded.push({ url, name: fileName });
                                                    }
                                                    setCurMaterial(p => {
                                                        const merged = [...(p.files || []), ...uploaded];
                                                        return { ...p, files: merged, fileUrl: p.fileUrl || merged[0]?.url || '', fileName: p.fileName || merged[0]?.name || '' };
                                                    });
                                                } catch (err: any) {
                                                    alert('Erro ao enviar arquivo: ' + (err?.message || 'tente novamente'));
                                                } finally {
                                                    setUploadingMaterial(false);
                                                    e.target.value = '';
                                                }
                                            }} />
                                        </label>
                                        {curMaterial.files && curMaterial.files.length > 0 && <span className="text-white/50 text-xs flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-primary">check_circle</span>{curMaterial.files.length} arquivo(s) anexado(s)</span>}
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <input value={videoLinkInput} onChange={e => setVideoLinkInput(e.target.value)} placeholder="ou cole um link de vídeo (YouTube, Vimeo, Drive...)" className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm" />
                                        <button type="button" onClick={() => { const url = videoLinkInput.trim(); if (!url) return; setCurMaterial(p => { const merged = [...(p.files || []), { url, name: 'Vídeo (link)' }]; return { ...p, files: merged, fileUrl: p.fileUrl || url, fileName: p.fileName || 'Vídeo (link)' }; }); setVideoLinkInput(''); }} className="bg-white/10 hover:bg-primary hover:text-black text-white px-4 rounded-xl transition-all shrink-0 text-[10px] font-label uppercase tracking-wider">Adicionar link</button>
                                    </div>
                                    {curMaterial.files && curMaterial.files.length > 0 && (
                                        <div className="space-y-2">
                                            {curMaterial.files.map((f, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl px-3 py-2">
                                                    <span className="text-white/60 text-xs flex items-center gap-2 truncate"><span className="material-symbols-outlined text-[14px] text-primary">draft</span>{f.name}</span>
                                                    <button type="button" onClick={() => setCurMaterial(p => { const nf = (p.files || []).filter((_, i) => i !== idx); return { ...p, files: nf, fileUrl: nf[0]?.url || '', fileName: nf[0]?.name || '' }; })} className="text-white/30 hover:text-red-400 shrink-0"><span className="material-symbols-outlined text-[16px]">close</span></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Capa */}
                                <div className="space-y-2">
                                    <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Capa / Miniatura (opcional)</label>
                                    <div className="flex gap-2">
                                        <input value={curMaterial.thumbnailUrl} onChange={e => setCurMaterial(p => ({ ...p, thumbnailUrl: e.target.value }))} className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm" placeholder="URL ou faça upload" />
                                        <label className="cursor-pointer px-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
                                            <span className="material-symbols-outlined text-base">upload</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={async e => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                try { const compressed = await compressImage(file, 'landscape'); setCurMaterial(p => ({ ...p, thumbnailUrl: compressed })); } catch { alert('Erro ao processar imagem.'); }
                                            }} />
                                        </label>
                                    </div>
                                    {curMaterial.thumbnailUrl && (
                                        <div className="relative w-40 aspect-video rounded-xl border border-white/10 overflow-hidden bg-black/40 mt-2">
                                            <img src={curMaterial.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                            <button type="button" onClick={() => setCurMaterial(p => ({ ...p, thumbnailUrl: '' }))} className="absolute bottom-2 right-2 text-red-400 hover:text-red-300"><span className="material-symbols-outlined text-base">delete</span></button>
                                        </div>
                                    )}
                                </div>

                                <button type="submit" disabled={uploadingMaterial} className="px-8 py-3.5 bg-primary text-black font-label font-bold text-[10px] uppercase tracking-[2px] rounded-xl hover:bg-white transition-all disabled:opacity-50">Salvar Material</button>
                            </form>
                        </div>
                    )}

                    {/* Filtro + Lista */}
                    {materialCategories.length === 0 ? (
                        <div className="liquid-glass-soft p-10 text-center border-white/5">
                            <span className="material-symbols-outlined text-white/10 text-5xl block mb-3">category</span>
                            <p className="text-white/20 font-label text-[10px] tracking-widest uppercase">Crie uma categoria acima para começar</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setMatFilterCat('all')} className={`px-4 py-2 rounded-full font-label text-[9px] tracking-widest uppercase border transition-all ${matFilterCat === 'all' ? 'bg-primary text-black border-primary' : 'text-white/40 border-white/10 hover:text-white'}`}>Todos</button>
                                {materialCategories.map(c => (
                                    <button key={c.id} onClick={() => setMatFilterCat(c.id)} className={`px-4 py-2 rounded-full font-label text-[9px] tracking-widest uppercase border transition-all ${matFilterCat === c.id ? 'bg-primary text-black border-primary' : 'text-white/40 border-white/10 hover:text-white'}`}>{c.name}</button>
                                ))}
                            </div>

                            {(() => {
                                const list = (matFilterCat === 'all' ? supportMaterials : supportMaterials.filter(m => m.categoryId === matFilterCat)).slice().sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999) || b.createdAt - a.createdAt);
                                if (list.length === 0) return (
                                    <div className="liquid-glass-soft p-10 text-center border-white/5">
                                        <span className="material-symbols-outlined text-white/10 text-5xl block mb-3">folder_open</span>
                                        <p className="text-white/20 font-label text-[10px] tracking-widest uppercase">Nenhum material nesta categoria</p>
                                    </div>
                                );
                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                        {list.map((m: SupportMaterial) => {
                                            const cat = materialCategories.find(c => c.id === m.categoryId);
                                            return (
                                                <div key={m.id} className="liquid-glass-soft overflow-hidden flex flex-col border-white/5 hover:border-white/10 transition-all rounded-2xl">
                                                    <div className="relative aspect-video bg-black/40 overflow-hidden">
                                                        {m.thumbnailUrl ? <img src={m.thumbnailUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-white/10 text-5xl">{m.type === 'video' ? 'movie' : 'image'}</span></div>}
                                                        <span className={`absolute top-2 left-2 px-2.5 py-1 rounded-full font-label text-[8px] font-bold tracking-widest uppercase ${m.type === 'video' ? 'bg-purple-500/20 text-purple-200 border border-purple-400/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>{m.type === 'video' ? 'Vídeo' : 'Post'}</span>
                                                    </div>
                                                    <div className="p-4 flex flex-col gap-2 flex-1">
                                                        {cat && <span className="text-[9px] tracking-widest uppercase font-label text-primary/70">{cat.name}</span>}
                                                        <h4 className="font-headline text-sm font-bold text-white leading-tight line-clamp-2">{m.title}</h4>
                                                        {m.description && <p className="text-white/30 text-xs line-clamp-2 flex-1">{m.description}</p>}
                                                        <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
                                                            <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-white/30 hover:text-primary p-1" title="Abrir arquivo"><span className="material-symbols-outlined text-[16px]">open_in_new</span></a>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => { setCurMaterial({ id: m.id, categoryId: m.categoryId, title: m.title, description: m.description || '', type: m.type, fileUrl: m.fileUrl, thumbnailUrl: m.thumbnailUrl || '', fileName: m.fileName || '', files: (m.files && m.files.length ? m.files : (m.fileUrl ? [{ url: m.fileUrl, name: m.fileName || m.title }] : [])) }); setIsEditingMaterial(true); }} className="text-white/30 hover:text-white p-1"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                                                                <button onClick={() => { if (confirm('Excluir este material?')) deleteMaterial(m.id); }} className="text-white/20 hover:text-red-400 p-1"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </>
                    )}
                </section>

                {/* Treinamentos ao Vivo */}
                <TreinamentosAdmin />

            </main>
            <footer className="mt-20 py-10 border-t border-white/[0.05] relative z-10 px-6">
                <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-1 text-center md:text-left">
                        <p className="text-white/20 font-label text-[10px] tracking-widest uppercase italic">Proteção de Dados Ativa: Salvamento Duplo Híbrido</p>
                        <p className="text-white/10 text-[8px] uppercase tracking-[4px]">Integridade Garantida via localStorage + Supabase</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => { if (confirm('Isso irá limpar seu cache local e atualizar a página. Você pode perder alterações NÃO sincronizadas com a nuvem. Continuar?')) clearLocalCache(); }} 
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/30 hover:text-red-400 hover:border-red-400/30 transition-all font-label text-[9px] uppercase tracking-widest"
                        >
                            Limpar Cache Local
                        </button>
                    </div>
                </div>
            </footer>

            {/* Modal de Reordenação */}
            {isReordering && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsReordering(false)}></div>
                    <div className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-2xl overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div>
                                <h3 className="font-headline text-lg text-primary uppercase">Reordenar Módulos</h3>
                                <p className="text-[9px] font-label uppercase text-white/30 tracking-widest mt-1">Arraste os itens para definir a ordem</p>
                            </div>
                            <button onClick={() => setIsReordering(false)} className="text-white/40 hover:text-white font-label text-[10px] uppercase tracking-widest">
                                Fechar
                            </button>
                        </div>

                        {/* Draggable List */}
                        <Reorder.Group axis="y" values={reorderList} onReorder={setReorderList} className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar-premium">
                            {reorderList.map(item => (
                                <Reorder.Item key={item.id} value={item} className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl cursor-grab active:cursor-grabbing select-none transition-colors group">
                                    <span className="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors">drag_indicator</span>
                                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden">
                                        {item.thumbnailUrl && <img src={item.thumbnailUrl} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="" />}
                                        <span className="material-symbols-outlined text-white/60 text-lg relative z-10">{item.icon}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-headline text-sm font-bold text-white truncate">{item.title}</p>
                                        <p className="font-label text-[8px] text-white/30 uppercase tracking-widest mt-0.5">{item.instructor}</p>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>

                        <button onClick={async () => {
                            try {
                                await updateCoursesOrder(reorderList);
                                setIsReordering(false);
                            } catch (err) {
                                alert('Erro ao salvar nova ordem dos módulos.');
                            }
                        }} className="w-full bg-primary text-black font-bold uppercase rounded-xl py-3.5 text-xs tracking-[2px] hover:bg-white transition-all shadow-lg">
                            Confirmar Nova Ordem
                        </button>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default Admin;
