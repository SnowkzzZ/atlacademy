import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { logoBase64 } from '../logoBase64';
import { useData } from '../context/DataContext';

const Dashboard: React.FC = () => {
    const { courses, sectors } = useData();

    const totalCourses = courses.length;
    const completedCoursesCount = courses.filter(c => c.progress === 100).length;

    const totalWatchedSeconds = courses.reduce((acc, curr) => acc + (curr.watchedSeconds || 0), 0);
    const totalHoursWatched = Math.floor(totalWatchedSeconds / 3600);
    const totalMinutesWatched = Math.floor((totalWatchedSeconds % 3600) / 60);

    const heroCourse = [...courses].sort((a, b) => (b.lastWatchedAt || 0) - (a.lastWatchedAt || 0))[0] || courses[0];

    const heroProgress = heroCourse ?
        (heroCourse.totalSeconds ? Math.round(((heroCourse.watchedSeconds || 0) / heroCourse.totalSeconds) * 100) : heroCourse.progress)
        : 0;

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
        <div className="font-body text-white/90 selection:bg-primary selection:text-black min-h-screen relative bg-[#030303] overflow-x-hidden">
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[#030303]"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[150px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[150px]"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.02]"></div>
            </div>

            <Navbar />

            <motion.main
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pb-8 md:pb-32 space-y-8 md:space-y-24"
            >
                {/* Cinematic Liquid Glass Hero */}
                <section className="pt-0 relative flex flex-col items-center justify-start min-h-[auto] md:min-h-[70vh] mt-2 md:mt-8">
                    <motion.div
                        initial={{ scale: 1.05, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute inset-0 z-0 h-full overflow-hidden"
                    >
                        {heroCourse?.thumbnailUrl ? (
                            <img src={heroCourse.thumbnailUrl} className="w-full h-full object-cover opacity-100 brightness-110 contrast-105 object-center" alt="" />
                        ) : (
                            <div className="absolute inset-0 bg-primary opacity-5 blur-[120px] rounded-full scale-125"></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/40 to-transparent"></div>
                        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#030303] to-transparent"></div>
                        <div className="absolute inset-y-0 left-0 w-1/4 md:w-1/3 bg-gradient-to-r from-[#030303] to-transparent"></div>
                        <div className="absolute inset-y-0 right-0 w-1/4 md:w-1/3 bg-gradient-to-l from-[#030303] to-transparent"></div>
                    </motion.div>

                    <div className="relative z-10 flex flex-col items-center text-center space-y-4 w-full max-w-5xl pt-16 pb-0 md:py-16">
                        <motion.div variants={itemVariants} className="relative mt-2 mb-4 flex flex-col items-center">
                            <div className="absolute inset-0 bg-primary opacity-20 blur-[120px] rounded-full scale-125"></div>
                            <img src={logoBase64} alt="ATL Logo" className="drop-shadow-[0_0_60px_rgba(255,255,255,0.4)] relative z-10 w-auto h-[120px] md:h-[180px]" />
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-4 md:space-y-6 relative z-20">
                            <div className="inline-flex premium-pill items-center gap-2 md:gap-3">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_12px_#00FD86] animate-pulse"></span>
                                <span className="text-[10px] tracking-[0.2em]">ÁREA DO MEMBRO EXCLUSIVO</span>
                            </div>

                            <h1
                                className="font-headline font-bold tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/30 drop-shadow-2xl w-full text-center"
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
                            className="liquid-glass-card w-[calc(100%-2rem)] md:w-full max-w-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 mx-4 mt-4 md:mt-16"
                        >
                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
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
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${heroProgress}%` }}
                                        transition={{ duration: 1.2, delay: 1 }}
                                        className="h-full bg-gradient-to-r from-primary/40 to-primary rounded-full relative"
                                    >
                                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/30 blur-[4px]"></div>
                                    </motion.div>
                                </div>
                            </div>

                            <Link to={heroCourse ? `/lesson/${heroCourse.id}` : "/lesson"} className="w-full md:w-auto bg-white text-black px-10 py-4 rounded-2xl font-headline font-bold text-[11px] tracking-[0.2em] hover:bg-primary transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] uppercase">
                                {heroProgress > 0 ? 'Continuar Aula' : 'Iniciar Aula'}
                            </Link>
                        </motion.div>
                    </div>
                </section>

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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                        {courses.slice(0, 3).map((course, idx) => {
                            const colors = ['bg-primary', 'bg-blue-500', 'bg-purple-500'];
                            const textColors = ['text-primary', 'text-blue-400', 'text-purple-400'];
                            const cName = colors[idx % 3];
                            const tName = textColors[idx % 3];

                            return (
                                <motion.div key={course.id} whileHover={{ y: -12 }} transition={{ duration: 0.5 }}>
                                    <Link to={`/lesson/${course.id}`} className="liquid-glass-card group flex flex-col h-[480px] overflow-hidden relative">
                                        <div className="flex-1 p-10 flex flex-col justify-between relative overflow-hidden">
                                            {course.thumbnailUrl ? (
                                                <div className="absolute inset-0 z-0">
                                                    <img src={course.thumbnailUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-all duration-1000 mix-blend-overlay grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110" alt="" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/40 to-transparent"></div>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-[#030303]/60 via-transparent to-transparent"></div>
                                                </div>
                                            ) : (
                                                <div className={`absolute top-0 right-0 w-72 h-72 ${cName}/10 rounded-full blur-[100px] group-hover:${cName}/20 transition-colors duration-1000`}></div>
                                            )}

                                            <div className="w-20 h-20 rounded-[28px] bg-white/[0.03] border border-white/10 flex items-center justify-center relative z-10 backdrop-blur-xl group-hover:scale-110 transition-all duration-700 shadow-2xl">
                                                <span className="material-symbols-outlined text-white/50 group-hover:text-white text-4xl transition-colors">{course.icon}</span>
                                            </div>

                                            <div className="relative z-10 space-y-4">
                                                <div className="flex gap-2">
                                                    <span className={`px-3 py-1 rounded-full bg-white/5 border border-white/10 font-label text-[8px] tracking-[0.2em] ${tName} uppercase`}>MODULO BASE</span>
                                                </div>
                                                <h3 className="font-headline text-3xl font-bold leading-[1.1] group-hover:text-white transition-colors">{course.title}</h3>
                                                <p className="text-white/40 text-sm font-body">Com {course.instructor}</p>
                                            </div>
                                        </div>

                                        <div className="h-2 w-full bg-white/5 relative">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: course.progress + '%' }}
                                                className={`h-full bg-gradient-to-r from-${cName}/20 to-${cName.replace('bg-', '')} shadow-[0_0_20px_rgba(0,255,135,0.2)]`}
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
                                <Link to="/explore" className="px-3 py-3 md:px-10 md:py-6 liquid-glass rounded-xl md:rounded-full flex items-center gap-2 md:gap-6 hover:bg-white/[0.08] transition-all group w-full">
                                    <span className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-white/10 group-hover:bg-primary group-hover:shadow-[0_0_10px_#00FF87] transition-all shrink-0"></span>
                                    <span className="font-label text-[8px] md:text-xs tracking-[0.15em] md:tracking-[0.3em] uppercase text-white/60 group-hover:text-white transition-colors leading-tight">{sector.name}</span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

            </motion.main>

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
