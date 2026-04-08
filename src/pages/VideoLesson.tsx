import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useData, type Lesson, type Course } from '../context/DataContext';
import { loadYouTubeAPI, getYouTubeId } from '../lib/youtube';

const fmtTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
};

const VideoLesson: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { courses, lessons, updateCourse, updateProgress, isLoading: dataLoading } = useData();

    // ── DATA RESOLUTION ───────────────────────────────────────────────────
    // We determine if the URL ID is a Course or a specific Lesson
    const isLessonUrl = lessons.find(l => l.id === id);
    const isCourseUrl = courses.find(c => c.id === id);

    let activeCourse: Course | undefined;
    let activeLesson: Lesson | undefined;

    if (isLessonUrl) {
        activeLesson = isLessonUrl;
        activeCourse = courses.find(c => c.id === activeLesson?.courseId);
    } else if (isCourseUrl) {
        activeCourse = isCourseUrl;
        // Find first unfinished lesson for this course
        const cls = lessons.filter(l => l.courseId === activeCourse?.id).sort((a,b) => a.position - b.position);
        activeLesson = cls.find(l => (l.progress ?? 0) < 100) ?? cls[0];
    } else {
        // Fallback to first course/lesson if something is wrong
        activeCourse = courses[0];
        const cls = lessons.filter(l => l && l.courseId === activeCourse?.id).sort((a,b) => a.position - b.position);
        activeLesson = cls[0];
    }

    // Safety: If activeLesson exists but course is missing (e.g. sync mismatch), try to recover
    if (activeLesson && !activeCourse) {
        activeCourse = courses.find(c => c.id === activeLesson?.courseId);
    }

    // Lessons for the current course cronograma
    const courseLessons = lessons
        .filter(l => l.courseId === activeCourse?.id)
        .sort((a, b) => a.position - b.position);

    const [showResume, setShowResume] = useState(false);

    // ── EFFECTS ────────────────────────────────────────────────────────────

    // Sync URL when auto-advancing or changing lesson locally
    const changeLesson = (newId: string) => {
        navigate(`/lesson/${newId}`);
        window.scrollTo(0, 0);
    };

    // Show resume banner if progress exists
    useEffect(() => {
        const item = activeLesson ?? activeCourse;
        const ws = item?.watchedSeconds ?? 0;
        const prog = item?.progress ?? 0;
        if (ws > 10 && prog < 98) setShowResume(true);
        else setShowResume(false);
    }, [id, activeLesson?.id]);

    // Record visit
    useEffect(() => {
        if (activeCourse?.id) updateCourse(activeCourse.id, { lastWatchedAt: Date.now() });
    }, [activeCourse?.id]);

    // ── PLAYER LOGIC ───────────────────────────────────────────────────────
    const currentVideoUrl = activeLesson?.videoUrl ?? activeCourse?.videoUrl ?? '';
    const ytVideoId = getYouTubeId(currentVideoUrl);
    const currentItemId = activeLesson?.id ?? activeCourse?.id ?? '';
    const currentWatchedSeconds = activeLesson?.watchedSeconds ?? activeCourse?.watchedSeconds ?? 0;
    const ytPlayerId = 'main-yt-player';

    const videoRef = useRef<HTMLVideoElement>(null);
    const ytPlayerRef = useRef<any>(null);
    const progressIntervalRef = useRef<number | null>(null);
    
    // Tracking tempo real acumulado
    const lastAccumulatedRef = useRef<number>(currentWatchedSeconds);
    const lastPlayerTimeRef = useRef<number>(currentWatchedSeconds);

    // ── PLAYER LIFECYCLE ──────────────────────────────────────────────────
    useEffect(() => {
        if (!ytVideoId || !currentItemId || dataLoading) return;
        
        const initPlayer = async () => {
            try {
                await loadYouTubeAPI();
                
                // If the player already exists, just change the video
                if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
                    console.log('[Player] Reusing existing player for:', ytVideoId);
                    ytPlayerRef.current.loadVideoById({
                        videoId: ytVideoId,
                        startSeconds: currentWatchedSeconds
                    });
                    return;
                }

                // Otherwise, wait for DOM and create it
                await new Promise(r => setTimeout(r, 300));
                const el = document.getElementById(ytPlayerId);
                if (!el) return;

                console.log('[Player] Initializing new player for:', ytVideoId);
                ytPlayerRef.current = new (window as any).YT.Player(ytPlayerId, {
                    videoId: ytVideoId,
                    playerVars: {
                        autoplay: 1,
                        modestbranding: 1,
                        rel: 0,
                        start: Math.floor(currentWatchedSeconds),
                        origin: window.location.origin
                    },
                    events: {
                        onReady: (e: any) => {
                            if (currentWatchedSeconds > 0) e.target.seekTo(currentWatchedSeconds, true);
                            e.target.playVideo();
                            startPoll();
                        },
                        onStateChange: (e: any) => {
                            // YT.PlayerState.ENDED = 0
                            if (e.data === 0) {
                                const cls = lessons.filter(l => l.courseId === activeCourse?.id).sort((a,b) => a.position - b.position);
                                const idx = cls.findIndex(l => l.id === activeLesson?.id);
                                if (idx !== -1 && idx < cls.length - 1) {
                                    changeLesson(cls[idx+1].id);
                                }
                            }
                        }
                    }
                });
            } catch (err) {
                console.error('[Player] Init failed', err);
            }
        };

        initPlayer();

        const startPoll = () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = window.setInterval(() => {
                if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime && ytPlayerRef.current.getPlayerState) {
                    const status = ytPlayerRef.current.getPlayerState();
                    const currentTime = ytPlayerRef.current.getCurrentTime();
                    const duration = ytPlayerRef.current.getDuration();
                    
                    // YT.PlayerState.PLAYING = 1
                    if (status === 1 && duration > 0) {
                        const delta = currentTime - lastPlayerTimeRef.current;
                        
                        // Se o avanço for pequeno ( < 5s), contamos como tempo assistido real
                        if (delta > 0 && delta < 5) {
                            lastAccumulatedRef.current += delta;
                        }
                        
                        lastPlayerTimeRef.current = currentTime;
                        
                        const progress = Math.min(Math.floor((lastAccumulatedRef.current / duration) * 100), 100);
                        updateProgress(currentItemId, lastAccumulatedRef.current, progress, duration, currentTime);
                    } else {
                        // Apenas atualizamos a última posição para evitar saltos se pausar e voltar
                        lastPlayerTimeRef.current = currentTime;
                    }
                }
            }, 3000);
        };

        return () => {
            // We don't destroy the player here unless the whole component unmounts
            // because subsequent effects for the SAME component will reuse it.
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [currentItemId, ytVideoId, dataLoading]);

    // Clean up player on UNMOUNT only
    useEffect(() => {
        return () => {
            if (ytPlayerRef.current) {
                try { ytPlayerRef.current.destroy(); } catch {}
                ytPlayerRef.current = null;
            }
        };
    }, []);

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const { currentTime, duration } = videoRef.current;
        if (isNaN(duration) || duration === 0) return;
        const progress = Math.min(Math.round((currentTime / duration) * 100), 100);
        updateProgress(currentItemId, currentTime, progress, duration);
    };

    const handleLoadedMetadata = () => {
        if (!videoRef.current) return;
        const { duration } = videoRef.current;
        if (isNaN(duration)) return;
        if (currentWatchedSeconds > 5) videoRef.current.currentTime = currentWatchedSeconds;
    };

    // ── SAFE RENDERING ───────────────────────────────────────────────────
    if (dataLoading) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin"></div>
            </div>
        );
    }

    if (!activeCourse) {
        return (
            <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center animate-pulse">
                    <span className="material-symbols-outlined text-white/20 text-4xl">video_library</span>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="font-headline text-xl text-white font-bold uppercase tracking-tight">Conteúdo não localizado</h2>
                    <p className="text-white/40 text-xs font-label tracking-widest uppercase">O curso ou aula solicitado não foi encontrado.</p>
                </div>
                <a href="/" className="bg-white text-black px-8 py-3.5 rounded-xl font-headline font-bold text-[10px] tracking-widest uppercase hover:bg-primary transition-all">Voltar ao Início</a>
            </div>
        );
    }

    const tags = activeCourse.tags?.filter(Boolean) ?? [];
    const displayTitle = activeLesson?.title ?? activeCourse.title;
    const displayProgress = activeLesson?.progress ?? activeCourse.progress ?? 0;
    const instructorTitle = activeCourse.instructorTitle || 'Mestre ATL';

    return (
        <div className="bg-[#030303] min-h-screen text-white font-body relative overflow-x-hidden">
            <div className="fixed inset-0 z-0">
                <div className="absolute top-1/2 left-1/4 w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.02]"></div>
            </div>

            <Navbar isFixed={false} />

            <main className="relative z-10 max-w-[1700px] mx-auto px-4 lg:px-12 py-6 md:py-10">
                <div className="flex flex-col lg:flex-row gap-10">

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0 space-y-8">
                        {/* Status Breadcrumb */}
                        <div className="flex items-center gap-2 text-white/20 font-label text-[9px] uppercase tracking-[4px] overflow-hidden whitespace-nowrap">
                            <span className="truncate max-w-[200px]">{activeCourse.title}</span>
                            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                            <span className="text-primary truncate">{activeLesson?.title || 'Panorama Geral'}</span>
                        </div>

                        {/* Player Container */}
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-r from-primary/10 via-transparent to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-duration-1000"></div>
                            <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/5 shadow-2xl ring-1 ring-white/5">
                                {currentVideoUrl ? (
                                    ytVideoId ? (
                                        <div id={ytPlayerId} className="w-full h-full" />
                                    ) : (
                                        <video
                                            key={currentVideoUrl}
                                            ref={videoRef}
                                            src={currentVideoUrl}
                                            className="w-full h-full object-contain"
                                            controls autoPlay
                                            onTimeUpdate={handleTimeUpdate}
                                            onLoadedMetadata={handleLoadedMetadata}
                                        />
                                    )
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center space-y-8 bg-[#080808]">
                                        <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02] shadow-inner">
                                            <span className="material-symbols-outlined text-white/10 text-4xl">cloud_off</span>
                                        </div>
                                        <div className="text-center space-y-2">
                                            <p className="text-white/30 font-headline text-sm tracking-[6px] uppercase font-bold text-shadow">Sinal de Vídeo Indisponível</p>
                                            <p className="text-white/10 font-label text-[8px] uppercase tracking-[2px]">Aguardando conexão com o servidor de mídia</p>
                                        </div>
                                    </div>
                                )}

                                {/* Modern Resume Banner */}
                                {showResume && (
                                    <div className="absolute bottom-6 left-6 right-6 z-30 animate-in slide-in-from-bottom-2 duration-500">
                                        <div className="bg-black/90 backdrop-blur-2xl border border-primary/30 rounded-[2rem] px-8 py-5 flex items-center justify-between gap-6 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5),0_0_20px_rgba(0,255,135,0.1)]">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                                    <span className="material-symbols-outlined text-primary text-2xl">play_arrow</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-headline font-bold text-sm uppercase tracking-widest leading-none">Retomar Aula</h4>
                                                    <p className="text-primary/70 font-label text-[10px] mt-1 uppercase tracking-widest">Sincronizado em {fmtTime(currentWatchedSeconds)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => {
                                                    if (ytPlayerRef.current?.seekTo) ytPlayerRef.current.seekTo(currentWatchedSeconds, true);
                                                    else if (videoRef.current) videoRef.current.currentTime = currentWatchedSeconds;
                                                    setShowResume(false);
                                                }} className="bg-primary text-black font-headline font-bold text-[11px] uppercase tracking-[2px] px-8 py-3.5 rounded-2xl hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-lg">Continuar</button>
                                                <button onClick={() => setShowResume(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-white/20 hover:text-white transition-colors">
                                                    <span className="material-symbols-outlined text-xl">close</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Title & Info Section */}
                        <div className="space-y-8">
                            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-10 border-b border-white/[0.05]">
                                <div className="space-y-5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2.5 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00FD86]"></span>
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-[2px]">{activeLesson ? 'Sessão Individual' : 'Panorama do Módulo'}</span>
                                        </div>
                                        <div className="h-4 w-px bg-white/10"></div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${displayProgress}%` }}></div>
                                            </div>
                                            <span className="text-white/40 font-bold text-[11px] uppercase tracking-widest">{displayProgress}%</span>
                                        </div>
                                    </div>
                                    <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight uppercase leading-[0.9] text-shadow">
                                        {displayTitle}
                                    </h1>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="flex-1 md:flex-none liquid-glass-soft border border-white/5 px-8 py-4 rounded-2xl font-label text-[10px] tracking-widest uppercase hover:bg-white/10 hover:border-white/20 transition-all font-bold">Recursos</button>
                                    <button className="flex-1 md:flex-none bg-white text-black px-10 py-4 rounded-2xl font-headline font-bold text-[10px] tracking-[3px] uppercase hover:bg-primary transition-all shadow-2xl active:scale-95">Concluir Sessão</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                                <div className="xl:col-span-2 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-1 h-8 bg-primary/50"></div>
                                        <h3 className="font-headline text-2xl font-bold uppercase tracking-tight">Objetivos de Aprendizado</h3>
                                    </div>
                                    <p className="text-white/50 text-lg leading-relaxed font-light">
                                        {activeCourse.description || `Esta sessão explora os protocolos fundamentais de ${activeCourse.title}. Focamos na aplicação prática de estratégias de alto impacto desenvolvidas especificamente para o ecossistema ATL.`}
                                    </p>
                                    {tags.length > 0 && (
                                        <div className="flex flex-wrap gap-3 pt-4">
                                            {tags.map(tag => (
                                                <div key={tag} className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[9px] font-label text-white/40 uppercase tracking-[3px] hover:border-primary/30 hover:text-white transition-all cursor-default">
                                                    {tag}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="liquid-glass-card p-10 space-y-8 border-primary/10">
                                    <div className="text-center space-y-6">
                                        <h3 className="font-label text-[10px] tracking-[6px] uppercase text-white/30 font-bold">Instrutor Líder</h3>
                                        <div className="relative mx-auto w-24 h-24">
                                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
                                            <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-primary/30 to-transparent border border-primary/40 flex items-center justify-center shadow-2xl ring-1 ring-white/10">
                                                <span className="material-symbols-outlined text-primary text-5xl">shield_person</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="font-headline font-bold text-2xl text-white uppercase tracking-tight">{activeCourse.instructor}</p>
                                            <p className="text-[10px] text-primary/80 font-label uppercase tracking-[4px] font-bold">{instructorTitle}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: New Unified Cronograma */}
                    <aside className="w-full lg:w-[450px] shrink-0">
                        <div className="liquid-glass-card p-8 flex flex-col lg:h-[calc(100vh-140px)] sticky top-28 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h2 className="font-headline text-3xl font-bold tracking-tight uppercase leading-none">Cronograma</h2>
                                    <p className="text-[9px] font-label text-white/20 uppercase tracking-[5px] mt-2 font-bold">Conteúdo do Módulo</p>
                                </div>
                                <div className="bg-white/[0.03] border border-white/10 px-5 py-2 rounded-2xl">
                                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest leading-none">
                                        {courseLessons.length} AULA{courseLessons.length !== 1 ? 'S' : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4 overflow-y-auto pr-3 custom-scrollbar-premium flex-1">
                                {courseLessons.length > 0 ? (
                                    courseLessons.map((lesson, idx) => {
                                        const isActive = lesson.id === activeLesson?.id;
                                        const lessonProgress = lesson.progress ?? 0;
                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => changeLesson(lesson.id)}
                                                className={`w-full group text-left p-2 rounded-3xl border transition-all duration-500 flex items-center gap-5 ${isActive ? 'bg-primary/10 border-primary/40 shadow-[0_20px_50px_rgba(0,255,135,0.1)]' : 'bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/10'}`}
                                            >
                                                <div className="relative w-28 aspect-video rounded-2xl overflow-hidden shadow-2xl shrink-0">
                                                    {lesson.thumbnailUrl ? (
                                                        <img src={lesson.thumbnailUrl} className={`w-full h-full object-cover transition-all duration-1000 ${isActive ? 'scale-110 brightness-110' : 'opacity-40 brightness-75 group-hover:opacity-100 group-hover:scale-105'}`} alt="" />
                                                    ) : (
                                                        <div className="w-full h-full bg-[#080808] flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-white/5 text-2xl">motion_photos_on</span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Overlays */}
                                                    <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                        <span className={`material-symbols-outlined transition-all duration-500 ${isActive ? 'text-primary scale-125' : 'text-white scale-100'}`}>
                                                            {isActive ? 'graphic_eq' : 'play_arrow'}
                                                        </span>
                                                    </div>

                                                    {lessonProgress === 100 && (
                                                        <div className="absolute top-2 right-2 bg-primary text-black rounded-full p-0.5 z-20 shadow-xl border border-white/20">
                                                            <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                                                        </div>
                                                    )}

                                                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest text-white/70">
                                                        {lesson.duration || '00:00'}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0 pr-4">
                                                    <span className="text-[8px] font-bold tracking-[4px] text-white/20 uppercase block mb-1">Sessão {idx + 1}</span>
                                                    <p className={`text-[13px] font-bold truncate leading-tight tracking-tight ${isActive ? 'text-primary' : 'text-white/60 group-hover:text-white'}`}>{lesson.title}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <div className="flex-1 h-[2px] bg-white/5 rounded-full overflow-hidden">
                                                            <div className={`h-full transition-all duration-1000 ${isActive ? 'bg-primary' : 'bg-white/20'}`} style={{ width: `${lessonProgress}%` }}></div>
                                                        </div>
                                                        {lessonProgress > 0 && (
                                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-primary' : 'text-white/30'}`}>{lessonProgress}%</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center py-20 px-10 text-center animate-in fade-in duration-1000">
                                        <div className="w-24 h-24 rounded-[2rem] bg-white/[0.01] border border-white/5 flex items-center justify-center mb-8 shadow-inner ring-1 ring-white/[0.02]">
                                            <span className="material-symbols-outlined text-white/10 text-4xl animate-pulse">database</span>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-white font-headline text-lg uppercase tracking-[4px] font-bold text-shadow">Módulo Offline</p>
                                            <p className="text-white/20 font-label text-[10px] uppercase tracking-[3px] leading-relaxed max-w-[200px] mx-auto">
                                                Nenhuma sessão adicional registrada na base de dados local para este setor de inteligência.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>

                </div>
            </main>
        </div>
    );
};

export default VideoLesson;
