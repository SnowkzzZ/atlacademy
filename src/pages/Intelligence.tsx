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
        <div className="min-h-screen bg-[#030303] text-white">
            <Navbar />

            {/* Hero */}
            <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 px-6 md:px-10 text-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,135,0.04)_0%,transparent_70%)]" />
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-4xl mx-auto"
                >
                    <span className="inline-flex items-center gap-2 premium-pill mb-6">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_12px_#00FD86] animate-pulse" />
                        <span className="text-[10px] tracking-[0.2em]">HUB DE CONHECIMENTO</span>
                    </span>
                    <h1
                        className="font-headline font-bold tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/20 mb-6"
                        style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)', lineHeight: 1 }}
                    >
                        Inteligência
                    </h1>
                    <p className="text-white/40 font-body text-base md:text-lg max-w-xl mx-auto">
                        Tutoriais e insights estratégicos curados pelos instrutores da ATL Academy.
                    </p>
                </motion.div>
            </section>

            {/* Sector Filter */}
            <div className="px-6 md:px-10 max-w-[1440px] mx-auto mb-10">
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setSelectedSector(null)}
                        className={`px-5 py-2 rounded-full font-label text-[10px] tracking-[0.2em] uppercase transition-all border ${!selectedSector ? 'bg-primary text-black border-primary shadow-[0_0_20px_rgba(0,255,135,0.3)]' : 'border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}
                    >
                        Todos
                    </button>
                    {sectors.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSelectedSector(s.id === selectedSector ? null : s.id)}
                            className={`px-5 py-2 rounded-full font-label text-[10px] tracking-[0.2em] uppercase transition-all border ${selectedSector === s.id ? 'bg-primary text-black border-primary shadow-[0_0_20px_rgba(0,255,135,0.3)]' : 'border-white/10 text-white/40 hover:text-white hover:border-white/30 liquid-glass'}`}
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
                className="px-6 md:px-10 max-w-[1440px] mx-auto pb-20"
            >
                {filteredArticles.length === 0 ? (
                    <motion.div variants={itemVariants} className="text-center py-32">
                        <span className="material-symbols-outlined text-white/10 text-6xl mb-4 block">article</span>
                        <p className="text-white/20 font-label tracking-widest uppercase text-sm">Nenhum artigo publicado neste setor ainda.</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredArticles.map(article => {
                            const sector = sectors.find(s => s.id === article.sectorId);
                            return (
                                <motion.div
                                    key={article.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -6 }}
                                    onClick={() => setSelectedArticle(article.id)}
                                    className="liquid-glass-card p-8 flex flex-col gap-4 cursor-pointer group"
                                >
                                    {/* Sector tag */}
                                    {sector && (
                                        <span className="inline-flex items-center gap-2 w-fit px-3 py-1 rounded-full bg-primary/10 border border-primary/20 font-label text-[9px] tracking-[0.2em] uppercase text-primary">
                                            <span className="w-1 h-1 rounded-full bg-primary" />
                                            {sector.name}
                                        </span>
                                    )}
                                    <h3 className="font-headline text-xl font-bold text-white group-hover:text-primary transition-colors leading-tight">
                                        {article.title}
                                    </h3>
                                    <p className="text-white/40 font-body text-sm leading-relaxed line-clamp-3">
                                        {article.content.replace(/\*\*/g, '').split('\n').filter(l => l.trim()).slice(0, 2).join(' ')}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.05]">
                                        <span className="text-white/20 font-label text-[10px] tracking-widest uppercase">{article.author}</span>
                                        <span className="text-white/20 font-label text-[10px]">{formatDate(article.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-primary/60 group-hover:text-primary transition-colors">
                                        <span className="font-label text-[10px] tracking-[0.2em] uppercase">Ler artigo</span>
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
                            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50"
                        />
                        {/* Centered Modal Wrapper */}
                        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 pt-16 md:p-8 overflow-y-auto pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 40, scale: 0.96 }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                                className="relative w-full max-w-5xl liquid-glass-card pointer-events-auto my-4 overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setSelectedArticle(null)}
                                    className="absolute top-5 right-5 w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors z-10"
                                >
                                    <span className="material-symbols-outlined text-white/50 text-base">close</span>
                                </button>

                                {/* Two-column on desktop, single on mobile */}
                                <div className="flex flex-col md:flex-row">
                                    {/* Left panel: meta */}
                                    <div className="md:w-72 lg:w-80 shrink-0 p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/[0.06] flex flex-col gap-5">
                                        {(() => {
                                            const sector = sectors.find(s => s.id === openArticle.sectorId);
                                            return sector ? (
                                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 font-label text-[9px] tracking-[0.2em] uppercase text-primary w-fit">
                                                    <span className="w-1 h-1 rounded-full bg-primary" />
                                                    {sector.name}
                                                </span>
                                            ) : null;
                                        })()}
                                        <h2 className="font-headline text-xl md:text-2xl font-bold text-white leading-tight pr-6">
                                            {openArticle.title}
                                        </h2>
                                        <div className="flex flex-col gap-2 pt-4 border-t border-white/[0.06]">
                                            <span className="text-white/30 font-label text-[10px] tracking-widest uppercase">{openArticle.author}</span>
                                            <span className="text-white/20 font-label text-[10px]">{formatDate(openArticle.createdAt)}</span>
                                        </div>
                                    </div>

                                    {/* Right panel: content */}
                                    <div className="flex-1 p-8 md:p-10 overflow-y-auto max-h-[70vh]">
                                        <div className="prose-sm">
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
