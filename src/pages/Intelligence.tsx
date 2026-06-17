import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useData } from '../context/DataContext';
import NewsletterPlaceholder from '../components/NewsletterPlaceholder';

// ─── Palettes ─────────────────────────────────────────────────────────────────
const PALETTES = [
  { from: '#00F0FF', to: '#0099cc', glow: '0,240,255',  text: '#00F0FF', bg: 'rgba(0,240,255,0.08)'  },
  { from: '#a78bfa', to: '#7c3aed', glow: '167,139,250',text: '#c4b5fd', bg: 'rgba(167,139,250,0.08)'},
  { from: '#34d399', to: '#059669', glow: '52,211,153', text: '#6ee7b7', bg: 'rgba(52,211,153,0.08)' },
  { from: '#fb923c', to: '#ea580c', glow: '251,146,60', text: '#fdba74', bg: 'rgba(251,146,60,0.08)' },
  { from: '#f472b6', to: '#db2777', glow: '244,114,182',text: '#f9a8d4', bg: 'rgba(244,114,182,0.08)'},
  { from: '#facc15', to: '#ca8a04', glow: '250,204,21', text: '#fde68a', bg: 'rgba(250,204,21,0.08)' },
];
const MLM_ICONS = [
  'diversity_3','person_search','badge','sell','hub',
  'psychology','school','savings','event','verified',
];
const IA_ICONS = [
  'manage_search','auto_awesome','smart_toy','auto_stories','analytics',
  'build','code','trending_up','model_training','policy',
];
const getSectorIcon = (index: number) =>
  index < 10 ? (MLM_ICONS[index] ?? 'star') : (IA_ICONS[index - 10] ?? 'star');
const CAT_COLORS: Record<string,string> = {
  'IA': 'text-primary border-primary/30 bg-primary/5',
  'MLM': 'text-purple-400 border-purple-400/30 bg-purple-400/5',
  'Negócios': 'text-amber-400 border-amber-400/30 bg-amber-400/5',
  'Tecnologia': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  'Mercado': 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  'Geral': 'text-white/50 border-white/20 bg-white/5',
};

// ─── Markdown renderer ────────────────────────────────────────────────────────
const formatContent = (content: string) => {
  return content.split('\n').map((line, i) => {
    if (line.startsWith('## '))
      return <h2 key={i} className="font-headline text-white text-xl font-bold mt-8 mb-3 uppercase tracking-tight">{line.slice(3)}</h2>;
    if (line.startsWith('### '))
      return <h3 key={i} className="font-headline text-white/90 text-base font-semibold mt-5 mb-2">{line.slice(4)}</h3>;
    if (line === '---')
      return <hr key={i} className="border-white/[0.06] my-6" />;
    if (line.startsWith('- '))
      return <li key={i} className="text-white/65 font-body text-sm ml-4 mb-1.5 list-disc leading-relaxed">{line.slice(2).replace(/\*\*(.*?)\*\*/g, (_,m)=>m)}</li>;
    if (line.trim() === '')
      return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-white/65 font-body text-sm leading-relaxed mb-3">
        {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j} className="text-white font-semibold">{part.slice(2,-2)}</strong>
            : part
        )}
      </p>
    );
  });
};

// ─── Article Modal ────────────────────────────────────────────────────────────
const ArticleModal: React.FC<{
  article: any;
  sector: any;
  onClose: () => void;
}> = ({ article, sector, onClose }) => {
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110]"
      />
      <div className="fixed inset-0 z-[120] flex items-start md:items-center justify-center p-4 pt-16 md:p-8 overflow-y-auto pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-neutral-950/90 border border-white/[0.08] backdrop-blur-[40px] pointer-events-auto my-4 overflow-hidden rounded-[2.5rem] shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02] hover:bg-white/10 transition-colors z-10"
          >
            <span className="material-symbols-outlined text-white/50 text-base">close</span>
          </button>
          <div className="flex flex-col md:flex-row">
            <div className="md:w-72 lg:w-80 shrink-0 p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/[0.06] flex flex-col gap-5 bg-white/[0.01]">
              {sector && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 font-label text-[8px] tracking-[0.2em] uppercase text-primary w-fit font-bold">
                  <span className="w-1 h-1 rounded-full bg-primary" />{sector.name}
                </span>
              )}
              <h2 className="font-headline text-xl md:text-2xl font-bold text-white leading-snug pr-4 uppercase">
                {article.title}
              </h2>
              <div className="flex flex-col gap-2 pt-5 border-t border-white/[0.06] mt-4">
                <span className="text-white/40 font-label text-[9px] tracking-widest uppercase font-semibold">Publicado por</span>
                <span className="text-white/80 font-headline text-sm font-semibold uppercase">{article.author}</span>
                <span className="text-white/30 font-label text-[9px] mt-1">{formatDate(article.createdAt)}</span>
              </div>
            </div>
            <div className="flex-1 p-8 md:p-10 overflow-y-auto max-h-[65vh]">
              <div className="prose prose-invert prose-sm max-w-none">
                {formatContent(article.content)}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

// ─── Newsletter Modal ─────────────────────────────────────────────────────────
const NewsletterModal: React.FC<{ item: any; onClose: () => void }> = ({ item, onClose }) => {
  const catClass = CAT_COLORS[item.category] ?? CAT_COLORS['Geral'];
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
  return (
    <>
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110]"
      />
      <div className="fixed inset-0 z-[120] flex items-start md:items-center justify-center p-4 pt-16 md:p-8 overflow-y-auto pointer-events-none">
        <motion.div
          initial={{ opacity:0, y:30, scale:0.98 }}
          animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:30, scale:0.98 }}
          transition={{ duration:0.4, ease:[0.16,1,0.3,1] }}
          className="relative w-full max-w-3xl bg-neutral-950/90 border border-white/[0.08] backdrop-blur-[40px] pointer-events-auto my-4 overflow-hidden rounded-[2.5rem] shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-6 right-6 w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02] hover:bg-white/10 transition-colors z-10">
            <span className="material-symbols-outlined text-white/50 text-base">close</span>
          </button>
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-label text-[8px] tracking-[0.2em] uppercase font-bold ${catClass}`}>
                {item.category}
              </span>
              {item.tag && (
                <span className="text-white/30 font-label text-[9px] tracking-widest uppercase">{item.tag}</span>
              )}
              {item.readTime && (
                <span className="text-white/25 font-label text-[9px]">{item.readTime} min leitura</span>
              )}
            </div>
            <h2 className="font-headline text-2xl md:text-3xl font-bold text-white leading-tight uppercase mb-4">
              {item.title}
            </h2>
            <p className="text-white/50 font-body text-sm mb-8 leading-relaxed border-b border-white/[0.06] pb-8">
              {item.summary}
            </p>
            <div className="prose prose-invert prose-sm max-w-none">
              {formatContent(item.content)}
            </div>
            <p className="text-white/25 font-label text-[9px] mt-8 pt-6 border-t border-white/[0.06]">
              Publicado em {formatDate(item.publishedAt)}
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Intelligence: React.FC = () => {
  const { sectors, articles, newsletters } = useData();
  const [activeSector, setActiveSector] = useState<any | null>(null);
  const [_activeSectorIdx, setActiveSectorIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'setores' | 'newsletter'>('setores');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [selectedNewsletter, setSelectedNewsletter] = useState<string | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  const openArticle = articles.find(a => a.id === selectedArticle);
  const openNewsletter = newsletters?.find(n => n.id === selectedNewsletter);

  const updateArrows = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows);
    updateArrows();
    return () => el.removeEventListener('scroll', updateArrows);
  }, [updateArrows, sectors]);

  const scroll = (dir: 'left' | 'right') =>
    carouselRef.current?.scrollBy({ left: dir === 'left' ? -310 : 310, behavior: 'smooth' });

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });

  const filteredArticles = activeSector
    ? articles.filter(a => a.sectorId === activeSector.id)
    : articles;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
  };
  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <div className="min-h-screen bg-black text-white relative selection:bg-primary/30 selection:text-white">

      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="dot-grid absolute inset-0 opacity-[0.02]" />
      </div>

      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-44 md:pb-20 px-6 md:px-10 text-center overflow-hidden">
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
            Tutoriais, insights e notícias curados para profissionais de IA e marketing multinível.
          </p>
        </motion.div>
      </section>

      {/* Tab switcher */}
      <div className="px-6 md:px-10 max-w-[1440px] mx-auto mb-10 relative z-10">
        <div className="inline-flex items-center p-1 rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm">
          {(['setores', 'newsletter'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-2.5 rounded-xl font-label text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-300 ${
                activeTab === tab
                  ? 'text-black'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-xl bg-white"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">
                {tab === 'setores' ? 'Insights & Fóruns' : 'Newsletter'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── SETORES TAB ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'setores' && (
          <motion.div
            key="setores"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="px-6 md:px-10 max-w-[1440px] mx-auto relative z-10 pb-24"
          >
            {/* Section header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-0.5 h-5 rounded-full bg-gradient-to-b from-primary to-purple-500" />
                <span className="font-label text-[10px] tracking-[0.18em] uppercase text-white/35 font-semibold">
                  Especializações
                </span>
              </div>
              <h2 className="font-headline text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">
                Setores de Inteligência
              </h2>
            </div>

            {/* ── Liquid Glass Carousel ── */}
            <div className="relative mb-14">
              {/* Left arrow */}
              <button
                onClick={() => scroll('left')}
                disabled={!canLeft}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full
                  backdrop-blur-xl border flex items-center justify-center text-lg
                  transition-all duration-200
                  ${canLeft
                    ? 'bg-white/[0.06] border-white/10 text-white hover:bg-primary/20 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] cursor-pointer'
                    : 'opacity-0 pointer-events-none'
                  }`}
                style={{ left: -20 }}
              >‹</button>

              {/* Cards */}
              <div
                ref={carouselRef}
                onScroll={updateArrows}
                className="flex gap-4 overflow-x-auto pb-3 pt-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory' }}
              >
                {sectors.map((sector, i) => {
                  const p = PALETTES[i % PALETTES.length];
                  const isActive = activeSector?.id === sector.id;
                  return (
                    <motion.button
                      key={sector.id}
                      whileHover={{ y: -5, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveSector(isActive ? null : sector);
                        setActiveSectorIdx(i);
                      }}
                      style={{
                        minWidth: 'clamp(220px, 24vw, 272px)',
                        maxWidth: 'clamp(220px, 24vw, 272px)',
                        scrollSnapAlign: 'start',
                        background: isActive
                          ? `linear-gradient(135deg, rgba(${p.glow},0.18) 0%, rgba(${p.glow},0.06) 100%)`
                          : 'linear-gradient(135deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.015) 100%)',
                        backdropFilter: 'blur(24px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                        border: `1px solid ${isActive ? `rgba(${p.glow},0.5)` : 'rgba(255,255,255,0.09)'}`,
                        borderRadius: 20,
                        padding: '22px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        position: 'relative',
                        overflow: 'hidden',
                        flexShrink: 0,
                        height: 188,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: isActive
                          ? `0 16px 48px rgba(${p.glow},0.2), 0 0 0 1px rgba(${p.glow},0.12) inset`
                          : '0 4px 24px rgba(0,0,0,0.35)',
                      }}
                    >
                      {/* Glow orb */}
                      <div style={{
                        position: 'absolute', top: -30, right: -30, width: 100, height: 100,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, rgba(${p.glow},${isActive?0.35:0.1}) 0%, transparent 70%)`,
                        pointerEvents: 'none', transition: 'all 0.3s',
                      }} />

                      {/* Top */}
                      <div>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div style={{
                            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                            background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 4px 14px rgba(${p.glow},0.45)`,
                          }}>
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: 17, color: '#fff', fontVariationSettings: "'FILL' 1, 'wght' 500" }}
                            >
                              {getSectorIcon(i)}
                            </span>
                          </div>
                          <span style={{
                            color: p.text, fontSize: 9, fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.12em',
                          }}>
                            {i < 10 ? 'MLM' : 'IA'}
                          </span>
                        </div>
                        <h3 className="font-headline text-white font-bold leading-tight"
                          style={{ fontSize: 13, letterSpacing: '-0.01em' }}>
                          {sector.name}
                        </h3>
                      </div>

                      {/* Bottom */}
                      <div>
                        {(sector as any).description && (
                          <p style={{ color:'rgba(255,255,255,0.48)', fontSize:11, lineHeight:1.55, margin:'8px 0 0' }}>
                            {((sector as any).description as string).length > 72
                              ? ((sector as any).description as string).slice(0, 72) + '...'
                              : (sector as any).description}
                          </p>
                        )}
                        <div className="flex justify-end mt-2">
                          <span style={{ color: p.text, fontSize:11, fontWeight:600, opacity: isActive ? 1 : 0.45, transition:'all 0.25s' }}>
                            {isActive ? 'Selecionado' : 'Explorar'}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Right arrow */}
              <button
                onClick={() => scroll('right')}
                disabled={!canRight}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full
                  backdrop-blur-xl border flex items-center justify-center text-lg
                  transition-all duration-200
                  ${canRight
                    ? 'bg-white/[0.06] border-white/10 text-white hover:bg-primary/20 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] cursor-pointer'
                    : 'opacity-0 pointer-events-none'
                  }`}
                style={{ right: -20 }}
              >›</button>

              {/* Hint */}
              <p className="text-white/20 font-label text-[10px] text-center mt-4 tracking-widest uppercase">
                {sectors.length} setores · clique para filtrar artigos
              </p>
            </div>

            {/* Active sector label */}
            <AnimatePresence>
              {activeSector && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-3 mb-6"
                >
                  <span className="font-label text-[9px] tracking-[0.2em] uppercase text-white/30">Filtrando por</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 font-label text-[8px] tracking-[0.15em] uppercase text-primary font-bold">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    {activeSector.name}
                  </span>
                  <button onClick={() => setActiveSector(null)} className="text-white/30 hover:text-white text-xs transition-colors">
                    × limpar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Articles grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              key={activeSector?.id ?? 'all'}
            >
              {filteredArticles.length === 0 ? (
                <motion.div variants={itemVariants} className="text-center py-32 border border-white/[0.05] rounded-[2.5rem] bg-white/[0.01]">
                  <span className="material-symbols-outlined text-white/15 text-5xl mb-4 block font-light">article</span>
                  <p className="text-white/40 font-headline uppercase text-sm tracking-wider">Nenhum artigo publicado</p>
                  <p className="text-white/25 text-xs mt-1">Este setor será atualizado em breve.</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map(article => {
                    const sector = sectors.find(s => s.id === article.sectorId);
                    const sIdx = sector ? sectors.indexOf(sector) : 0;
                    const p = PALETTES[sIdx % PALETTES.length];
                    return (
                      <motion.div
                        key={article.id}
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                        onClick={() => setSelectedArticle(article.id)}
                        className="p-7 flex flex-col gap-4 cursor-pointer group rounded-[1.75rem] transition-all duration-500 shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.border = `1px solid rgba(${p.glow},0.3)`;
                          (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, rgba(${p.glow},0.07) 0%, rgba(255,255,255,0.01) 100%)`;
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.07)';
                          (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)';
                        }}
                      >
                        {sector && (
                          <span className="inline-flex items-center gap-1.5 w-fit px-3 py-1 rounded-full bg-primary/10 border border-primary/20 font-label text-[8px] tracking-[0.2em] uppercase text-primary font-bold">
                            <span className="w-1 h-1 rounded-full bg-primary" />{sector.name}
                          </span>
                        )}
                        <div className="space-y-2">
                          <h3 className="font-headline text-base md:text-lg font-bold text-white/90 group-hover:text-white transition-colors leading-snug uppercase">
                            {article.title}
                          </h3>
                          <p className="text-white/40 font-body text-xs leading-relaxed line-clamp-3">
                            {article.content.replace(/\*\*/g,'').replace(/^#+\s/gm,'').split('\n').filter(l=>l.trim() && l !== '---').slice(0,3).join(' ')}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.06]">
                          <span className="text-white/30 font-label text-[9px] tracking-widest uppercase font-semibold">{article.author}</span>
                          <span className="text-white/30 font-label text-[9px]">{formatDate(article.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-primary/50 group-hover:text-primary transition-colors">
                          <span className="font-label text-[9px] tracking-[0.2em] uppercase font-bold">Acessar Insight</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ── NEWSLETTER TAB ── */}
        {activeTab === 'newsletter' && (
          <motion.div
            key="newsletter"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="px-6 md:px-10 max-w-[1440px] mx-auto relative z-10 pb-24"
          >
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-0.5 h-5 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
                <span className="font-label text-[10px] tracking-[0.18em] uppercase text-white/35 font-semibold">
                  Notícias & Tendências
                </span>
              </div>
              <h2 className="font-headline text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">
                Newsletter ATL
              </h2>
              <p className="text-white/35 font-body text-sm mt-2">
                As últimas notícias do mercado de IA, MLM e empreendedorismo digital.
              </p>
            </div>

            {!newsletters || newsletters.length === 0 ? (
              <div className="text-center py-32 border border-white/[0.05] rounded-[2.5rem] bg-white/[0.01]">
                <span className="material-symbols-outlined text-white/15 text-5xl mb-4 block font-light">newspaper</span>
                <p className="text-white/40 font-headline uppercase text-sm tracking-wider">Nenhuma notícia publicada</p>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {/* Featured */}
                {newsletters.filter(n => n.featured).slice(0, 1).map(item => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    whileHover={{ y: -3 }}
                    onClick={() => setSelectedNewsletter(item.id)}
                    className="cursor-pointer group rounded-[2rem] transition-all duration-400 overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,240,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(0,240,255,0.15)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(0,240,255,0.3)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(0,240,255,0.15)'; }}
                  >
                    <div className="relative w-full aspect-[3/1] overflow-hidden">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
                      ) : (
                        <NewsletterPlaceholder />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
                    </div>
                    <div className="p-8 md:p-10">
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 font-label text-[8px] tracking-[0.2em] uppercase text-primary font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />⭐ Destaque
                      </span>
                      <span className={`inline-flex px-3 py-1 rounded-full border font-label text-[8px] tracking-[0.15em] uppercase font-bold ${CAT_COLORS[item.category] ?? CAT_COLORS['Geral']}`}>
                        {item.category}
                      </span>
                      {item.tag && <span className="text-white/30 font-label text-[9px] tracking-widest uppercase">{item.tag}</span>}
                    </div>
                    <h3 className="font-headline text-xl md:text-2xl font-bold text-white uppercase leading-tight mb-3 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-white/45 font-body text-sm leading-relaxed mb-5 max-w-3xl">{item.summary}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-primary/60 group-hover:text-primary transition-colors">
                        <span className="font-label text-[9px] tracking-[0.2em] uppercase font-bold">Ler Matéria Completa</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.readTime && <span className="text-white/25 font-label text-[9px]">{item.readTime} min</span>}
                        <span className="text-white/25 font-label text-[9px]">{formatDate(item.publishedAt)}</span>
                      </div>
                    </div>
                    </div>
                  </motion.div>
                ))}

                {/* Regular grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {newsletters.filter(n => !n.featured || newsletters.filter(x=>x.featured).indexOf(n) > 0).map(item => (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedNewsletter(item.id)}
                      className="cursor-pointer group rounded-[1.75rem] transition-all duration-400 flex flex-col overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)'; }}
                    >
                      <div className="relative w-full aspect-[3/2] overflow-hidden shrink-0">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
                        ) : (
                          <NewsletterPlaceholder />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                      </div>
                      <div className="p-6 flex flex-col gap-4 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full border font-label text-[7px] tracking-[0.15em] uppercase font-bold ${CAT_COLORS[item.category] ?? CAT_COLORS['Geral']}`}>
                          {item.category}
                        </span>
                        {item.tag && <span className="text-white/25 font-label text-[8px] tracking-widest uppercase">{item.tag}</span>}
                      </div>
                      <h3 className="font-headline text-sm font-bold text-white/90 group-hover:text-white transition-colors uppercase leading-snug line-clamp-3">
                        {item.title}
                      </h3>
                      <p className="text-white/35 font-body text-xs leading-relaxed line-clamp-3 flex-1">{item.summary}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-auto">
                        <div className="flex items-center gap-1 text-white/30 group-hover:text-primary transition-colors">
                          <span className="font-label text-[8px] tracking-[0.15em] uppercase font-bold">Ler mais</span>
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.readTime && <span className="text-white/20 font-label text-[8px]">{item.readTime}min</span>}
                          <span className="text-white/20 font-label text-[8px]">{formatDate(item.publishedAt)}</span>
                        </div>
                      </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Article modal */}
      <AnimatePresence>
        {openArticle && (
          <ArticleModal
            article={openArticle}
            sector={sectors.find(s => s.id === openArticle.sectorId)}
            onClose={() => setSelectedArticle(null)}
          />
        )}
      </AnimatePresence>

      {/* Newsletter modal */}
      <AnimatePresence>
        {openNewsletter && (
          <NewsletterModal item={openNewsletter} onClose={() => setSelectedNewsletter(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Intelligence;
