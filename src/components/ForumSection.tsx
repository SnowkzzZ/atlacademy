import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useData, type Article } from '../context/DataContext';

// ─── Paletas liquid glass ─────────────────────────────────────────────────────
const PALETTES = [
  { from:'#00F0FF', to:'#0099cc', glow:'0,240,255',   text:'#00F0FF' },
  { from:'#a78bfa', to:'#7c3aed', glow:'167,139,250', text:'#c4b5fd' },
  { from:'#34d399', to:'#059669', glow:'52,211,153',  text:'#6ee7b7' },
  { from:'#fb923c', to:'#ea580c', glow:'251,146,60',  text:'#fdba74' },
  { from:'#f472b6', to:'#db2777', glow:'244,114,182', text:'#f9a8d4' },
  { from:'#facc15', to:'#ca8a04', glow:'250,204,21',  text:'#fde68a' },
];

// Material Symbols icon mapping — MLM (0–9) and IA (10–19)
const MLM_ICONS = [
  'diversity_3',      // Liderança e Equipes
  'person_search',    // Prospecção / Captação
  'badge',            // Marca Pessoal
  'sell',             // Vendas Diretas
  'hub',              // Redes Sociais
  'psychology',       // Mentalidade / Performance
  'school',           // Duplicação / Treinamento
  'savings',          // Finanças Pessoais
  'event',            // Eventos / Convenções
  'verified',         // Compliance / Ética
];
const IA_ICONS = [
  'manage_search',    // IA para Prospecção
  'auto_awesome',     // Automação
  'smart_toy',        // Chatbots / Assistentes
  'auto_stories',     // IA para Conteúdo
  'analytics',        // Analytics / Dados
  'build',            // Ferramentas IA
  'code',             // Prompt Engineering
  'trending_up',      // IA para Vendas
  'model_training',   // Machine Learning
  'policy',           // Ética em IA
];

const getSectorIcon = (index: number) =>
  index < 10 ? (MLM_ICONS[index] ?? 'star') : (IA_ICONS[index - 10] ?? 'star');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });

const formatContent = (content: string) =>
  content.split('\n').map((line, i) => {
    if (line.startsWith('## '))
      return <h2 key={i} className="font-headline text-white text-xl font-bold mt-7 mb-3 uppercase tracking-tight">{line.slice(3)}</h2>;
    if (line.startsWith('### '))
      return <h3 key={i} className="font-headline text-white/90 text-base font-semibold mt-5 mb-2">{line.slice(4)}</h3>;
    if (line === '---')
      return <hr key={i} className="border-white/[0.06] my-5" />;
    if (line.startsWith('- '))
      return <li key={i} className="text-white/60 font-body text-sm ml-4 mb-1.5 list-disc leading-relaxed">{line.slice(2)}</li>;
    if (line.trim() === '')
      return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-white/60 font-body text-sm leading-relaxed mb-3">
        {line.split(/(\*\*[^*]+\*\*)/).map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} className="text-white font-semibold">{p.slice(2,-2)}</strong>
            : p
        )}
      </p>
    );
  });

const getViews = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return (Math.abs(h) % 1500) + 120;
};

// ─── Animated counter ─────────────────────────────────────────────────────────
const Counter: React.FC<{ value: number }> = ({ value }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -50px 0px' });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const dur = 1500, start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      if (ref.current) ref.current.textContent = Math.floor(ease * value).toString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);
  return <span ref={ref} className="font-bold font-mono">0</span>;
};


// ─── Main ForumSection ────────────────────────────────────────────────────────
const ForumSection: React.FC = () => {
  const { sectors, articles } = useData();
  const [activeSector, _setActiveSector] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filteredArticles = articles.filter(a =>
    !activeSector || a.sectorId === activeSector
  );

  const displayedArticles = filteredArticles.slice(0, visibleCount);
  const activeSectorObj = sectors.find(s => s.id === activeSector);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } },
  };

  return (
    <section className="relative w-full max-w-[1440px] mx-auto pt-4 pb-24 px-6 md:px-10 font-body text-white/90">

      {/* HEADER */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 mb-12">
        <motion.div
          initial={{ opacity:0, y:-20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#00F0FF] animate-pulse" />
          <span className="font-label text-[10px] tracking-[0.2em] font-semibold uppercase text-primary">
            HUB DE CONHECIMENTO
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:0.1 }}
          className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-2xl"
        >
          Insights & Fóruns
        </motion.h2>

        <motion.p
          initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:0.2 }}
          className="text-white/40 text-sm md:text-base max-w-xl font-light"
        >
          Tutoriais, artigos e insights estratégicos curados pelos instrutores da ATL Academy.
        </motion.p>
      </div>



      {/* Active filter badge */}
      <AnimatePresence>
        {activeSectorObj && (
          <motion.div
            initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="text-white/25 font-label text-[9px] tracking-[0.15em] uppercase">Filtrando por</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/8 font-label text-[8px] tracking-[0.15em] uppercase text-primary font-bold">
              <span className="w-1 h-1 rounded-full bg-primary" />
              {activeSectorObj.name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ARTICLES GRID ────────────────────────────────────────────────────── */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-white/10 text-6xl mb-4 block">article</span>
          <p className="text-white/20 font-label tracking-widest uppercase text-sm">Nenhum insight publicado neste setor ainda.</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={activeSector ?? 'all'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {displayedArticles.map((article, i) => {
              const sector = sectors.find(s => s.id === article.sectorId);
              const sIdx = sector ? sectors.indexOf(sector) : 0;
              const p = PALETTES[sIdx % PALETTES.length];
              const icon = getSectorIcon(sIdx);
              const snippet = article.content
                .replace(/\*\*/g,'').replace(/^#+\s/gm,'').replace(/^---$/gm,'')
                .split('\n').filter((l: string) => l.trim()).slice(0,2).join(' ');
              const views = getViews(article.id);

              return (
                <motion.div
                  layout
                  key={article.id}
                  variants={itemVariants}
                  initial={{ opacity:0, y:30 }}
                  animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, scale:0.95 }}
                  whileHover={{ y:-6 }}
                  transition={{ duration:0.4, delay: i * 0.04 }}
                  onClick={() => setSelectedArticle(article)}
                  className="group cursor-pointer rounded-[2rem] flex flex-col justify-between overflow-hidden"
                  style={{
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(48px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(48px) saturate(160%)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    boxShadow: '0 2px 0 0 rgba(255,255,255,0.05) inset, 0 24px 60px rgba(0,0,0,0.5)',
                    transition: 'border 0.3s, box-shadow 0.3s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.border = `1px solid rgba(${p.glow},0.3)`;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 0 0 rgba(255,255,255,0.07) inset, 0 24px 60px rgba(0,0,0,0.6), 0 0 40px -8px rgba(${p.glow},0.2)`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.07)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 0 0 rgba(255,255,255,0.05) inset, 0 24px 60px rgba(0,0,0,0.5)';
                  }}
                >
                  {/* Glass shimmer top edge */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.12) 60%, transparent 100%)',
                    pointerEvents: 'none',
                  }} />
                  {/* Subtle glow orb top-right */}
                  <div style={{
                    position: 'absolute', top: -40, right: -40, width: 120, height: 120,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, rgba(${p.glow},0.08) 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />

                  <div className="p-6 md:p-7">
                    {/* Top row: icon + badge */}
                    <div className="flex justify-between items-start mb-5">
                      <div style={{
                        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                        background: `linear-gradient(135deg, rgba(${p.glow},0.15) 0%, rgba(${p.glow},0.05) 100%)`,
                        border: `1px solid rgba(${p.glow},0.2)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 16px rgba(${p.glow},0.15)`,
                      }}>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 20, color: p.text, fontVariationSettings: "'FILL' 1, 'wght' 500" }}
                        >
                          {icon}
                        </span>
                      </div>
                      {sector && (
                        <span style={{
                          color: p.text,
                          background: `rgba(${p.glow},0.07)`,
                          border: `1px solid rgba(${p.glow},0.18)`,
                          fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em',
                          borderRadius: 20, padding: '4px 10px',
                          backdropFilter: 'blur(8px)',
                        }}>
                          {sector.name.length > 18 ? sector.name.slice(0, 18) + '…' : sector.name}
                        </span>
                      )}
                    </div>

                    <h3 className="font-headline text-base font-bold text-white mb-2.5 leading-snug group-hover:text-primary transition-colors duration-300 uppercase tracking-tight">
                      {article.title}
                    </h3>
                    <p className="text-white/35 text-[13px] line-clamp-2 leading-relaxed font-light">
                      {snippet}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="px-6 md:px-7 pb-6 pt-4 mt-auto"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span className="material-symbols-outlined text-[14px] text-white/30">person</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-white/60">{article.author}</span>
                          <span className="text-[9px] text-white/20 uppercase tracking-widest">{formatDate(article.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <span style={{ color: p.text }} className="text-[13px] font-mono font-bold">
                            <Counter value={views} />
                          </span>
                          <span className="text-[8px] text-white/20 uppercase tracking-[0.2em]">views</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88] shadow-[0_0_6px_#00FF88] animate-pulse" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Load more */}
      {visibleCount < filteredArticles.length && (
        <motion.div
          initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}
          className="w-full flex justify-center mt-12"
        >
          <motion.button
            whileHover={{ scale:1.05 }}
            whileTap={{ scale:0.97 }}
            onClick={() => setVisibleCount(prev => prev + 3)}
            className="relative px-8 py-3 rounded-full font-label text-[11px] tracking-[0.2em] font-bold text-white uppercase border border-white/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 flex items-center gap-2"
          >
            Ver Mais Artigos
            <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </motion.button>
        </motion.div>
      )}

      {/* ── ARTICLE MODAL ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 pt-16 md:p-8 bg-black/80 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ scale:0.96, y:40 }} animate={{ scale:1, y:0 }} exit={{ scale:0.96, y:40 }}
              transition={{ duration:0.35, ease:'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="bg-[#050B14] border border-primary/25 shadow-[0_0_60px_rgba(0,240,255,0.1)] rounded-[2rem] max-w-5xl w-full relative overflow-hidden my-auto"
            >
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors z-10"
              >
                <span className="material-symbols-outlined text-white/50 text-base">close</span>
              </button>

              <div className="flex flex-col md:flex-row">
                {/* Sidebar */}
                <div className="md:w-72 lg:w-80 shrink-0 p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/8 flex flex-col gap-5 bg-white/[0.015]">
                  {(() => {
                    const sector = sectors.find(s => s.id === selectedArticle.sectorId);
                    const sIdx = sector ? sectors.indexOf(sector) : 0;
                    const p = PALETTES[sIdx % PALETTES.length];
                    const icon = getSectorIcon(sIdx);
                    return (
                      <>
                        <div style={{
                          width:52, height:52, borderRadius:16,
                          background:`linear-gradient(135deg, ${p.from}, ${p.to})`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          boxShadow:`0 6px 24px rgba(${p.glow},0.5)`,
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize:26, color:'#fff', fontVariationSettings:"'FILL' 1, 'wght' 400" }}>
                            {icon}
                          </span>
                        </div>
                        {sector && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label text-[8px] tracking-[0.2em] uppercase font-bold w-fit"
                            style={{ color:p.text, background:`rgba(${p.glow},0.1)`, border:`1px solid rgba(${p.glow},0.25)` }}>
                            {sector.name}
                          </span>
                        )}
                      </>
                    );
                  })()}
                  <h2 className="font-headline text-2xl md:text-3xl font-bold text-white leading-tight pr-6 uppercase">
                    {selectedArticle.title}
                  </h2>
                  <div className="flex flex-col gap-2 pt-4 border-t border-white/8 mt-auto md:mt-10">
                    <span className="text-white/40 font-label text-[10px] tracking-widest uppercase">{selectedArticle.author}</span>
                    <span className="text-white/25 font-label text-[10px]">{formatDate(selectedArticle.createdAt)}</span>
                    <div className="flex items-center gap-2 text-primary mt-4 font-label text-[10px] tracking-[0.1em] uppercase">
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      {getViews(selectedArticle.id)} Views
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 md:p-10 overflow-y-auto max-h-[70vh]">
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
