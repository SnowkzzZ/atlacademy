import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useData, type Lesson } from '../context/DataContext';
import { loadYouTubeAPI, getYouTubeId } from '../lib/youtube';

const fmtTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
};

const VideoLesson: React.FC = () => {
    const { id: courseId } = useParams();
    const navigate = useNavigate();
    const { courses, lessons, updateCourse, updateProgress } = useData();

    const course = courses.find(c => c.id === courseId) || courses[0];

    // Get lessons for THIS course only, sorted by position
    const courseLessons = lessons
        .filter(l => l.courseId === course?.id)
        .sort((a, b) => a.position - b.position);

    const hasLessons = courseLessons.length > 0;

    // Active lesson state — default to first unfinished
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const activeLesson: Lesson | undefined = hasLessons
        ? (courseLessons.find(l => l.id === activeLessonId) ?? courseLessons[0])
        : undefined;

    const [showResume, setShowResume] = useState(false);

    // Set initial active lesson
    useEffect(() => {
        if (courseLessons.length > 0) {
            const firstUnfinished = courseLessons.find(l => (l.progress ?? 0) < 100) ?? courseLessons[0];
            setActiveLessonId(firstUnfinished.id);
        }
    }, [course?.id, courseLessons.length]);

    // Show resume banner
    useEffect(() => {
        const item = activeLesson ?? course;
        const ws = item?.watchedSeconds ?? 0;
        const prog = (activeLesson?.progress ?? course?.progress) ?? 0;
        if (ws > 30 && prog < 100) setShowResume(true);
        else setShowResume(false);
    }, [activeLessonId, course?.id]);

    // Record last watched
    useEffect(() => {
        if (course) updateCourse(course.id, { lastWatchedAt: Date.now() });
    }, [course?.id]);

    // Current video source: lesson or fallback to course
    const currentVideoUrl = activeLesson?.videoUrl ?? course?.videoUrl ?? '';
    const ytVideoId = getYouTubeId(currentVideoUrl);
    const currentItemId = activeLesson?.id ?? course?.id ?? '';
    const currentWatchedSeconds = activeLesson?.watchedSeconds ?? course?.watchedSeconds ?? 0;
    const ytPlayerId = `yt-player-${currentItemId}`;

    const videoRef = useRef<HTMLVideoElement>(null);
    const ytPlayerRef = useRef<any>(null);
    const progressIntervalRef = useRef<number | null>(null);

    // YouTube player lifecycle
    useEffect(() => {
        if (!ytVideoId || !currentItemId) return;
        let destroyed = false;

        const stopPoll = () => {
            if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
        };

        const setup = async () => {
            await loadYouTubeAPI();
            if (destroyed) return;
            await new Promise(r => setTimeout(r, 100));
            if (destroyed || !document.getElementById(ytPlayerId)) return;

            ytPlayerRef.current = new window.YT.Player(ytPlayerId, {
                videoId: ytVideoId,
                playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
                events: {
                    onReady: (event: any) => {
                        const totalSecs = event.target.getDuration?.() ?? 0;
                        if (currentWatchedSeconds > 10) {
                            event.target.seekTo(currentWatchedSeconds, true);
                        }
                        if (totalSecs > 0) {
                            updateProgress(currentItemId, currentWatchedSeconds, activeLesson?.progress ?? course?.progress ?? 0, totalSecs);
                        }
                        progressIntervalRef.current = window.setInterval(() => {
                            if (destroyed || !ytPlayerRef.current) return;
                            const currentTime = ytPlayerRef.current.getCurrentTime?.() ?? 0;
                            const duration = ytPlayerRef.current.getDuration?.() ?? 0;
                            if (duration > 0) {
                                const progress = Math.min(Math.round((currentTime / duration) * 100), 100);
                                updateProgress(currentItemId, currentTime, progress, duration);
                            }
                        }, 3000);
                    },
                    onStateChange: (event: any) => {
                        if (event.data === 0) {
                            stopPoll();
                            updateProgress(currentItemId, ytPlayerRef.current?.getDuration?.() ?? 0, 100);
                            // Auto-advance to next lesson
                            if (activeLesson) {
                                const idx = courseLessons.findIndex(l => l.id === activeLesson.id);
                                if (idx < courseLessons.length - 1) {
                                    setTimeout(() => setActiveLessonId(courseLessons[idx + 1].id), 1500);
                                }
                            }
                        }
                    }
                }
            });
        };

        setup();
        return () => {
            destroyed = true;
            stopPoll();
            try { ytPlayerRef.current?.destroy(); } catch { }
            ytPlayerRef.current = null;
        };
    }, [ytVideoId, currentItemId]);

    // MP4 handlers
    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const { currentTime, duration } = videoRef.current;
        if (isNaN(duration)) return;
        if (Math.abs(currentTime - currentWatchedSeconds) > 2 || currentTime === duration) {
            const progress = Math.min(Math.round((currentTime / duration) * 100), 100);
            updateProgress(currentItemId, currentTime, progress, duration);
        }
    };

    const handleLoadedMetadata = () => {
        if (!videoRef.current) return;
        const { duration } = videoRef.current;
        if (isNaN(duration)) return;
        if (currentWatchedSeconds > 10) videoRef.current.currentTime = currentWatchedSeconds;
        if (!activeLesson?.totalSeconds && !course?.totalSeconds) {
            updateProgress(currentItemId, currentWatchedSeconds, activeLesson?.progress ?? course?.progress ?? 0, duration);
        }
    };

    if (!course) return null;

    const tags = course.tags?.filter(Boolean) ?? [];
    const instructorTitle = course.instructorTitle || 'Especialista ATL';
    const description = course.description || `Exploração dos protocolos de ${course.title.toLowerCase()}. Nesta masterclass, focamos na implementação prática e resultados de alta performance para o ecossistema ATL.`;

    // Cronograma: lessons of THIS course, or fall back to all courses if no lessons
    const displayTitle = activeLesson?.title ?? course.title;
    const displayProgress = activeLesson?.progress ?? course.progress;

    return (
        <div className="bg-[#030303] min-h-screen text-white font-body selection:bg-primary selection:text-black relative">
            <div className="fixed inset-0 z-0">
                <div className="absolute top-1/2 left-1/4 w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.02]"></div>
            </div>

            <Navbar isFixed={false} />

            <main className="relative z-10 max-w-[1600px] mx-auto px-4 md:px-10 py-6 md:py-10">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Main Content */}
                    <div className="flex-1 space-y-6 md:space-y-10">
                        {/* Breadcrumb */}
                        {hasLessons && (
                            <div className="flex items-center gap-2 text-white/30 font-label text-[10px] uppercase tracking-widest">
                                <span>{course.title}</span>
                                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                                <span className="text-primary">{activeLesson?.title}</span>
                            </div>
                        )}

                        {/* Video Player */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            <div className="relative aspect-video bg-black rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                                {currentVideoUrl ? (
                                    ytVideoId ? (
                                        <div key={currentItemId} id={ytPlayerId} className="w-full h-full" />
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
                                    <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                                        <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02]">
                                            <span className="material-symbols-outlined text-white/20 text-4xl">play_circle</span>
                                        </div>
                                        <p className="text-white/20 font-label text-xs tracking-[6px] uppercase">Sinal de Vídeo Offline</p>
                                    </div>
                                )}

                                {/* Resume Banner */}
                                {showResume && (
                                    <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between gap-4 bg-black/80 backdrop-blur-xl border border-primary/30 rounded-2xl px-5 py-3.5 shadow-[0_0_30px_rgba(0,255,135,0.15)]">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary">history</span>
                                            <div>
                                                <p className="text-white font-label text-xs uppercase tracking-widest">Continuar de onde parou</p>
                                                <p className="text-primary/70 font-label text-[10px]">{fmtTime(currentWatchedSeconds)} · {displayProgress}% completo</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button onClick={() => {
                                                if (ytPlayerRef.current) ytPlayerRef.current.seekTo(currentWatchedSeconds, true);
                                                else if (videoRef.current) videoRef.current.currentTime = currentWatchedSeconds;
                                                setShowResume(false);
                                            }} className="bg-primary text-black font-headline font-bold text-[10px] uppercase tracking-[2px] px-5 py-2.5 rounded-xl hover:bg-white transition-all">Retomar</button>
                                            <button onClick={() => setShowResume(false)} className="text-white/40 hover:text-white"><span className="material-symbols-outlined text-xl">close</span></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="space-y-6 px-2 md:px-0">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="premium-pill py-1 px-4 text-[8px] bg-primary/10 border-primary/20 text-primary">AULA ATUAL</span>
                                        <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${displayProgress}%` }}></div>
                                        </div>
                                        <span className="text-white/40 font-bold text-[10px] uppercase tracking-widest">{displayProgress}%</span>
                                    </div>
                                    <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tight uppercase leading-[1.1]">{displayTitle}</h1>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="liquid-glass-soft border border-white/10 px-8 py-4 rounded-xl font-label text-[10px] tracking-widest uppercase hover:bg-white/10 transition-all font-bold">Arquivos</button>
                                    <button className="bg-white text-black px-10 py-4 rounded-xl font-headline font-bold text-[10px] tracking-[2px] uppercase hover:bg-primary transition-all shadow-xl">Concluir</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="md:col-span-2 space-y-6">
                                    <h3 className="font-headline text-xl font-bold uppercase">Conteúdo da Sessão</h3>
                                    <p className="text-white/60 text-base leading-relaxed font-light">{description}</p>
                                    {tags.length > 0 && (
                                        <div className="flex flex-wrap gap-4 pt-4">
                                            {tags.map(tag => <div key={tag} className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-[10px] font-label text-white/40 uppercase tracking-widest">{tag}</div>)}
                                        </div>
                                    )}
                                </div>
                                <div className="liquid-glass-soft p-8 space-y-6">
                                    <h3 className="font-label text-xs tracking-[4px] uppercase text-white/40">INSTRUTOR LÍDER</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 flex items-center justify-center shadow-lg">
                                            <span className="material-symbols-outlined text-primary text-3xl">shield_person</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-white">{course.instructor}</p>
                                            <p className="text-[10px] text-primary font-label uppercase tracking-[3px] mt-1">{instructorTitle}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Cronograma */}
                    <div className="w-full lg:w-[420px] shrink-0">
                        <div className="liquid-glass-card p-6 md:p-8 flex flex-col lg:max-h-[85vh] sticky top-24">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="font-headline text-2xl font-bold tracking-tight uppercase leading-none">Cronograma</h2>
                                    <p className="text-[10px] font-label text-white/30 uppercase tracking-[4px] mt-1">{course.title}</p>
                                </div>
                                <div className="bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                        {hasLessons ? `${courseLessons.length} Aulas` : `${courses.length} Módulos`}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {hasLessons ? (
                                    // Show THIS course's lessons only
                                    courseLessons.map((lesson) => {
                                        const isActive = lesson.id === activeLesson?.id;
                                        const lessonProgress = lesson.progress ?? 0;
                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => setActiveLessonId(lesson.id)}
                                                className={`w-full group text-left p-4 rounded-2xl border transition-all duration-500 flex items-center gap-4 ${isActive ? 'bg-primary/10 border-primary/40 shadow-[0_20px_40px_rgba(0,255,135,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.08]'}`}
                                            >
                                                <div className={`w-20 aspect-video rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 relative overflow-hidden ${isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-black' : 'bg-black/60 border border-white/10'}`}>
                                                    {lesson.thumbnailUrl ? (
                                                        <img src={lesson.thumbnailUrl} className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${isActive ? 'scale-110' : 'opacity-40 group-hover:opacity-100 group-hover:scale-105'}`} alt="" />
                                                    ) : (
                                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-white/10 text-xl">image</span>
                                                        </div>
                                                    )}
                                                    
                                                    <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                        <span className={`material-symbols-outlined ${isActive ? 'text-primary' : 'text-white'} text-2xl transition-transform duration-500 ${isActive ? 'scale-110' : 'scale-90 group-hover:scale-100'}`}>
                                                            {isActive ? 'pause_circle' : 'play_circle'}
                                                        </span>
                                                    </div>

                                                    {lessonProgress === 100 && (
                                                        <div className="absolute top-1 right-1 bg-primary text-black rounded-full p-0.5 z-20 shadow-lg">
                                                            <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className={`text-[13px] font-bold truncate leading-tight ${isActive ? 'text-primary' : 'text-white/70 group-hover:text-white'}`}>{lesson.title}</p>
                                                    <div className="flex items-center gap-2.5 mt-1.5 opacity-60">
                                                        <span className="text-[9px] font-label tracking-[2px] text-white uppercase">{lesson.duration || '00h 00m'}</span>
                                                        {lessonProgress > 0 && lessonProgress < 100 && (
                                                            <>
                                                                <span className="w-0.5 h-0.5 rounded-full bg-white/20"></span>
                                                                <span className="text-[9px] font-label text-primary font-bold">{lessonProgress}%</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    // Fallback: show all courses if no lessons defined
                                    courses.map((item, idx) => {
                                        const isCurrent = item.id === course.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => navigate(`/lesson/${item.id}`)}
                                                className={`w-full group text-left p-5 rounded-2xl border transition-all duration-500 flex items-center gap-5 ${isCurrent ? 'bg-primary/10 border-primary/40' : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.08]'}`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isCurrent ? 'bg-primary text-black' : 'bg-black/60 border border-white/10'}`}>
                                                    {isCurrent ? <span className="material-symbols-outlined text-[22px]">play_circle</span> : <span className="font-headline font-bold text-sm text-white/40">{idx + 1}</span>}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className={`text-sm font-bold truncate ${isCurrent ? 'text-primary' : 'text-white/70'}`}>{item.title}</p>
                                                    <div className="flex items-center gap-3 mt-1.5 opacity-60">
                                                        <span className="text-[10px] font-label text-white uppercase">{item.duration}</span>
                                                        <span className="text-[10px] text-primary font-bold">{item.progress}%</span>
                                                    </div>
                                                </div>
                                                {item.progress === 100 && <span className="material-symbols-outlined text-primary text-xl">check_circle</span>}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default VideoLesson;
