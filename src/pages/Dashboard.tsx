import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { logoBase64 } from '../logoBase64';
import { useData } from '../context/DataContext';
import ForumSection from '../components/ForumSection';
import ModuleCard from '../components/ModuleCard';

const Dashboard: React.FC = () => {
    const { courses, sectors } = useData();

    const totalCourses = courses.length;
    const completedCoursesCount = courses.filter(c => c.progress === 100).length;

    const totalWatchedSeconds = courses.reduce((acc, curr) => acc + (curr.watchedSeconds || 0), 0);
    const totalHoursWatched = Math.floor(totalWatchedSeconds / 3600);
    const totalMinutesWatched = Math.floor((totalWatchedSeconds % 3600) / 60);

    const heroCourse = [...courses].sort((a, b) => (b.lastWatchedAt || 0) - (a.lastWatchedAt || 0))[0] || (courses.length > 0 ? courses[0] : null);
    
    // Find the actual lesson to link to (either the last watched one or the first one)
    const heroLessonId = heroCourse?.lastLessonId;
    const heroLink = heroCourse ? (heroLessonId ? `/lesson/${heroLessonId}` : `/lesson/${heroCourse.id}`) : "/explore";

    const heroProgress = heroCourse ? heroCourse.progress : 0;
    const isHeroStarted = heroCourse && (heroCourse.watchedSeconds || 0) > 0;
    
    // Diagnostic
    if (heroCourse) console.log(`[Dashboard] Hero: ${heroCourse.title}, Progress: ${heroCourse.progress}%, Watched: ${heroCourse.watchedSeconds}s`);

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
        <div className="font-body text-white/90 selection:bg-primary selection:text-black min-h-screen relative bg-surface-container-lowest overflow-x-hidden">
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-surface-container-lowest"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-3xl"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-3xl"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.02]"></div>
            </div>

            <Navbar />

            {/* FULL BLEED BACKGROUND HERO */}
            <div className="absolute top-0 left-0 right-0 w-full h-[60vh] md:h-[80vh] z-0 overflow-hidden pointer-events-none">
                <div 
                    className="w-full h-full" 
                    style={{ maskImage: 'linear-gradient(to top, transparent 0%, transparent 5%, black 40%, black 100%)', WebkitMaskImage: 'linear-gradient(to top, transparent 0%, transparent 5%, black 40%, black 100%)' }}
                >
                    {heroCourse?.thumbnailUrl ? (
                        <img src={heroCourse.thumbnailUrl} className="w-full h-full object-cover opacity-60 brightness-[0.5] grayscale contrast-125 mix-blend-luminosity object-top" alt="" />
                    ) : (
                        <div className="absolute inset-0 bg-primary opacity-5 blur-3xl rounded-full scale-125"></div>
                    )}
                </div>
                <div className="hero-overlay"></div>
            </div>

            <motion.main
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pb-8 md:pb-32 space-y-8 md:space-y-24"
            >
                {/* Cinematic Liquid Glass Hero */}
                <section className="pt-0 relative flex flex-col items-center justify-start min-h-[auto] md:min-h-[50vh] mt-20 md:mt-48">
                    <div className="relative z-10 flex flex-col items-center text-center space-y-4 w-full max-w-5xl pt-16 pb-0 md:py-16">
                        <motion.div variants={itemVariants} className="relative mt-2 mb-4 flex flex-col items-center">
                            <div className="absolute inset-0 bg-primary opacity-20 blur-3xl rounded-full scale-125"></div>
                            <img src={logoBase64} alt="ATL Logo" className="drop-shadow-[0_0_60px_rgba(255,255,255,0.4)] relative z-10 w-auto h-[120px] md:h-[180px]" />
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-4 md:space-y-6 relative z-20">
                            <div className="hero-badge font-label text-[10px] tracking-[0.2em]">
                                <span className="pulse-dot mr-2 mt-1"></span>
                                ÁREA DO MEMBRO EXCLUSIVO
                            </div>

                            <h1
                                className="hero-title font-headline font-bold tracking-tight uppercase drop-shadow-2xl w-full text-center"
                                style={{ fontSize: 'clamp(1.75rem, 5vw, 6rem)', lineHeight: 1.05, wordBreak: 'break-word', padding: '0 1rem' }}
                            >
                                {heroCourse ? heroCourse.title.split(':')[0] : 'Bem-vindo à ATL'}
                                {heroCourse && heroCourse.title.includes(':') && (
                                    <><br /><span className="text-white/20 font-light" style={{ fontSize: '0.6em' }}>{heroCourse.title.split(':')[1]}</span></>
                                )}
                            </h1>
                        </motion.div>

                        <div className="h-0 md:h-12"></div>

                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -5, scale: 1.01 }}
                            className="card-progresso w-[calc(100%-2rem)] md:w-full max-w-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 mx-4 mt-4 md:mt-16"
                        >
                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <div className="avatar-instrutor w-12 h-12 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-white/70 text-[22px]">person</span>
                                </div>
                                <div className="text-left overflow-hidden">
                                    <p className="text-white font-bold text-sm md:text-base truncate">{heroCourse ? heroCourse.instructor : 'Equipe ATL'}</p>
                                    <p className="text-white/40 font-label text-[10px] tracking-[0.2em] uppercase">Instrutor Destaque</p>
                                </div>
                            </div>

                            <div className="flex-1 w-full md:max-w-xs">
                                <div className="flex justify-between font-label text-[10px] tracking-[0.3em] text-white/40 mb-3">
                                    <span>PROGRESSO ATIVO</span>
                                    <span className="text-primary font-bold">{heroProgress}%</span>
                                </div>
                                <div className="progress-bar-bg w-full shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${heroProgress}%` }}
                                        transition={{ duration: 1.2, delay: 1 }}
                                        className="progress-bar-fill"
                                    >
                                    </motion.div>
                                </div>
                            </div>

                            <Link to={heroLink} className="btn-neon w-full md:w-auto px-10 py-4 font-headline text-[11px] tracking-[0.2em] uppercase text-center flex items-center justify-center">
                                {isHeroStarted ? 'Continuar Aula' : 'Iniciar Aula'}
                            </Link>
                        </motion.div>
                    </div>
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

                    <div className="module-carousel-container">
                        <div className="flex gap-4 md:gap-8 overflow-x-auto pb-12 px-6 no-scrollbar snap-x snap-mandatory">
                            {courses.map((course, idx) => (
                                <ModuleCard key={course.id} course={course} index={idx} />
                            ))}
                        </div>
                        
                        {/* Shadow/Dark edge overlays for the scroll effect */}
                        <div className="absolute top-0 left-0 bottom-0 w-20 bg-gradient-to-r from-surface-container-lowest to-transparent pointer-events-none z-30"></div>
                        <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-surface-container-lowest to-transparent pointer-events-none z-30"></div>
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
                        <motion.div
                            key={stat.label}
                            whileHover={{ y: -6, scale: 1.02 }}
                            className="liquid-glass p-5 md:p-12 flex flex-col justify-between group relative rounded-2xl md:aspect-square"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {/* Icon */}
                            <div className="w-9 h-9 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4 md:mb-16 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                                <span className="material-symbols-outlined text-white/40 group-hover:text-primary transition-colors text-base md:text-3xl">{stat.icon}</span>
                            </div>
                            <div>
                                <div className="font-label text-white/30 text-[8px] md:text-[10px] tracking-[0.25em] uppercase mb-1 md:mb-4">{stat.label}</div>
                                <div className="font-headline text-3xl md:text-6xl font-semibold tracking-tighter text-white leading-none">
                                    {typeof stat.value === 'string' ? (
                                        <span className="whitespace-nowrap">
                                            {stat.value.split(' ')[0].replace('h', '')}<span className="text-sm md:text-3xl text-white/30">h</span>
                                            <span className="mx-0.5"> </span>
                                            {stat.value.split(' ')[1].replace('m', '')}<span className="text-sm md:text-3xl text-white/30">m</span>
                                        </span>
                                    ) : stat.value}
                                </div>
                            </div>
                        </motion.div>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
                        {courses.filter(c => c.progress > 0 || (courses.length <= 3)).sort((a,b) => (b.lastWatchedAt || 0) - (a.lastWatchedAt || 0)).slice(0, 3).map((course, idx) => {
                            const colors = ['bg-primary', 'bg-blue-500', 'bg-purple-500'];
                            const cName = colors[idx % 3];
                            
                            const courseLink = course.lastLessonId ? `/lesson/${course.lastLessonId}` : `/lesson/${course.id}`;

                            return (
                                <motion.div key={course.id} whileHover={{ y: -8 }} transition={{ duration: 0.5 }}>
                                    <Link to={courseLink} className="course-card group flex flex-col aspect-[4/5] md:h-[520px] relative">
                                        <div className="flex-1 p-10 flex flex-col justify-between relative overflow-hidden">
                                            {course.thumbnailUrl ? (
                                                <div className="absolute inset-0 z-0">
                                                    <img src={course.thumbnailUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-all duration-1000 mix-blend-overlay grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110" alt="" />
                                                    <div className="course-card-overlay"></div>
                                                </div>
                                            ) : (
                                                <div className={`absolute top-0 right-0 w-72 h-72 ${cName}/10 rounded-full blur-3xl group-hover:${cName}/20 transition-colors duration-1000`}></div>
                                            )}

                                            <div className="course-icon-top w-20 h-20 flex items-center justify-center relative z-10 group-hover:scale-110 transition-all duration-700 shadow-2xl">
                                                <span className="material-symbols-outlined text-white/50 group-hover:text-white text-4xl transition-colors">{course.icon}</span>
                                            </div>

                                            <div className="relative z-10 space-y-4">
                                                <div className="flex gap-2">
                                                    <span className="badge-modulo font-label tracking-[0.2em] uppercase">MODULO BASE</span>
                                                </div>
                                                <h3 className="font-headline text-3xl font-bold leading-[1.1] group-hover:text-white transition-colors">{course.title}</h3>
                                                <p className="text-white/40 text-sm font-body">Com {course.instructor}</p>
                                            </div>
                                        </div>

                                        <div className="progress-bar-bg absolute bottom-0 left-0 right-0 h-1 rounded-none bg-transparent">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: course.progress + '%' }}
                                                className="progress-bar-fill rounded-none"
                                            ></motion.div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.section>

                {/* Categories as Modern Soft Glass Pills */}
                <motion.section variants={itemVariants} className="space-y-16">
                    <div className="space-y-2">
                        <span className="font-label text-primary text-[10px] tracking-[0.4em] uppercase">Especializações</span>
                        <h2 className="font-headline text-2xl md:text-5xl font-bold tracking-tight">Setores de Inteligência</h2>
                    </div>
                    <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 md:gap-6">
                        {sectors.map((sector) => (
                            <motion.div key={sector.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link to="/explore" className="intelligence-pill px-4 py-3 md:px-8 md:py-5 w-full">
                                    <span className="pulse-dot shrink-0"></span>
                                    <span className="font-label text-[8px] md:text-sm tracking-[0.1em] uppercase leading-tight">{sector.name}</span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

            </motion.main>

            {/* NEW FORUM SECTION */}
            <ForumSection />

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
