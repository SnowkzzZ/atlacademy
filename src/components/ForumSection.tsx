import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useData, type Article } from '../context/DataContext';

// -----------------------------
// HELPER COMPONENT: ANIMATED COUNTER
// -----------------------------
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const duration = 1500; // 1.5 seconds
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      // easeOutExpo for a nice slowdown
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      if (ref.current) {
        ref.current.textContent = Math.floor(easeOut * value).toString();
      }
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        if (ref.current) ref.current.textContent = value.toString();
      }
    };
    requestAnimationFrame(updateCounter);
  }, [inView, value]);

  return <span ref={ref} className="font-bold font-mono">0</span>;
};

// -----------------------------
// FORMATTING ASSISTANTS
// -----------------------------
const formatDate = (ts: number) => new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
            return <h3 key={i} className="font-headline text-white text-lg font-bold mt-6 mb-2">{line.replace(/\*\*/g, '')}</h3>;
        }
        if (line.startsWith('- ')) {
            return <li key={i} className="text-white/60 font-body text-sm ml-4 mb-1 list-disc">{line.slice(2)}</li>;
        }
        if (line.trim() === '') return <div key={i} className="h-3" />;
        return <p key={i} className="text-white/60 font-body text-sm leading-relaxed mb-4">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>;
    });
};

const getViewsPlaceholder = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return (Math.abs(hash) % 1500) + 120;
};

// -----------------------------
// MAIN COMPONENT
// -----------------------------
const ForumSection: React.FC = () => {
  const { sectors, articles } = useData();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Dynamic Categories based on real sectors
  const categories = ['Todos', ...sectors.map(s => s.name)];

  // Filter Data
  const filteredArticles = articles.filter(article => {
      if (activeFilter === 'Todos') return true;
      const sector = sectors.find(s => s.id === article.sectorId);
      return sector ? sector.name === activeFilter : false;
  });
  
  const displayedData = filteredArticles.slice(0, visibleCount);

  // Handlers
  const handleFilterClick = (cat: string) => {
    setActiveFilter(cat);
    setVisibleCount(6); // reset count on filter change
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 3);
  };

  return (
    <section className="relative w-full max-w-[1440px] mx-auto pt-16 pb-24 px-6 md:px-10 font-body text-white/90">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5"
        >
          {/* Cyan pulsing dot */}
          <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#00F0FF] animate-pulse"></span>
          <span className="font-label text-[10px] tracking-[0.2em] font-semibold uppercase text-primary">
            HUB DE CONHECIMENTO
          </span>
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-2xl"
        >
          Insights & Fóruns
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-white/40 text-sm md:text-base max-w-xl font-light"
        >
          Tutoriais, artigos e insights estratégicos curados pelos instrutores da ATL Academy para sua evolução diária.
        </motion.p>
      </div>

      {/* FILTER PILLS */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="flex overflow-x-auto no-scrollbar gap-3 mb-10 pb-4 snap-x"
      >
        {categories.map((cat) => {
          const isActive = activeFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => handleFilterClick(cat)}
              className={`shrink-0 snap-start px-6 py-2.5 rounded-full font-label text-[11px] tracking-[0.1em] uppercase font-semibold transition-all duration-300 border ${
                isActive 
                  ? 'bg-primary text-black border-primary shadow-[0_0_15px_rgba(0,240,255,0.4)]' 
                  : 'bg-surface-container-low/50 text-white/40 border-white/10 hover:border-primary/50 hover:text-white backdrop-blur-md'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </motion.div>

      {/* ARTICLES/FORUM GRID */}
      {filteredArticles.length === 0 ? (
          <div className="text-center py-16">
              <span className="material-symbols-outlined text-white/10 text-6xl mb-4 block">article</span>
              <p className="text-white/20 font-label tracking-widest uppercase text-sm">Nenhum insight publicado neste setor ainda.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode='popLayout'>
              {displayedData.map((article, i) => {
                const sector = sectors.find(s => s.id === article.sectorId);
                const categoryName = sector ? sector.name : 'Geral';
                const snippet = article.content.replace(/\*\*/g, '').split('\n').filter(l => l.trim()).slice(0, 2).join(' ');

                return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="group cursor-pointer bg-[#0A1628]/90 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_15px_40px_-10px_rgba(0,240,255,0.15)]"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:bg-primary/10 group-hover:border-primary/30 flex items-center justify-center transition-colors duration-300">
                            <span className="material-symbols-outlined text-white/50 group-hover:text-primary text-[24px] transition-colors duration-300">
                              article
                            </span>
                          </div>
                          <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-primary font-label text-[9px] tracking-[0.15em] uppercase font-bold">
                            {categoryName}
                          </div>
                        </div>

                        <h3 className="text-xl font-headline font-bold text-white mb-3 leading-tight group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        
                        <p className="text-white/40 text-sm line-clamp-2 leading-relaxed mb-6 font-light">
                          "{snippet}"
                        </p>
                      </div>

                      {/* CARD FOOTER */}
                      <div className="pt-5 border-t border-primary/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                            <span className="material-symbols-outlined text-[16px] text-white/50">person</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-semibold text-white/80">{article.author}</span>
                            <span className="text-[9px] text-white/30 uppercase tracking-widest">{formatDate(article.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <span className="text-primary text-[14px]">
                              <AnimatedCounter value={getViewsPlaceholder(article.id)} />
                            </span>
                            <span className="text-[8px] text-white/30 uppercase tracking-[0.2em]">Visualizações</span>
                          </div>
                          
                          <div className="w-2 h-2 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88] animate-pulse" title="Artigo em Alta"></div>
                        </div>
                      </div>
                    </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
      )}

      {/* LOAD MORE BUTTON */}
      {visibleCount < filteredArticles.length && (
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="w-full flex justify-center mt-12"
        >
          <button 
            onClick={handleLoadMore}
            className="group relative px-8 py-3 rounded-full font-label text-[11px] tracking-[0.2em] font-bold text-white uppercase overflow-hidden border border-white/20 transition-all duration-300 hover:border-primary/50 hover:scale-105"
          >
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300"></div>
            <span className="relative z-10 drop-shadow-md flex items-center gap-2">
              Ver Mais Artigos
              <span className="material-symbols-outlined text-[14px] group-hover:translate-y-0.5 transition-transform">expand_more</span>
            </span>
          </button>
        </motion.div>
      )}

      {/* FULL ARTICLE MODAL */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 pt-16 md:p-8 bg-black/80 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div 
              initial={{ scale: 0.96, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 40 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#050B14] border border-primary/30 shadow-[0_0_50px_rgba(0,240,255,0.15)] rounded-[2rem] max-w-5xl w-full relative overflow-hidden my-auto pointer-events-auto"
            >
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors z-10"
              >
                <span className="material-symbols-outlined text-white/50 text-base">close</span>
              </button>
              
              <div className="flex flex-col md:flex-row">
                 {/* Left Panel: Meta */}
                 <div className="md:w-72 lg:w-80 shrink-0 p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/10 flex flex-col gap-5 bg-white/[0.02]">
                    {(() => {
                        const sector = sectors.find(s => s.id === selectedArticle.sectorId);
                        return sector ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 font-label text-[9px] tracking-[0.2em] uppercase text-primary w-fit">
                                <span className="w-1 h-1 rounded-full bg-primary" />
                                {sector.name}
                            </span>
                        ) : null;
                    })()}
                    
                    <h2 className="font-headline text-2xl md:text-3xl font-bold text-white leading-tight pr-6">
                        {selectedArticle.title}
                    </h2>
                    
                    <div className="flex flex-col gap-2 pt-4 border-t border-white/10 mt-auto md:mt-10">
                        <span className="text-white/40 font-label text-[10px] tracking-widest uppercase">{selectedArticle.author}</span>
                        <span className="text-white/30 font-label text-[10px]">{formatDate(selectedArticle.createdAt)}</span>
                        
                        <div className="flex items-center gap-2 text-primary mt-4 font-label text-[10px] tracking-[0.1em] uppercase">
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            {getViewsPlaceholder(selectedArticle.id)} Views
                        </div>
                    </div>
                 </div>

                 {/* Right Panel: Content */}
                 <div className="flex-1 p-8 md:p-10 overflow-y-auto max-h-[70vh] custom-scrollbar">
                     <div className="prose-sm">
                         {formatContent(selectedArticle.content)}
                     </div>
                 </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
};

export default ForumSection;
