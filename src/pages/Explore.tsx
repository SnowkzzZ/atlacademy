import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';

const Explore: React.FC = () => {
    const { courses, sectors, articles } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSector, setActiveSector] = useState('ALL');
    const [activeTab, setActiveTab] = useState<'courses' | 'newsletters'>('courses');
    const [selectedArticle, setSelectedArticle] = useState<any>(null);

    // Filter courses by search term and exact sector/modality ID
    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (activeSector === 'ALL') return matchesSearch;
        return matchesSearch && course.sectorId === activeSector;
    });

    return (
        <div className="font-body text-white/90 min-h-screen relative bg-black selection:bg-primary/30 selection:text-white">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-black"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px]"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px]"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.02]"></div>
            </div>

            <Navbar />

            <main className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 py-28 md:py-36 space-y-12 md:space-y-20">

                {/* Apple-style Header */}
                <div className="text-center space-y-4 md:space-y-6 max-w-3xl mx-auto flex flex-col items-center px-4">
                    <span className="font-label text-primary text-[9px] md:text-[11px] tracking-[0.4em] uppercase font-bold">Base de Inteligência</span>
                    <h1 className="font-headline text-4xl md:text-7xl font-bold uppercase tracking-tight text-white leading-tight">
                        Explorar Redes
                    </h1>
                    <p className="text-white/40 font-body text-sm md:text-lg max-w-xl">
                        Acesso instantâneo a {courses.length} módulos ativos de conhecimento avançado e estratégia.
                    </p>
                </div>

                {/* Custom sliding tab selector */}
                <div className="flex justify-center mb-12">
                    <div className="bg-white/[0.02] border border-white/5 rounded-full p-1 md:p-1.5 flex gap-1 sm:gap-2 shadow-2xl relative z-20 max-w-full">
                        <button
                            onClick={() => setActiveTab('courses')}
                            className={`relative px-4 sm:px-8 py-2 md:py-3 rounded-full font-label text-[8px] sm:text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-500 ${activeTab === 'courses' ? 'bg-white text-black font-extrabold shadow-xl' : 'text-white/40 hover:text-white/80'}`}
                        >
                            <span className="hidden sm:inline">Trilhas & Módulos</span>
                            <span className="inline sm:hidden">Módulos</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('newsletters')}
                            className={`relative px-4 sm:px-8 py-2 md:py-3 rounded-full font-label text-[8px] sm:text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-500 ${activeTab === 'newsletters' ? 'bg-white text-black font-extrabold shadow-xl' : 'text-white/40 hover:text-white/80'}`}
                        >
                            <span className="hidden sm:inline">Newsletters & Atualizações</span>
                            <span className="inline sm:hidden">Newsletter</span>
                        </button>
                    </div>
                </div>

                {activeTab === 'courses' && (
                    <div className="space-y-12 md:space-y-20 animate-in fade-in duration-500">
                        {/* Sleek Search Bar */}
                        <div className="w-full max-w-3xl mx-auto">
                            <div className="relative flex items-center bg-white/[0.02] border border-white/[0.06] rounded-full p-2 focus-within:border-primary/50 focus-within:bg-white/[0.04] transition-all duration-300">
                                <span className="material-symbols-outlined pl-4 text-white/30 text-lg md:text-xl">search</span>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Pesquisar módulos, instrutores..."
                                    className="w-full bg-transparent border-none pl-3 pr-4 py-3 md:py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-0 font-body text-sm md:text-base"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="p-1 mr-2 text-white/30 hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Interactive Sector Filter Pills */}
                        <div className="w-full">
                            <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-2 md:justify-center md:flex-wrap px-4">
                                <button
                                    onClick={() => setActiveSector('ALL')}
                                    className={`px-6 py-2.5 rounded-full font-label text-[9px] font-bold tracking-[0.2em] uppercase transition-all duration-300 border ${
                                        activeSector === 'ALL'
                                            ? 'bg-white text-black border-white shadow-xl'
                                            : 'bg-white/[0.02] text-white/40 border-white/[0.06] hover:text-white hover:border-white/20'
                                    }`}
                                >
                                    TODOS OS SETORES
                                </button>
                                {sectors.map(sector => (
                                    <button
                                        key={sector.id}
                                        onClick={() => setActiveSector(sector.id)}
                                        className={`px-6 py-2.5 rounded-full font-label text-[9px] font-bold tracking-[0.2em] uppercase transition-all duration-300 border ${
                                            activeSector === sector.id
                                                ? 'bg-white text-black border-white shadow-xl'
                                                : 'bg-white/[0.02] text-white/40 border-white/[0.06] hover:text-white hover:border-white/20'
                                        }`}
                                    >
                                        {sector.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Course Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                            {filteredCourses.map((course) => {
                                const courseLink = course.lastLessonId ? `/lesson/${course.lastLessonId}` : `/lesson/${course.id}`;
                                const dispTitle = course.cardTitle || course.title;
                                const dispSubtitle = course.cardSubtitle || course.subtitle;
                                const dispThumb = course.cardThumbnail || course.thumbnailUrl;
                                const dispIcon = course.cardIcon || course.icon;
                                return (
                                    <motion.div 
                                        key={course.id}
                                        whileHover={{ y: -6 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <Link 
                                            to={courseLink} 
                                            className="group flex flex-col p-6 md:p-8 relative overflow-hidden aspect-square bg-white/[0.01] border border-white/[0.06] rounded-[2.5rem] transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.03] shadow-lg"
                                        >
                                            {/* Card Background / Thumbnail */}
                                            {dispThumb ? (
                                                <div className="absolute inset-0 z-0">
                                                    <img 
                                                         src={dispThumb} 
                                                         className="w-full h-full object-cover opacity-[0.3] group-hover:opacity-50 transition-all duration-1000 group-hover:scale-105" 
                                                         alt="" 
                                                     />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
                                                </div>
                                            ) : (
                                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                            )}

                                            {/* Icon Badge */}
                                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center relative z-10 backdrop-blur-xl mb-6 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                                                <span className="material-symbols-outlined text-white/50 group-hover:text-primary text-xl md:text-2xl font-light transition-colors">{dispIcon}</span>
                                            </div>

                                            {/* Bottom details */}
                                            <div className="flex-1 flex flex-col justify-end space-y-3 relative z-10">
                                                {dispSubtitle && (
                                                    <span className="font-label text-[8px] text-white/40 tracking-[0.25em] uppercase font-bold">{dispSubtitle}</span>
                                                )}
                                                <h3 className="font-headline text-lg md:text-xl font-bold leading-snug text-white/90 group-hover:text-white transition-colors uppercase line-clamp-2">{dispTitle}</h3>

                                                <div className="pt-4 border-t border-white/[0.06] flex justify-between items-center mt-2 group-hover:border-white/[0.12] transition-colors">
                                                    <span className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">{course.instructor}</span>
                                                    <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full border border-white/[0.05]">
                                                        <span className="material-symbols-outlined text-primary text-[12px] font-bold">play_circle</span>
                                                        <span className="font-label text-[8px] tracking-widest text-primary uppercase font-bold">{course.duration}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}

                            {filteredCourses.length === 0 && (
                                <div className="col-span-full text-center py-24 border border-white/[0.05] rounded-[2.5rem] bg-white/[0.01]">
                                    <span className="material-symbols-outlined text-white/10 text-5xl mb-4 font-light">search_off</span>
                                    <h3 className="text-white/50 font-headline text-lg uppercase tracking-wider">Nenhum módulo encontrado</h3>
                                    <p className="text-white/30 text-xs mt-1">Tente ajustar seus termos de busca ou mudar o setor selecionado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'newsletters' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto animate-in fade-in duration-500">
                        {articles.map((article, idx) => {
                            const dateStr = new Date(article.createdAt || Date.now()).toLocaleDateString('pt-BR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            });
                            const sectorName = sectors.find(s => s.id === article.sectorId)?.name || 'Geral';
                            
                            return (
                                <motion.div
                                    key={article.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                                    className="group relative bg-white/[0.01] border border-white/[0.06] rounded-[2.5rem] p-8 hover:bg-white/[0.02] hover:border-white/[0.12] transition-all duration-500 flex flex-col justify-between gap-6 shadow-xl overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="space-y-4 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 font-label text-[8px] tracking-[0.2em] uppercase text-primary font-bold">
                                                {sectorName}
                                            </span>
                                        </div>
                                        <h3 className="font-headline text-lg md:text-xl font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-snug">
                                            {article.title}
                                        </h3>
                                        <p className="text-white/40 text-xs md:text-sm font-body leading-relaxed line-clamp-3">
                                            {article.content.replace(/[#*`]/g, '')}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-6 border-t border-white/[0.06] mt-4 relative z-10">
                                        <div className="flex items-center gap-2 text-white/30 font-label text-[9px] uppercase tracking-wider font-semibold">
                                            <span>{article.author}</span>
                                            <span>•</span>
                                            <span>{dateStr}</span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedArticle(article)}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl font-label text-[8px] uppercase tracking-[2px] font-bold hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 active:scale-95"
                                        >
                                            Ler Completo
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {articles.length === 0 && (
                            <div className="col-span-full text-center py-20 border border-white/[0.05] rounded-[2.5rem] bg-white/[0.01]">
                                <span className="material-symbols-outlined text-white/10 text-5xl mb-4 font-light">mail</span>
                                <h3 className="text-white/50 font-headline text-lg uppercase tracking-wider">Nenhum comunicado disponível</h3>
                                <p className="text-white/30 text-xs mt-1">Nossos editores não publicaram nenhuma novidade no momento.</p>
                            </div>
                        )}
                    </div>
                )}

            </main>

            {/* Newsletter Detail Modal */}
            {selectedArticle && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
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
        </div>
    );
};

export default Explore;
