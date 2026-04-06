import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useData } from '../context/DataContext';

const VideoLesson: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { courses, updateCourse } = useData();
    const videoRef = React.useRef<HTMLVideoElement>(null);

    // Find course or fallback to first one if ID is missing or invalid
    const course = courses.find(c => c.id === id) || courses[0];

    // Effect to update last watched at and initialize total duration if needed
    React.useEffect(() => {
        if (course) {
            updateCourse(course.id, { lastWatchedAt: Date.now() });
        }
    }, [course?.id]);

    const handleTimeUpdate = () => {
        if (!videoRef.current || !course) return;

        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;

        if (isNaN(duration)) return;

        // Only save if significant change or hit end (throttling)
        if (Math.abs(currentTime - (course.watchedSeconds || 0)) > 2 || currentTime === duration) {
            const progress = Math.min(Math.round((currentTime / duration) * 100), 100);
            updateCourse(course.id, {
                watchedSeconds: currentTime,
                progress: progress,
                totalSeconds: duration
            });
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current && course) {
            const duration = videoRef.current.duration;
            if (isNaN(duration)) return;

            // Restore last position
            if (course.watchedSeconds) {
                videoRef.current.currentTime = course.watchedSeconds;
            }

            // Update duration string if missing
            if (!course.totalSeconds || course.duration === "0h 00m") {
                const h = Math.floor(duration / 3600);
                const m = Math.floor((duration % 3600) / 60);
                const durationStr = `${h}h ${m}m`;
                updateCourse(course.id, { totalSeconds: duration, duration: durationStr });
            }
        }
    };

    if (!course) return null;

    const handleLessonClick = (courseId: string) => {
        navigate(`/lesson/${courseId}`);
    };

    return (
        <div className="bg-[#030303] min-h-screen text-white font-body selection:bg-primary selection:text-black relative">
            <div className="fixed inset-0 z-0">
                <div className="absolute top-1/2 left-1/4 w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.02]"></div>
            </div>

            <Navbar isFixed={false} />

            <main className="relative z-10 max-w-[1600px] mx-auto px-4 md:px-10 py-6 md:py-10">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Main Content Area: Video and Course Info */}
                    <div className="flex-1 space-y-6 md:space-y-10">
        {/* Video Player Section with cinematic backdrop */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            <div className="relative aspect-video bg-black rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                                {course.videoUrl ? (() => {
                                    // Detect YouTube URL and convert to embed
                                    const ytMatch = course.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
                                    if (ytMatch) {
                                        const videoId = ytMatch[1];
                                        return (
                                            <iframe
                                                key={course.videoUrl}
                                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                title={course.title}
                                            />
                                        );
                                    }
                                    // Regular video file
                                    return (
                                        <video
                                            key={course.videoUrl}
                                            ref={videoRef}
                                            src={course.videoUrl}
                                            className="w-full h-full object-contain"
                                            controls
                                            autoPlay
                                            onTimeUpdate={handleTimeUpdate}
                                            onLoadedMetadata={handleLoadedMetadata}
                                        />
                                    );
                                })() : (
                                    <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                                        <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02] shadow-inner">
                                            <span className="material-symbols-outlined text-white/20 text-4xl">play_circle</span>
                                        </div>
                                        <p className="text-white/20 font-label text-xs tracking-[6px] uppercase">Sinal de Vídeo Offline</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Title and Description Section */}
                        <div className="space-y-6 md:space-y-10 px-2 md:px-0">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="premium-pill py-1 px-4 text-[8px] bg-primary/10 border-primary/20 text-primary">AULA ATUAL</span>
                                        <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${course.progress}%` }}></div>
                                        </div>
                                        <span className="text-white/40 font-bold text-[10px] uppercase tracking-widest">{course.progress}%</span>
                                    </div>
                                    <h1 className="font-headline text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight uppercase leading-[1.1]">
                                        {course.title || 'Selecione uma aula'}
                                    </h1>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="flex-1 md:flex-none liquid-glass-soft border border-white/10 px-8 py-4 rounded-xl font-label text-[10px] tracking-widest uppercase hover:bg-white/10 transition-all font-bold">Arquivos</button>
                                    <button className="flex-1 md:flex-none bg-white text-black px-10 py-4 rounded-xl font-headline font-bold text-[10px] tracking-[2px] uppercase hover:bg-primary transition-all shadow-xl hover:scale-105 transform">Concluir</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="md:col-span-2 space-y-6">
                                    <h3 className="font-headline text-xl md:text-2xl font-bold uppercase tracking-tight">Conteúdo da Sessão</h3>
                                    <p className="text-white/60 text-base md:text-lg leading-relaxed font-light">
                                        Exploração profunda dos protocolos de {course.title.toLowerCase()}. Nesta masterclass técnica, focamos na implementação prática e resultados de alta performance para o ecossistema ATL.
                                    </p>
                                    <div className="flex flex-wrap gap-4 pt-4">
                                        <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-[10px] font-label text-white/40 uppercase tracking-widest">4K Ultra HD</div>
                                        <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-[10px] font-label text-white/40 uppercase tracking-widest">Dolby Atmos</div>
                                        <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-[10px] font-label text-white/40 uppercase tracking-widest">Subtitles EN/PT</div>
                                    </div>
                                </div>

                                <div className="liquid-glass-soft p-8 space-y-6">
                                    <h3 className="font-label text-xs tracking-[4px] uppercase text-white/40">INSTRUTOR LÍDER</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 flex items-center justify-center shadow-lg">
                                            <span className="material-symbols-outlined text-primary text-3xl">shield_person</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-white">{course.instructor}</p>
                                            <p className="text-[10px] text-primary font-label uppercase tracking-[3px] mt-1">Specialist</p>
                                        </div>
                                    </div>
                                    <button className="w-full py-3 rounded-lg border border-white/5 bg-white/[0.03] text-[9px] font-label uppercase tracking-widest hover:bg-white hover:text-black transition-all">Ver Perfil</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Schedule */}
                    <div className="w-full lg:w-[450px] shrink-0">
                        <div className="liquid-glass-card p-6 md:p-10 flex flex-col lg:max-h-[85vh] sticky top-10 md:top-32">
                            <div className="flex items-center justify-between mb-10">
                                <div className="space-y-1">
                                    <h2 className="font-headline text-2xl font-bold tracking-tight uppercase leading-none">Cronograma</h2>
                                    <p className="text-[10px] font-label text-white/30 uppercase tracking-[4px]">Sincronizado</p>
                                </div>
                                <div className="bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{courses.length} Sessões</span>
                                </div>
                            </div>

                            <div className="space-y-3 overflow-y-auto pr-3 custom-scrollbar flex-1 -mx-2 px-2">
                                {courses.map((item, idx) => {
                                    const isCurrent = item.id === course.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleLessonClick(item.id)}
                                            className={`w-full group text-left p-5 rounded-2xl border transition-all duration-500 flex items-center gap-5 ${isCurrent ? 'bg-primary/10 border-primary/40 shadow-[0_20px_40px_rgba(0,255,135,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.08]'}`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${isCurrent ? 'bg-primary text-black shadow-[0_0_20px_rgba(0,255,135,0.5)] rotate-0' : 'bg-black/60 border border-white/10 rotate-3 group-hover:rotate-0'}`}>
                                                {isCurrent ? (
                                                    <span className="material-symbols-outlined text-[24px]">play_circle</span>
                                                ) : (
                                                    <span className="font-headline font-bold text-sm text-white/40">{idx + 1}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className={`text-sm font-bold truncate transition-colors duration-300 ${isCurrent ? 'text-primary' : 'text-white/70 group-hover:text-white'}`}>{item.title}</p>
                                                <div className="flex items-center gap-4 mt-1.5 opacity-60">
                                                    <span className="text-[10px] font-label tracking-[2px] text-white uppercase">{item.duration}</span>
                                                    <div className="w-1 h-1 rounded-full bg-white/20"></div>
                                                    <span className="text-[10px] font-label tracking-[2px] text-primary font-bold uppercase">{item.progress}%</span>
                                                </div>
                                            </div>
                                            {item.progress === 100 && (
                                                <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default VideoLesson;
