import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useData } from '../context/DataContext';

const Intelligence: React.FC = () => {
    const { sectors, articles } = useData();
    const [selectedSector, setSelectedSector] = useState<string | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

    const filteredArticles = selectedSector
        ? articles.filter(a => a.sectorId === selectedSector)
        : articles;

    const openArticle = articles.find(a => a.id === selectedArticle);

    const formatDate = (ts: number) => new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const formatContent = (content: string) => {
        return content.split('\n').map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**')) {
                return <h3 key={i} className="font-headline text-white text-lg font-bold mt-6 mb-2">{line.replace(/\*\*/g, '')}</h3>;
            }
            if (line.startsWith('- ')) {
                return <li key={i} className="text-white/60 font-body text-sm ml-4 mb-1 list-disc">{line.slice(2)}</li>;
            }
            if (line.trim() === '') return <div key={i} className="h-3" />;
            return <p key={i} className="text-white/60 font-body text-sm leading-relaxed mb-2">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>;
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };
    const itemVariants: any = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
    };

    return (
        <div className="min-h-screen bg-black text-white relative selection:bg-primary/30 selection:text-white">
            
            {/* Background elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-black"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px]"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.02]"></div>
            </div>

            <Navbar />

            {/* Hero */}
            <section className="relative pt-32 pb-16 md:pt-44 md:pb-24 px-6 md:px-10 text-center overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-4xl mx-auto"
                >
                    <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 font-label text-[9px] tracking-[0.2em] uppercase text-primary mb-6">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_12px_#00F0FF] animate-pulse" />
                        HUB DE CONHECIMENTO
                    </span>
                    <h1
                        className="font-headline font-bold tracking-tight uppercase text-white mb-6"
                        style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)', lineHeight: 1 }}
                    >
                        Inteligência
                    </h1>
                    <p className="text-white/40 font-body text-sm md:text-lg max-w-xl mx-auto">
                        Tutoriais e insights estratégicos curados pelos instrutores da ATL Academy.
                    </p>
                </motion.div>
            </section>

            {/* Sector Filter */}
            <div className="px-6 md:px-10 max-w-[1440px] mx-auto mb-12 relative z-10">
                <div className="flex flex-wrap gap-2.5 justify-start md:justify-center">
                    <button
                        onClick={() => setSelectedSector(null)}
                        className={`px-5 py-2.5 rounded-full font-label text-[9px] font-bold tracking-[0.2em] uppercase transition-all duration-300 border ${
                            !selectedSector 
                                ? 'bg-white text-black border-white shadow-xl' 
                                : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white hover:border-white/20'
                        }`}
                    >
                        Todos
                    </button>
                    {sectors.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSelectedSector(s.id === selectedSector ? null : s.id)}
                            className={`px-5 py-2.5 rounded-full font-label text-[9px] font-bold tracking-[0.2em] uppercase transition-all duration-300 border ${
                                selectedSector === s.id 
                                    ? 'bg-white text-black border-white shadow-xl' 
                                    : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white hover:border-white/20'
                            }`}
                        >
                            {s.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Articles Grid */}
            <motion.main
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="px-6 md:px-10 max-w-[1440px] mx-auto pb-24 relative z-10"
            >
                {filteredArticles.length === 0 ? (
                    <motion.div variants={itemVariants} className="text-center py-32 border border-white/[0.05] rounded-[2.5rem] bg-white/[0.01]">
                        <span className="material-symbols-outlined text-white/15 text-5xl mb-4 block font-light">article</span>
                        <p className="text-white/40 font-headline uppercase text-sm tracking-wider">Nenhum artigo publicado</p>
                        <p className="text-white/30 text-xs mt-1">Este setor de inteligência será atualizado em breve.</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {filteredArticles.map(article => {
                            const sector = sectors.find(s => s.id === article.sectorId);
                            return (
                                <motion.div
                                    key={article.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -6 }}
                                    onClick={() => setSelectedArticle(article.id)}
                                    className="p-8 flex flex-col gap-5 cursor-pointer group bg-white/[0.01] border border-white/[0.06] rounded-[2.5rem] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-500 shadow-lg"
                                >
                                    {/* Sector tag */}
                                    {sector && (
                                        <span className="inline-flex items-center gap-1.5 w-fit px-3 py-1 rounded-full bg-primary/10 border border-primary/20 font-label text-[8px] tracking-[0.2em] uppercase text-primary font-bold">
                                            <span className="w-1 h-1 rounded-full bg-primary" />
                                            {sector.name}
                                        </span>
                                    )}
                                    <div className="space-y-3">
                                        <h3 className="font-headline text-lg md:text-xl font-bold text-white/90 group-hover:text-white transition-colors leading-snug uppercase">
                                            {article.title}
                                        </h3>
                                        <p className="text-white/40 font-body text-xs md:text-sm leading-relaxed line-clamp-3">
                                            {article.content.replace(/\*\*/g, '').split('\n').filter(l => l.trim()).slice(0, 2).join(' ')}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/[0.06] group-hover:border-white/[0.12] transition-colors">
                                        <span className="text-white/30 font-label text-[9px] tracking-widest uppercase font-semibold">{article.author}</span>
                                        <span className="text-white/30 font-label text-[9px] font-semibold">{formatDate(article.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-primary/60 group-hover:text-primary transition-colors mt-2">
                                        <span className="font-label text-[9px] tracking-[0.2em] uppercase font-bold">Acessar Insight</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.main>

            {/* Article Modal */}
            <AnimatePresence>
                {openArticle && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedArticle(null)}
                            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110]"
                        />
                        {/* Centered Modal Wrapper */}
                        <div className="fixed inset-0 z-[120] flex items-start md:items-center justify-center p-4 pt-16 md:p-8 overflow-y-auto pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 30, scale: 0.98 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="relative w-full max-w-4xl bg-neutral-950/80 border border-white/[0.08] backdrop-blur-[40px] pointer-events-auto my-4 overflow-hidden rounded-[2.5rem] shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setSelectedArticle(null)}
                                    className="absolute top-6 right-6 w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02] hover:bg-white/10 transition-colors z-10"
                                >
                                    <span className="material-symbols-outlined text-white/50 text-base">close</span>
                                </button>

                                {/* Two-column layout */}
                                <div className="flex flex-col md:flex-row">
                                    {/* Left panel: meta */}
                                    <div className="md:w-72 lg:w-80 shrink-0 p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/[0.06] flex flex-col gap-5 bg-white/[0.01]">
                                        {(() => {
                                            const sector = sectors.find(s => s.id === openArticle.sectorId);
                                            return sector ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 font-label text-[8px] tracking-[0.2em] uppercase text-primary w-fit font-bold">
                                                    <span className="w-1 h-1 rounded-full bg-primary" />
                                                    {sector.name}
                                                </span>
                                            ) : null;
                                        })()}
                                        <h2 className="font-headline text-xl md:text-2xl font-bold text-white leading-snug pr-4 uppercase">
                                            {openArticle.title}
                                        </h2>
                                        <div className="flex flex-col gap-2 pt-5 border-t border-white/[0.06] mt-4">
                                            <span className="text-white/40 font-label text-[9px] tracking-widest uppercase font-semibold">Publicado por</span>
                                            <span className="text-white/80 font-headline text-sm font-semibold uppercase">{openArticle.author}</span>
                                            <span className="text-white/30 font-label text-[9px] mt-1">{formatDate(openArticle.createdAt)}</span>
                                        </div>
                                    </div>

                                    {/* Right panel: content */}
                                    <div className="flex-1 p-8 md:p-10 overflow-y-auto max-h-[65vh] custom-scrollbar">
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            {formatContent(openArticle.content)}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Intelligence;
