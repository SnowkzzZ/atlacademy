import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, type Course } from '../context/DataContext';
import Navbar from '../components/Navbar';

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(dataUrl);
                } else {
                    resolve(event.target?.result as string);
                }
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

const Admin: React.FC = () => {
    const { courses, sectors, articles, addCourse, updateCourse, deleteCourse, addSector, updateSector, deleteSector, addArticle, updateArticle, deleteArticle } = useData();
    const navigate = useNavigate();

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Course Form State
    const [isEditingCourse, setIsEditingCourse] = useState(false);
    const [currentCourse, setCurrentCourse] = useState<Partial<Course>>({});

    // Sector Form State
    const [newSectorName, setNewSectorName] = useState('');
    const [editingSectorId, setEditingSectorId] = useState<string | null>(null);
    const [editingSectorName, setEditingSectorName] = useState('');

    // Article Form State
    const [isEditingArticle, setIsEditingArticle] = useState(false);
    const [currentArticle, setCurrentArticle] = useState<{ id?: string; sectorId: string; title: string; content: string; author: string }>({ sectorId: '', title: '', content: '', author: 'ATL Academy' });

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'juliano.atl' && password === 'Temp482*') {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Credenciais inválidas. Acesso negado.');
        }
    };

    const handleSaveCourse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCourse.title || !currentCourse.instructor) return;

        if (currentCourse.id) {
            updateCourse(currentCourse.id, currentCourse as Course);
        } else {
            addCourse({
                title: currentCourse.title || '',
                instructor: currentCourse.instructor || '',
                duration: currentCourse.duration || '00h 00m',
                icon: currentCourse.icon || 'play_lesson',
                progress: Number(currentCourse.progress) || 0,
                videoUrl: currentCourse.videoUrl || '',
                thumbnailUrl: currentCourse.thumbnailUrl || ''
            });
        }
        setIsEditingCourse(false);
        setCurrentCourse({});
    };

    const handleEditClick = (course: Course) => {
        setCurrentCourse(course);
        setIsEditingCourse(true);
    };

    const handleAddSector = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSectorName.trim()) { addSector(newSectorName); setNewSectorName(''); }
    };

    const handleSaveArticle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentArticle.title || !currentArticle.sectorId || !currentArticle.content) return;
        if (currentArticle.id) {
            updateArticle(currentArticle.id, currentArticle);
        } else {
            addArticle({ sectorId: currentArticle.sectorId, title: currentArticle.title, content: currentArticle.content, author: currentArticle.author });
        }
        setIsEditingArticle(false);
        setCurrentArticle({ sectorId: '', title: '', content: '', author: 'ATL Academy' });
    };

    if (!isAuthenticated) {
        return (
            <div className="bg-[#030303] min-h-screen relative flex items-center justify-center font-body selection:bg-white selection:text-black">
                <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-[#030303]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] opacity-60"></div>
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

                            <input
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-all font-body text-sm"
                                placeholder="Usuário Master"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <input
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-all font-body text-sm"
                                placeholder="Senha de Acesso"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            <button type="submit" className="w-full bg-white text-black font-headline font-bold py-4 rounded-xl text-xs tracking-[2px] hover:bg-red-500 hover:text-white transition-all uppercase mt-4">
                                Verificar Credenciais
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#030303] text-white/90 min-h-screen font-body relative pb-32">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[#030303]"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.03]"></div>
            </div>

            <Navbar />

            <main className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-10 py-24 md:py-32 space-y-10 md:space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6 md:pb-8">
                    <div className="space-y-1 md:space-y-2 text-center md:text-left">
                        <h1 className="font-headline text-3xl md:text-5xl font-bold uppercase tracking-tight text-white/90">Central de Comando</h1>
                        <p className="font-label text-[9px] md:text-xs text-white/40 tracking-[3px] md:tracking-[4px] uppercase">Gerenciamento de Conteúdo Global</p>
                    </div>
                    <button onClick={() => navigate('/')} className="w-full md:w-auto px-6 py-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/10 transition-colors uppercase font-label text-[10px] tracking-[2px] flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">exit_to_app</span> Sair do Painel
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">

                    {/* Courses Management */}
                    <section className="lg:col-span-2 space-y-6 md:space-y-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <h2 className="font-headline text-xl md:text-2xl font-bold uppercase tracking-tight">Módulos Inteligentes</h2>
                            <button
                                onClick={() => { setCurrentCourse({}); setIsEditingCourse(true); }}
                                className="w-full sm:w-auto premium-pill py-3 md:py-2.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-black transition-all">
                                + Novo Módulo
                            </button>
                        </div>

                        {isEditingCourse ? (
                            <div className="liquid-glass-soft p-6 md:p-8 space-y-6 md:space-y-8 border-primary/20 relative z-20">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-headline text-lg md:text-xl text-primary uppercase tracking-tight">{currentCourse.id ? 'Editar' : 'Novo'} Módulo</h3>
                                    <button
                                        type="button"
                                        onClick={() => { setIsEditingCourse(false); setCurrentCourse({}); }}
                                        className="text-white/40 hover:text-white uppercase font-label text-[10px] tracking-widest transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>

                                <form onSubmit={handleSaveCourse} className="space-y-6 md:space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="font-label text-[9px] uppercase text-white/40">Título</label>
                                                <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all"
                                                    value={currentCourse.title || ''} onChange={e => setCurrentCourse({ ...currentCourse, title: e.target.value })} required />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="font-label text-[9px] uppercase text-white/40">Instrutor</label>
                                                <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all"
                                                    value={currentCourse.instructor || ''} onChange={e => setCurrentCourse({ ...currentCourse, instructor: e.target.value })} required />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="font-label text-[9px] uppercase text-white/40">Duração</label>
                                                    <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all"
                                                        value={currentCourse.duration || ''} onChange={e => setCurrentCourse({ ...currentCourse, duration: e.target.value })} placeholder="12h 30m" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="font-label text-[9px] uppercase text-white/40">Ícone</label>
                                                    <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all"
                                                        value={currentCourse.icon || ''} onChange={e => setCurrentCourse({ ...currentCourse, icon: e.target.value })} placeholder="terminal" />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="font-label text-[9px] uppercase text-white/40">Progresso (%)</label>
                                                <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all"
                                                    type="number" min="0" max="100" value={currentCourse.progress || 0} onChange={e => setCurrentCourse({ ...currentCourse, progress: Number(e.target.value) })} />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="font-label text-[9px] uppercase text-white/40 flex justify-between">
                                                    <span>URL Vídeo</span>
                                                    <span className="text-primary/40 font-label text-[8px]">Auto-detecta duração</span>
                                                </label>
                                                <input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none transition-all"
                                                    value={currentCourse.videoUrl || ''}
                                                    onChange={e => {
                                                        const url = e.target.value;
                                                        setCurrentCourse({ ...currentCourse, videoUrl: url });
                                                        if (url && (url.endsWith('.mp4') || url.includes('archive.org') || url.includes('sample-videos'))) {
                                                            const video = document.createElement('video');
                                                            video.src = url;
                                                            video.onloadedmetadata = () => {
                                                                const h = Math.floor(video.duration / 3600);
                                                                const m = Math.floor((video.duration % 3600) / 60);
                                                                const durationStr = `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
                                                                setCurrentCourse(prev => ({ ...prev, duration: durationStr, totalSeconds: video.duration }));
                                                            };
                                                        }
                                                    }} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="font-label text-[9px] uppercase text-white/40 flex justify-between">
                                                    <span>Thumbnail URL/Upload</span>
                                                    <span className="text-primary/40 font-label text-[8px]">Max 20MB</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <input className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 focus:border-primary outline-none text-xs transition-all"
                                                        value={currentCourse.thumbnailUrl || ''} onChange={e => setCurrentCourse({ ...currentCourse, thumbnailUrl: e.target.value })} />
                                                    <label className="cursor-pointer px-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
                                                        <span className="material-symbols-outlined text-base">upload</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                if (file.size > 20 * 1024 * 1024) { alert('Erro: Máximo 20MB'); return; }
                                                                try {
                                                                    const compressedDataUrl = await compressImage(file);
                                                                    setCurrentCourse({ ...currentCourse, thumbnailUrl: compressedDataUrl });
                                                                } catch (error) {
                                                                    console.error("Error compressing image:", error);
                                                                    alert("Erro ao processar imagem.");
                                                                }
                                                            }
                                                        }} />
                                                    </label>
                                                </div>
                                            </div>
                                            {currentCourse.thumbnailUrl && (
                                                <div className="relative aspect-video rounded-2xl border border-white/10 overflow-hidden bg-black/40 group">
                                                    <img src={currentCourse.thumbnailUrl} className="w-full h-full object-cover opacity-60 mix-blend-luminosity grayscale" alt="" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                                    <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 flex justify-between items-center bg-black/40 backdrop-blur-sm">
                                                        <span className="font-label text-[8px] tracking-[2px] uppercase text-white/40">Visualização Blend</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCurrentCourse({ ...currentCourse, thumbnailUrl: '' })}
                                                            className="text-red-400 hover:text-red-300 transition-colors flex items-center"
                                                        >
                                                            <span className="material-symbols-outlined text-base">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full bg-white text-black font-bold uppercase rounded-xl py-4 md:py-5 text-xs tracking-[2px] hover:bg-primary transition-all shadow-lg active:scale-95 transform">
                                        Salvar Protocolo
                                    </button>
                                </form>
                            </div>
                        ) : null}

                        <div className="space-y-4 md:space-y-5">
                            {courses.map(course => (
                                <div key={course.id} className="liquid-glass-soft p-4 md:p-6 flex flex-col sm:flex-row gap-4 md:gap-6 sm:items-center justify-between hover:bg-white/[0.03] transition-all border-white/5 group">
                                    <div className="flex gap-4 md:gap-6 items-center flex-1">
                                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/[0.05] flex items-center justify-center border border-white/10 relative overflow-hidden shrink-0">
                                            {course.thumbnailUrl && <img src={course.thumbnailUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 transition-opacity duration-500 group-hover:opacity-40" alt="" />}
                                            <span className="material-symbols-outlined text-white/60 text-lg md:text-2xl font-light relative z-10 group-hover:text-primary transition-colors">{course.icon}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-headline text-base md:text-lg font-bold text-white leading-tight truncate">{course.title}</h4>
                                            <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1 md:mt-2 font-label text-[9px] md:text-[10px] text-white/40 uppercase tracking-widest">
                                                <span className="truncate max-w-[120px]">{course.instructor}</span>
                                                <span className="w-1 h-1 bg-white/20 rounded-full shrink-0"></span>
                                                <span className="shrink-0">{course.duration}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                                        <button onClick={() => handleEditClick(course)} className="flex-1 sm:flex-none px-4 md:px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-label text-[9px] md:text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5 active:scale-95 transform">
                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                            <span className="hidden sm:inline">Editar</span>
                                        </button>
                                        <button onClick={() => deleteCourse(course.id)} className="flex-1 sm:flex-none px-4 md:px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/20 font-label text-[9px] md:text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 transform">
                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                            <span className="hidden sm:inline">Excluir</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Sectors Management — now with edit */}
                    <aside className="space-y-6 md:space-y-8">
                        <h2 className="font-headline text-xl md:text-2xl font-bold uppercase tracking-tight">Setores Ativos</h2>

                        <form onSubmit={handleAddSector} className="liquid-glass-soft p-5 md:p-6 space-y-4 flex flex-col border-white/5">
                            <label className="font-label text-[9px] md:text-[10px] uppercase text-white/40">Adicionar Novo Setor</label>
                            <div className="flex gap-2">
                                <input value={newSectorName} onChange={e => setNewSectorName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm transition-all" placeholder="Nome do Setor..." />
                                <button type="submit" className="bg-white text-black px-4 rounded-xl hover:bg-primary transition-all active:scale-95 transform shrink-0"><span className="material-symbols-outlined">add</span></button>
                            </div>
                        </form>

                        <div className="liquid-glass-soft p-4 md:p-6 space-y-2 border-white/5">
                            {sectors.map(sector => (
                                <div key={sector.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.05] transition-all group gap-2">
                                    {editingSectorId === sector.id ? (
                                        <input
                                            autoFocus
                                            value={editingSectorName}
                                            onChange={e => setEditingSectorName(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { updateSector(sector.id, editingSectorName); setEditingSectorId(null); } if (e.key === 'Escape') setEditingSectorId(null); }}
                                            onBlur={() => { updateSector(sector.id, editingSectorName); setEditingSectorId(null); }}
                                            className="flex-1 bg-black/50 border border-primary/40 rounded-lg px-3 py-1.5 text-sm outline-none text-white"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0" />
                                            <span className="font-body text-sm text-white/80 truncate">{sector.name}</span>
                                        </div>
                                    )}
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={() => { setEditingSectorId(sector.id); setEditingSectorName(sector.name); }} className="text-white/20 hover:text-white transition-colors p-1">
                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                        </button>
                                        <button onClick={() => deleteSector(sector.id)} className="text-white/20 hover:text-red-400 transition-colors p-1">
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>

                </div>

                {/* ===== Intelligence Hub Management ===== */}
                <section className="space-y-6 md:space-y-8 border-t border-white/10 pt-10 md:pt-12">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="font-headline text-xl md:text-2xl font-bold uppercase tracking-tight">Hub de Inteligência</h2>
                            <p className="font-label text-[10px] text-white/30 tracking-widest uppercase mt-1">Tutoriais e artigos por setor</p>
                        </div>
                        <button
                            onClick={() => { setCurrentArticle({ sectorId: sectors[0]?.id || '', title: '', content: '', author: 'ATL Academy' }); setIsEditingArticle(true); }}
                            className="w-full sm:w-auto premium-pill py-3 md:py-2.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-black transition-all"
                        >
                            + Novo Artigo
                        </button>
                    </div>

                    {isEditingArticle && (
                        <div className="liquid-glass-soft p-6 md:p-8 space-y-5 border-primary/20">
                            <div className="flex items-center justify-between">
                                <h3 className="font-headline text-lg text-primary uppercase tracking-tight">{currentArticle.id ? 'Editar' : 'Novo'} Artigo</h3>
                                <button onClick={() => { setIsEditingArticle(false); }} className="text-white/40 hover:text-white font-label text-[10px] uppercase tracking-widest">Cancelar</button>
                            </div>
                            <form onSubmit={handleSaveArticle} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Setor *</label>
                                        <select value={currentArticle.sectorId} onChange={e => setCurrentArticle(p => ({ ...p, sectorId: e.target.value }))} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm transition-all text-white">
                                            <option value="" disabled>Selecionar Setor...</option>
                                            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Autor</label>
                                        <input value={currentArticle.author} onChange={e => setCurrentArticle(p => ({ ...p, author: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm transition-all" placeholder="ATL Academy" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Título *</label>
                                    <input value={currentArticle.title} onChange={e => setCurrentArticle(p => ({ ...p, title: e.target.value }))} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm transition-all" placeholder="Título do artigo..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label text-[10px] text-white/40 uppercase tracking-widest">Conteúdo * <span className="text-white/20 normal-case tracking-normal">(use **texto** para negrito, nova linha para parágrafo)</span></label>
                                    <textarea
                                        value={currentArticle.content}
                                        onChange={e => setCurrentArticle(p => ({ ...p, content: e.target.value }))}
                                        required
                                        rows={10}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-primary text-sm transition-all resize-y font-mono"
                                        placeholder="Digite o conteúdo do artigo...&#10;&#10;Use **texto** para negritar.&#10;Use uma linha em branco para separar parágrafos."
                                    />
                                </div>
                                <button type="submit" className="w-full md:w-auto px-8 py-3.5 bg-primary text-black font-label font-bold text-[10px] uppercase tracking-[2px] rounded-xl hover:bg-white transition-all">
                                    Publicar Artigo
                                </button>
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
                                        <p className="text-white/30 font-body text-xs leading-relaxed flex-1 line-clamp-2">{article.content.replace(/\*\*/g, '').split('\n').filter(l => l.trim())[0]}</p>
                                        <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
                                            <span className="text-white/20 font-label text-[9px] tracking-widest uppercase">{article.author}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setCurrentArticle({ id: article.id, sectorId: article.sectorId, title: article.title, content: article.content, author: article.author }); setIsEditingArticle(true); }} className="text-white/30 hover:text-white transition-colors p-1">
                                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                                </button>
                                                <button onClick={() => deleteArticle(article.id)} className="text-white/20 hover:text-red-400 transition-colors p-1">
                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                </button>
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
