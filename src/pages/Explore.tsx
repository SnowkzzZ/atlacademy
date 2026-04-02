import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useData } from '../context/DataContext';

const Explore: React.FC = () => {
    const { courses, sectors } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSector, setActiveSector] = useState('ALL');

    // Filter courses directly from context based on search and sector
    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
        // In a real app we'd filter by sector ID, here we just filter by search for MVP simplicity
        // But we map the sectors buttons below
        return matchesSearch;
    });

    return (
        <div className="font-body text-white/90 min-h-screen relative bg-[#030303]">
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[#030303]"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-3xl"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.02]"></div>
            </div>

            <Navbar />

            <main className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-10 py-24 md:py-32 space-y-12 md:space-y-16">

                {/* Soft Glass Header */}
                <div className="text-center space-y-4 md:space-y-6 max-w-3xl mx-auto flex flex-col items-center px-4">
                    <div className="premium-pill text-[8px] md:text-[10px]">Base de Inteligência</div>
                    <h1 className="font-headline text-3xl md:text-7xl font-bold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40 leading-tight">
                        Explorar Redes
                    </h1>
                    <p className="text-white/40 font-body text-base md:text-lg">Acesso a {courses.length} módulos ativos de conhecimento avançado.</p>
                </div>

                {/* Liquid Glass Search Bar */}
                <div className="liquid-glass-soft w-full max-w-4xl mx-auto p-1.5 md:p-2 flex items-center gap-2">
                    <div className="relative w-full flex-1">
                        <span className="material-symbols-outlined absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-white/30 text-lg md:text-xl">search</span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Pesquisar módulos..."
                            className="w-full bg-transparent border-none px-12 md:px-16 py-4 md:py-6 text-white placeholder:text-white/30 focus:outline-none focus:ring-0 font-body text-sm md:text-base"
                        />
                    </div>
                    <button className="bg-white text-black px-8 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-headline font-bold hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all uppercase tracking-widest text-[9px] md:text-[10px] whitespace-nowrap hidden sm:block">
                        Procurar
                    </button>
                </div>

                {/* Horizontal Scroll for Sectors on Mobile */}
                <div className="w-full overflow-hidden">
                    <div className="flex overflow-x-auto no-scrollbar gap-3 py-2 px-1 md:justify-center md:flex-wrap">
                        <button
                            onClick={() => setActiveSector('ALL')}
                            className={`premium-pill shrink-0 ${activeSector === 'ALL' ? 'bg-white/10 text-white border-white/20 shadow-lg' : ''}`}>
                            TODOS OS SETORES
                        </button>
                        {sectors.map(sector => (
                            <button
                                key={sector.id}
                                onClick={() => setActiveSector(sector.id)}
                                className={`premium-pill shrink-0 ${activeSector === sector.id ? 'bg-white/10 text-white border-white/20 shadow-lg' : ''}`}>
                                {sector.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                    {filteredCourses.map((course) => (
                        <Link to={`/lesson/${course.id}`} key={course.id} className="liquid-glass-card group flex flex-col p-6 md:p-8 relative overflow-hidden h-[320px] md:h-[360px]">
                            {/* Card Background / Thumbnail */}
                            {course.thumbnailUrl ? (
                                <div className="absolute inset-0 z-0">
                                    <img src={course.thumbnailUrl} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-all duration-700 mix-blend-overlay grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110" alt="" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/60 to-transparent"></div>
                                </div>
                            ) : (
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            )}

                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center relative z-10 backdrop-blur-xl mb-4 md:mb-6 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                                <span className="material-symbols-outlined text-white/60 group-hover:text-primary text-2xl md:text-3xl font-extralight transition-colors">{course.icon}</span>
                            </div>

                            <div className="flex-1 flex flex-col justify-end space-y-3 md:space-y-4 relative z-10">
                                <h3 className="font-headline text-xl md:text-2xl font-bold leading-tight drop-shadow-md text-white/90 group-hover:text-white transition-colors uppercase">{course.title}</h3>

                                <div className="pt-3 md:pt-4 border-t border-white/10 flex justify-between items-center mt-2 group-hover:border-primary/20 transition-colors">
                                    <span className="text-white/40 text-[10px] md:text-sm uppercase tracking-widest">{course.instructor}</span>
                                    <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full border border-white/5">
                                        <span className="material-symbols-outlined text-primary text-[12px] md:text-[14px]">play_circle</span>
                                        <span className="font-label text-[8px] md:text-[9px] tracking-widest text-primary uppercase">{course.duration}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {filteredCourses.length === 0 && (
                        <div className="col-span-full text-center py-20">
                            <span className="material-symbols-outlined text-white/20 text-6xl mb-4">search_off</span>
                            <h3 className="text-white/60 font-headline text-xl">Nenhum módulo encontrado.</h3>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Explore;
