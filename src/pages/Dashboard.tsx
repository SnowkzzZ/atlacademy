import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { logoBase64 } from '../logoBase64';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import ForumSection from '../components/ForumSection';
import ModuleCard from '../components/ModuleCard';
import AnimatedStatCard from '../components/AnimatedStatCard';
import VideoCard from '../components/VideoCard';
import NewsletterPlaceholder from '../components/NewsletterPlaceholder';

const fmtTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
};

const useDragScroll = () => {
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let isDown = false;
        let startX: number;
        let scrollLeft: number;
        let hasMoved = false;

        const onMouseDown = (e: MouseEvent) => {
            isDown = true;
            startX = e.pageX - el.offsetLeft;
            scrollLeft = el.scrollLeft;
            hasMoved = false;
            el.style.cursor = 'grabbing';
            el.style.userSelect = 'none';
        };

        const onMouseLeave = () => {
            isDown = false;
            el.style.cursor = 'grab';
        };

        const onMouseUp = () => {
            isDown = false;
            el.style.cursor = 'grab';
            el.style.removeProperty('user-select');
            
            if (hasMoved) {
                const preventClick = (clickEvent: MouseEvent) => {
                    clickEvent.preventDefault();
                    clickEvent.stopPropagation();
                    el.removeEventListener('click', preventClick, true);
                };
                el.addEventListener('click', preventClick, true);
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - el.offsetLeft;
            const walk = (x - startX) * 1.5; // Scroll speed multiplier
            if (Math.abs(walk) > 5) {
                hasMoved = true;
            }
            el.scrollLeft = scrollLeft - walk;
        };

        el.style.cursor = 'grab';
        el.addEventListener('mousedown', onMouseDown);
        el.addEventListener('mouseleave', onMouseLeave);
        el.addEventListener('mouseup', onMouseUp);
        el.addEventListener('mousemove', onMouseMove);

        return () => {
            el.removeEventListener('mousedown', onMouseDown);
            el.removeEventListener('mouseleave', onMouseLeave);
            el.removeEventListener('mouseup', onMouseUp);
            el.removeEventListener('mousemove', onMouseMove);
        };
    }, []);

    return ref;
};

const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
        const offset = direction === 'left' ? -ref.current.clientWidth * 0.75 : ref.current.clientWidth * 0.75;
        ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
};

const Dashboard: React.FC = () => {
    const { courses, lessons, sectors, newsletters, isLoading } = useData();
    const { isAdmin } = useAuth();
    const [selectedArticle, setSelectedArticle] = useState<any>(null);
    const modulesRef = useDragScroll();
    const transmissionsRef = useDragScroll();
    const sectorsRef = useDragScroll();
    const newslettersRef = useDragScroll();

    // Sort lessons based on associated course's position, then lesson's position.
    const sortedLessons = [...lessons].sort((a, b) => {
        const courseA = courses.find(c => c.id === a.courseId);
        const courseB = courses.find(c => c.id === b.courseId);
        const coursePosA = courseA ? (courseA.position ?? 9999) : 9999;
        const coursePosB = courseB ? (courseB.position ?? 9999) : 9999;
        if (coursePosA !== coursePosB) return coursePosA - coursePosB;
        return a.position - b.position;
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-t-2 border-[#00F0FF] border-r-2 animate-spin"></div>
            </div>
        );
    }

    const totalCourses = courses.length;
    const completedCoursesCount = courses.filter(c => c.progress === 100).length;

    const totalWatchedSeconds = courses.reduce((acc, curr) => acc + (curr.watchedSeconds || 0), 0);
    const totalHoursWatched = Math.floor(totalWatchedSeconds / 3600);
    const totalMinutesWatched = Math.floor((totalWatchedSeconds % 3600) / 60);

    const lastWatchedLessonId = localStorage.getItem('atl_last_watched_lesson_id');
    let lastWatchedLesson = lastWatchedLessonId ? lessons.find(l => l.id === lastWatchedLessonId) : null;

    // Fallback: search for last watched lesson by lastWatchedAt timestamp from DB/context progress
    if (!lastWatchedLesson && lessons && lessons.length > 0) {
        const watchedLessons = lessons.filter(l => (l.lastWatchedAt || 0) > 0);
        if (watchedLessons.length > 0) {
            const sorted = [...watchedLessons].sort((a, b) => (b.lastWatchedAt || 0) - (a.lastWatchedAt || 0));
            lastWatchedLesson = sorted[0];
        }
    }
    const lastWatchedCourse = lastWatchedLesson ? courses.find(c => c.id === lastWatchedLesson.courseId) : null;

    const heroCourse = [...courses].sort((a, b) => (b.lastWatchedAt || 0) - (a.lastWatchedAt || 0))[0] || (courses.length > 0 ? courses[0] : null);
    const heroLesson = lessons ? [...lessons].sort((a, b) => (b.lastWatchedAt || 0) - (a.lastWatchedAt || 0))[0] : null;

    // Prioritize the last watched lesson's cover. If it has no thumbnail, fall back to its course's thumbnail.
    // If they have never watched any lesson, fall back to the general hero lesson/course thumbnails.
    const heroImage = lastWatchedLesson 
        ? (lastWatchedLesson.thumbnailUrl || lastWatchedCourse?.thumbnailUrl || lastWatchedCourse?.cardThumbnail || null)
        : (heroLesson?.thumbnailUrl || heroCourse?.thumbnailUrl || heroCourse?.cardThumbnail || null);
    
    // Sync back to localStorage if resolved from DB
    React.useEffect(() => {
        if (lastWatchedLesson && !localStorage.getItem('atl_last_watched_lesson_id')) {
            localStorage.setItem('atl_last_watched_lesson_id', lastWatchedLesson.id);
        }
    }, [lastWatchedLesson]);

    // Diagnostic
    if (heroCourse) console.log(`[Dashboard] Hero Course: ${heroCourse.title}`);
    if (heroLesson) console.log(`[Dashboard] Hero Lesson: ${heroLesson.title}`);
    if (lastWatchedLesson) console.log(`[Dashboard] Last Watched Lesson: ${lastWatchedLesson.title}`);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants: any = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    return (
        <div className="font-body text-white/90 selection:bg-primary selection:text-black min-h-screen relative bg-black overflow-x-hidden">
            {/* Base Background */}
            <div className="fixed inset-0 z-0 bg-black"></div>

            {/* Cinematic Header Background (Hero Image) */}
            <div className="absolute top-0 left-0 w-full h-[65vh] md:h-[80vh] z-0 overflow-hidden pointer-events-none">
                {heroImage ? (
                    <motion.img 
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 0.35, scale: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        src={heroImage} 
                        className="w-full h-full object-cover blur-[8px] saturate-150 mix-blend-screen" 
                        alt="" 
                    />
                ) : (
                    <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-3xl"></div>
                )}
                {/* Gradient overlays to guarantee readability and seamless edge blending */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80"></div>
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.02]"></div>
            </div>

            <Navbar />

            {/* Cinematic Logo Header */}
            <motion.main
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pb-8 md:pb-32 space-y-8 md:space-y-24"
            >
            <section className="pt-0 relative mt-20 md:mt-32 mb-10 md:mb-16">
                {lastWatchedLesson ? (
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 w-full max-w-5xl mx-auto pt-10 md:py-8 px-4">
                        {/* Left Info Column */}
                        <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 md:space-y-6 max-w-lg">
                            <motion.div variants={itemVariants} className="hero-badge w-fit cursor-default select-none">
                                <span className="material-symbols-outlined text-[13px] text-primary animate-pulse leading-none mr-1.5">workspace_premium</span>
                                <span className="font-label text-[9px] font-bold tracking-[0.25em] text-white/95 uppercase">
                                    ÁREA DO MEMBRO EXCLUSIVO
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-primary relative flex items-center justify-center ml-2 shrink-0">
                                    <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75"></span>
                                </span>
                            </motion.div>
                            <motion.h1
                                variants={itemVariants}
                                className="hero-title font-headline font-extrabold tracking-tight uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/70"
                                style={{ fontSize: 'clamp(2.5rem, 5vw, 4.8rem)', lineHeight: 1.02 }}
                            >
                                Bem-vindo à ATL
                            </motion.h1>
                            <motion.p 
                                variants={itemVariants}
                                className="text-white/40 font-body text-sm md:text-base max-w-md"
                            >
                                Continue seu desenvolvimento estratégico de elite. Acesse suas aulas salvas no banco de dados e progrida nos módulos ativos abaixo.
                            </motion.p>
                        </div>

                        {/* Right Resume Card Column */}
                        <motion.div 
                            variants={itemVariants}
                            className="w-full max-w-[420px] shrink-0"
                        >
                            <div className="relative group w-full">
                                {/* Ambient card glow */}
                                <div className="absolute -inset-1.5 bg-gradient-to-r from-primary/30 to-blue-500/10 rounded-[2.5rem] blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-1000"></div>
                                <div className="relative bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl rounded-[2.5rem] p-6 flex gap-5 shadow-2xl hover:border-white/[0.15] transition-all duration-500">
                                    {/* Thumbnail / Icon */}
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-neutral-900 shrink-0 relative border border-white/5">
                                        {lastWatchedLesson.thumbnailUrl ? (
                                            <img src={lastWatchedLesson.thumbnailUrl} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" alt="" />
                                        ) : (
                                            <div className="w-full h-full bg-[#0E0E10] flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white/20 text-3xl">play_circle</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/15"></div>
                                    </div>
                                    {/* Text Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div className="space-y-1">
                                            <span className="font-label text-primary text-[8px] tracking-[0.25em] uppercase font-bold flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                                ÚLTIMA AULA ASSISTIDA
                                            </span>
                                            <h4 className="font-headline text-sm md:text-base font-bold text-white uppercase tracking-tight truncate">
                                                {lastWatchedLesson.title}
                                            </h4>
                                            <p className="text-white/40 text-[9px] font-label uppercase tracking-widest truncate font-semibold">
                                                {lastWatchedCourse?.title || "MÓDULO"}
                                            </p>
                                        </div>
                                        <div className="mt-3">
                                            <div className="flex justify-between items-center text-[8px] text-white/30 font-label uppercase tracking-widest mb-1 font-bold">
                                                <span>Progresso</span>
                                                <span>Parou em {fmtTime(lastWatchedLesson.lastPosition || lastWatchedLesson.watchedSeconds || 0)}</span>
                                            </div>
                                            <div className="h-[3px] bg-white/5 rounded-full overflow-hidden mb-3">
                                                <div className="h-full bg-primary rounded-full" style={{ width: `${lastWatchedLesson.progress || 0}%` }}></div>
                                            </div>
                                            <Link 
                                                to={lastWatchedLesson.id ? `/lesson/${lastWatchedLesson.id}` : '#'}
                                                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00F0FF] to-[#00BFFF] hover:from-[#00D6E6] hover:to-[#00A3D9] text-black font-headline font-bold text-[9px] tracking-[2px] px-5 py-3 rounded-full uppercase transition-all shadow-[0_0_20px_rgba(0,240,255,0.25)] hover:shadow-[0_0_30px_rgba(0,240,255,0.45)] hover:scale-[1.03] active:scale-95"
                                            >
                                                Retomar Aula <span className="material-symbols-outlined text-[11px] font-bold">play_arrow</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <div className="relative z-10 flex flex-col items-center text-center space-y-4 w-full max-w-5xl pt-16 pb-0 md:py-8 mx-auto px-4">
                        <motion.div variants={itemVariants} className="relative mt-2 mb-4 flex flex-col items-center">
                            <div className="absolute inset-0 bg-primary opacity-20 blur-3xl rounded-full scale-125"></div>
                            <img src={logoBase64} alt="ATL Logo" className="drop-shadow-[0_0_60px_rgba(255,255,255,0.4)] relative z-10 w-auto h-[120px] md:h-[180px]" />
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-4 md:space-y-6 relative z-20">
                            <div className="hero-badge w-fit mx-auto cursor-default select-none">
                                <span className="material-symbols-outlined text-[13px] text-primary animate-pulse leading-none mr-1.5">workspace_premium</span>
                                <span className="font-label text-[9px] font-bold tracking-[0.25em] text-white/95 uppercase">
                                    ÁREA DO MEMBRO EXCLUSIVO
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-primary relative flex items-center justify-center ml-2 shrink-0">
                                    <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75"></span>
                                </span>
                            </div>

                            <h1
                                className="hero-title font-headline font-extrabold tracking-widest uppercase drop-shadow-[0_0_35px_rgba(0,240,255,0.2)] w-full text-center text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/30"
                                style={{ fontSize: 'clamp(2.25rem, 6.5vw, 6.5rem)', lineHeight: 0.95, letterSpacing: '0.12em', padding: '0 1rem' }}
                            >
                                ATL ACADEMY
                            </h1>
                            <p className="text-white/40 font-body text-[9px] md:text-sm tracking-[0.3em] uppercase max-w-xl mx-auto font-medium">
                                Plataforma de Desenvolvimento e Inteligência de Elite
                            </p>
                        </motion.div>
                    </div>
                )}
            </section>

                {/* PREMIUM "MÓDULOS" HORIZONTAL CAROUSEL (ADAPTA STYLE) */}
                <motion.section variants={itemVariants} className="space-y-8 md:space-y-12">
                    <div className="flex justify-between items-end px-2">
                        <div className="space-y-1 md:space-y-2">
                            <span className="font-label text-primary text-[8px] md:text-[10px] tracking-[0.4em] uppercase">Atl Academy Exclusive</span>
                            <h2 className="font-headline text-3xl md:text-5xl font-bold tracking-tight">Módulos</h2>
                        </div>
                        <Link className="premium-pill" to="/explore">Ver todos os cursos <span className="ml-1 text-[10px]">↗</span></Link>
                    </div>

                    <div className="module-carousel-container relative group/carousel">
                        {/* Left Arrow */}
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollContainer(modulesRef, 'left'); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-[#00F0FF] border border-white/10 hover:border-[#00F0FF] text-white hover:text-black flex items-center justify-center backdrop-blur-md shadow-2xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 pointer-events-auto active:scale-95 cursor-pointer"
                            title="Scroll Left"
                        >
                            <span className="material-symbols-outlined text-2xl">chevron_left</span>
                        </button>
                        
                        {/* Right Arrow */}
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollContainer(modulesRef, 'right'); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-[#00F0FF] border border-white/10 hover:border-[#00F0FF] text-white hover:text-black flex items-center justify-center backdrop-blur-md shadow-2xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 pointer-events-auto active:scale-95 cursor-pointer"
                            title="Scroll Right"
                        >
                            <span className="material-symbols-outlined text-2xl">chevron_right</span>
                        </button>

                        <div
                            ref={modulesRef}
                            className="flex gap-4 md:gap-8 overflow-x-auto pb-12 px-4 md:px-6 no-scrollbar snap-x snap-mandatory"
                            style={{
                                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 88%, transparent 100%)',
                                maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 88%, transparent 100%)'
                            }}
                        >
                            {courses.map((course, idx) => (
                                <ModuleCard key={course.id} course={course} index={idx} />
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* QUICK ACTIONS SECTION */}
                <motion.section variants={itemVariants} className="space-y-8 md:space-y-12">
                    <div className="space-y-1 md:space-y-2 px-2">
                        <span className="font-label text-primary text-[8px] md:text-[10px] tracking-[0.4em] uppercase font-bold">Navegação Rápida</span>
                        <h2 className="font-headline text-2xl md:text-4xl font-bold tracking-tight">Atalhos de Elite</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        <Link 
                            to="/explore" 
                            className="group relative bg-white/[0.01] border border-white/[0.06] rounded-[2rem] p-6 hover:bg-white/[0.03] hover:border-white/[0.12] transition-all duration-500 flex flex-col gap-4 shadow-lg overflow-hidden animate-in fade-in"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500 animate-in fade-in">
                                <span className="material-symbols-outlined text-white/50 group-hover:text-primary text-xl font-light">explore</span>
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="font-headline text-base font-bold text-white uppercase tracking-wide group-hover:text-primary transition-colors">Explorar Trilhas</h3>
                                <p className="text-white/40 text-xs font-body leading-relaxed">
                                    Pesquise a base de inteligência de módulos ativos e descubra novos cursos.
                                </p>
                            </div>
                        </Link>

                        <Link 
                            to="/intel" 
                            className="group relative bg-white/[0.01] border border-white/[0.06] rounded-[2rem] p-6 hover:bg-white/[0.03] hover:border-white/[0.12] transition-all duration-500 flex flex-col gap-4 shadow-lg overflow-hidden animate-in fade-in"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center group-hover:bg-blue-400/10 group-hover:border-blue-400/20 transition-all duration-500">
                                <span className="material-symbols-outlined text-white/50 group-hover:text-blue-400 text-xl font-light">hub</span>
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="font-headline text-base font-bold text-white uppercase tracking-wide group-hover:text-blue-400 transition-colors">Insights & Tutoriais</h3>
                                <p className="text-white/40 text-xs font-body leading-relaxed">
                                    Acesse artigos estratégicos e conhecimento exclusivo criado pelos instrutores.
                                </p>
                            </div>
                        </Link>

                        <Link 
                            to={isAdmin ? "/painel" : "/profile"} 
                            className="group relative bg-white/[0.01] border border-white/[0.06] rounded-[2rem] p-6 hover:bg-white/[0.03] hover:border-white/[0.12] transition-all duration-500 flex flex-col gap-4 shadow-lg overflow-hidden animate-in fade-in"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center group-hover:bg-purple-400/10 group-hover:border-purple-400/20 transition-all duration-500">
                                <span className="material-symbols-outlined text-white/50 group-hover:text-purple-400 text-xl font-light">
                                    {isAdmin ? "admin_panel_settings" : "person"}
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="font-headline text-base font-bold text-white uppercase tracking-wide group-hover:text-purple-400 transition-colors">
                                    {isAdmin ? "Central de Comando" : "Meu Perfil"}
                                </h3>
                                <p className="text-white/40 text-xs font-body leading-relaxed">
                                    {isAdmin 
                                        ? "Gerencie módulos, aulas, setores e publique artigos de inteligência." 
                                        : "Visualize seu progresso individual, métricas gerais e configurações."}
                                </p>
                            </div>
                        </Link>
                    </div>
                </motion.section>

                {/* Premium Stats - Responsive Liquid Glass Grid */}
                <motion.section variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 pt-0 md:pt-0">
                    {[
                        { label: 'MÓDULOS', value: totalCourses, icon: 'layers' },
                        { label: 'CONCLUÍDAS', value: completedCoursesCount, icon: 'verified' },
                        { label: 'APRENDIZADO', value: `${totalHoursWatched}h ${totalMinutesWatched}m`, icon: 'schedule' },
                        { label: 'TRILHAS', value: sectors.length, icon: 'bolt' }
                    ].map((stat) => (
                        <AnimatedStatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
                    ))}
                </motion.section>

                {/* Liquid Glass Cards - Active Courses */}
                <motion.section variants={itemVariants} className="space-y-16">
                    <div className="flex justify-between items-end px-2">
                        <div className="space-y-2">
                            <span className="font-label text-primary text-[10px] tracking-[0.4em] uppercase">Módulos em Destaque</span>
                            <h2 className="font-headline text-4xl md:text-6xl font-bold tracking-tight">Transmissões Ativas</h2>
                        </div>
                        <Link className="premium-pill" to="/explore">Explorar Tudo</Link>
                    </div>

                    <div className="module-carousel-container relative group/carousel">
                        {/* Left Arrow */}
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollContainer(transmissionsRef, 'left'); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-[#00F0FF] border border-white/10 hover:border-[#00F0FF] text-white hover:text-black flex items-center justify-center backdrop-blur-md shadow-2xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 pointer-events-auto active:scale-95 cursor-pointer"
                            title="Scroll Left"
                        >
                            <span className="material-symbols-outlined text-2xl">chevron_left</span>
                        </button>
                        
                        {/* Right Arrow */}
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollContainer(transmissionsRef, 'right'); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-[#00F0FF] border border-white/10 hover:border-[#00F0FF] text-white hover:text-black flex items-center justify-center backdrop-blur-md shadow-2xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 pointer-events-auto active:scale-95 cursor-pointer"
                            title="Scroll Right"
                        >
                            <span className="material-symbols-outlined text-2xl">chevron_right</span>
                        </button>

                        <div
                            ref={transmissionsRef}
                            className="flex gap-4 md:gap-8 overflow-x-auto pb-12 px-4 md:px-6 no-scrollbar snap-x snap-mandatory"
                            style={{
                                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 88%, transparent 100%)',
                                maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 88%, transparent 100%)'
                            }}
                        >
                            {sortedLessons.map((lesson, idx) => {
                                const course = courses.find(c => c.id === lesson.courseId);
                                const courseTitle = course?.title || 'Módulo';
                                const instructor = course?.instructor || 'ATL Academy';
                                return (
                                    <VideoCard 
                                        key={lesson.id} 
                                        lesson={lesson} 
                                        courseTitle={courseTitle} 
                                        instructor={instructor} 
                                        index={idx} 
                                    />
                                );
                            })}
                        </div>
                    </div>
                </motion.section>

                {/* Sectors — Liquid Glass Cards */}
                <motion.section variants={itemVariants} className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-0.5 h-5 rounded-full bg-gradient-to-b from-primary to-purple-500" />
                        <div>
                            <span className="font-label text-primary text-[10px] tracking-[0.4em] uppercase block">Especializações</span>
                            <h2 className="font-headline text-2xl md:text-4xl font-bold tracking-tight text-white">Setores de Inteligência</h2>
                        </div>
                    </div>

                    {/* Carousel horizontal */}
                    <div className="relative group/carousel" style={{ overflow: 'visible' }}>
                        {/* Left Arrow */}
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollContainer(sectorsRef, 'left'); }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-[#00F0FF] border border-white/10 hover:border-[#00F0FF] text-white hover:text-black flex items-center justify-center backdrop-blur-md shadow-2xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 active:scale-95 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-2xl">chevron_left</span>
                        </button>
                        {/* Right Arrow */}
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollContainer(sectorsRef, 'right'); }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-[#00F0FF] border border-white/10 hover:border-[#00F0FF] text-white hover:text-black flex items-center justify-center backdrop-blur-md shadow-2xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 active:scale-95 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-2xl">chevron_right</span>
                        </button>

                    <div
                        ref={sectorsRef}
                        className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory"
                        style={{
                            paddingTop: 12,
                            paddingBottom: 16,
                            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 92%, transparent 100%)',
                            maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 92%, transparent 100%)',
                            cursor: 'grab',
                            overflowY: 'visible',
                        }}
                    >
                        {sectors.map((sector, i) => {
                            const PALETTES_D = [
                                { from:'#00F0FF', to:'#0099cc', glow:'0,240,255',   text:'#00F0FF' },
                                { from:'#a78bfa', to:'#7c3aed', glow:'167,139,250', text:'#c4b5fd' },
                                { from:'#34d399', to:'#059669', glow:'52,211,153',  text:'#6ee7b7' },
                                { from:'#fb923c', to:'#ea580c', glow:'251,146,60',  text:'#fdba74' },
                                { from:'#f472b6', to:'#db2777', glow:'244,114,182', text:'#f9a8d4' },
                                { from:'#facc15', to:'#ca8a04', glow:'250,204,21',  text:'#fde68a' },
                            ];
                            const MLM_ICONS_D = ['diversity_3','person_search','badge','sell','hub','psychology','school','savings','event','verified'];
                            const IA_ICONS_D  = ['manage_search','auto_awesome','smart_toy','auto_stories','analytics','build','code','trending_up','model_training','policy'];
                            const icon = i < 10 ? (MLM_ICONS_D[i] ?? 'star') : (IA_ICONS_D[i-10] ?? 'star');
                            const p = PALETTES_D[i % PALETTES_D.length];
                            const badge = i < 10 ? 'MLM' : 'IA';
                            return (
                                <motion.div key={sector.id} className="shrink-0 snap-start" style={{ width: 220 }} whileHover={{ y:-4, scale:1.02 }} whileTap={{ scale:0.97 }}>
                                    <Link
                                        to={`/explore?sector=${sector.id}`}
                                        style={{
                                            display:'block',
                                            background:'linear-gradient(135deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.015) 100%)',
                                            backdropFilter:'blur(24px) saturate(180%)',
                                            WebkitBackdropFilter:'blur(24px) saturate(180%)',
                                            border:'1px solid rgba(255,255,255,0.07)',
                                            borderRadius:22,
                                            padding:'22px 20px 20px',
                                            position:'relative',
                                            overflow:'hidden',
                                            boxShadow:'0 4px 20px rgba(0,0,0,0.25)',
                                            transition:'border 0.3s, box-shadow 0.3s',
                                            textDecoration:'none',
                                            height: '100%',
                                        }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLElement).style.border = `1px solid rgba(${p.glow},0.4)`;
                                            (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 32px rgba(${p.glow},0.18)`;
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.07)';
                                            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)';
                                        }}
                                    >
                                        {/* Glow orb */}
                                        <div style={{
                                            position:'absolute', top:-24, right:-24, width:90, height:90, borderRadius:'50%',
                                            background:`radial-gradient(circle, rgba(${p.glow},0.14) 0%, transparent 70%)`,
                                            pointerEvents:'none',
                                        }} />
                                        {/* Icon + badge */}
                                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                                            <div style={{
                                                width:44, height:44, borderRadius:13, flexShrink:0,
                                                background:`linear-gradient(135deg, ${p.from}, ${p.to})`,
                                                display:'flex', alignItems:'center', justifyContent:'center',
                                                boxShadow:`0 4px 14px rgba(${p.glow},0.45)`,
                                            }}>
                                                <span className="material-symbols-outlined" style={{ fontSize:22, color:'#fff', fontVariationSettings:"'FILL' 1, 'wght' 500" }}>
                                                    {icon}
                                                </span>
                                            </div>
                                            <span style={{
                                                color:p.text, background:`rgba(${p.glow},0.08)`,
                                                border:`1px solid rgba(${p.glow},0.2)`,
                                                fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em',
                                                borderRadius:20, padding:'3px 8px',
                                            }}>{badge}</span>
                                        </div>
                                        {/* Name */}
                                        <h3 style={{ color:'#fff', fontFamily:'var(--font-headline)', fontSize:13, fontWeight:700, letterSpacing:'-0.01em', lineHeight:1.35, marginBottom:8 }}>
                                            {sector.name}
                                        </h3>
                                        {/* Description */}
                                        {(sector as any).description && (
                                            <p style={{ color:'rgba(255,255,255,0.38)', fontSize:10, lineHeight:1.55 }}>
                                                {((sector as any).description as string).length > 80
                                                    ? ((sector as any).description as string).slice(0,80)+'...'
                                                    : (sector as any).description}
                                            </p>
                                        )}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                    </div>{/* end carousel wrapper */}
                </motion.section>

                {/* Newsletters Section */}
                <motion.section variants={itemVariants} className="space-y-8 pb-0">
                    <div className="flex justify-between items-end px-2">
                        <div className="space-y-2">
                            <span className="font-label text-primary text-[10px] tracking-[0.4em] uppercase">Atl Academy Intelligence</span>
                            <h2 className="font-headline text-4xl md:text-6xl font-bold tracking-tight">Newsletters</h2>
                        </div>
                        <Link className="premium-pill" to="/explore?tab=newsletters">Ver tudo <span className="ml-1 text-[10px]">↗</span></Link>
                    </div>

                    <div className="module-carousel-container relative group/carousel">
                        {/* Left Arrow */}
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollContainer(newslettersRef, 'left'); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-[#00F0FF] border border-white/10 hover:border-[#00F0FF] text-white hover:text-black flex items-center justify-center backdrop-blur-md shadow-2xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 pointer-events-auto active:scale-95 cursor-pointer"
                            title="Scroll Left"
                        >
                            <span className="material-symbols-outlined text-2xl">chevron_left</span>
                        </button>
                        
                        {/* Right Arrow */}
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollContainer(newslettersRef, 'right'); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-[#00F0FF] border border-white/10 hover:border-[#00F0FF] text-white hover:text-black flex items-center justify-center backdrop-blur-md shadow-2xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 pointer-events-auto active:scale-95 cursor-pointer"
                            title="Scroll Right"
                        >
                            <span className="material-symbols-outlined text-2xl">chevron_right</span>
                        </button>

                        <div
                            ref={newslettersRef}
                            className="flex gap-4 md:gap-8 overflow-x-auto pb-4 px-4 md:px-6 no-scrollbar snap-x snap-mandatory"
                            style={{
                                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 88%, transparent 100%)',
                                maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 88%, transparent 100%)'
                            }}
                        >
                            {/* Newsletter Cards */}
                            {newsletters.map((article) => (
                                <div
                                    key={article.id}
                                    onClick={() => setSelectedArticle(article)}
                                    className="shrink-0 w-[320px] md:w-[400px] rounded-[2rem] overflow-hidden border border-white/10 hover:scale-[1.02] transition-all duration-500 cursor-pointer select-none group relative aspect-[3/2]"
                                >
                                    {/* Image fills entire card */}
                                    <div className="absolute inset-0">
                                        {article.thumbnailUrl ? (
                                            <img
                                                src={article.thumbnailUrl}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                alt={article.title}
                                            />
                                        ) : (
                                            <NewsletterPlaceholder />
                                        )}
                                    </div>
                                    {/* Text overlay at bottom */}
                                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end text-center px-5 pb-5 pt-12"
                                        style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.6) 55%, transparent 100%)' }}>
                                        <span className="font-label text-[9px] text-black/50 uppercase tracking-[0.2em] font-bold block mb-1">
                                            {(article as any).category || 'Newsletter'}
                                        </span>
                                        <h4 className="font-headline text-sm font-extrabold text-black leading-snug line-clamp-2 uppercase">
                                            {article.title}
                                        </h4>
                                        {(article as any).readTime && (
                                            <span className="mt-1.5 font-label text-[8px] text-black/40 uppercase tracking-wider">
                                                {(article as any).readTime} min leitura
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

            </motion.main>

            {/* NEW FORUM SECTION */}
            <ForumSection />

            {/* Newsletter Detail Modal */}
            {selectedArticle && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-3xl max-h-[85vh] bg-neutral-950 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
                        {/* Decorative glowing gradient inside header */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                        
                        {/* Header */}
                        <div className="p-6 md:p-10 border-b border-white/5 flex items-start justify-between bg-white/[0.01]">
                            <div className="space-y-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/20 font-label text-[8px] tracking-[0.2em] uppercase text-primary font-bold">
                                    {sectors.find(s => s.id === selectedArticle.sectorId)?.name || 'Geral'}
                                </span>
                                <h2 className="font-headline text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight leading-snug">
                                    {selectedArticle.title}
                                </h2>
                                <div className="flex items-center gap-3 text-white/40 font-label text-[9px] uppercase tracking-wider font-semibold">
                                    <span>Por {selectedArticle.author}</span>
                                    <span>•</span>
                                    <span>{new Date(selectedArticle.createdAt || Date.now()).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-all shrink-0 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar-premium space-y-6">
                            <div className="text-white/70 font-body text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                                {selectedArticle.content}
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end">
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="px-6 py-3 bg-white text-black hover:bg-neutral-200 font-headline font-bold text-[10px] tracking-[2px] rounded-xl uppercase transition-all active:scale-95"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="mt-10 md:mt-40 border-t border-white/[0.05] relative z-10 bg-black/40 backdrop-blur-3xl">
                <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-8 md:py-24 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
                    <div className="flex items-center gap-8">
                        <img src={logoBase64} alt="ATL" className="h-12 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700" />
                        <div className="h-6 w-px bg-white/10"></div>
                        <div className="font-label text-[10px] tracking-[0.5em] text-white/20 uppercase">Terminal V2.8 Premium</div>
                    </div>
                    <p className="text-white/10 font-label text-[11px] tracking-[0.5em] uppercase text-center md:text-right">
                        © 2024 ATL ACADEMY <br className="md:hidden" />
                        <span className="hidden md:inline"> // </span> EXCLUSIVO PARA MEMBROS ELITE
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Dashboard;
