import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

// -----------------------------
// FAKE DATA
// -----------------------------
const CATEGORIES = [
  'Todos',
  'Estratégia Empresarial',
  'Liderança',
  'Finanças',
  'Marketing',
  'Habilidades Tech',
  'Psicologia e Mindset',
  'Produtividade',
  'Cíber-Segurança'
];

interface ForumPost {
  id: number;
  title: string;
  category: string;
  icon: string;
  lastComment: string;
  author: string;
  replies: number;
  lastActivity: string;
  active: boolean;
}

const FORUM_DATA: ForumPost[] = [
  {
    id: 1,
    title: "Como escalar uma operação de infoprodutos?",
    category: "Estratégia Empresarial",
    icon: "monitoring",
    lastComment: "Eu recomendo começar com a estruturação de tráfego pago antes do organ...",
    author: "Felipe G.",
    replies: 124,
    lastActivity: "Há 10 min",
    active: true
  },
  {
    id: 2,
    title: "Melhores métricas para SaaS B2B",
    category: "Finanças",
    icon: "account_balance",
    lastComment: "No nosso time focamos no CAC e LTV. Se a proporção for 1:3, você já tem...",
    author: "Amanda R.",
    replies: 42,
    lastActivity: "Há 2 horas",
    active: true
  },
  {
    id: 3,
    title: "Automatizando fluxos com Python",
    category: "Habilidades Tech",
    icon: "code_blocks",
    lastComment: "Usem as APIs do Notion integradas com a biblioteca Requests, poupa horas...",
    author: "Carlos T.",
    replies: 89,
    lastActivity: "Há 5 min",
    active: true
  },
  {
    id: 4,
    title: "Síndrome do Impostor pós-promoção",
    category: "Psicologia e Mindset",
    icon: "psychology",
    lastComment: "É normal sentir isso. Um truque é documentar todas as pequenas vítorias...",
    author: "Dra. Sônia",
    replies: 215,
    lastActivity: "Há 1 hora",
    active: true
  },
  {
    id: 5,
    title: "Liderando equipes remotas globais",
    category: "Liderança",
    icon: "groups",
    lastComment: "Dailies assíncronas funcionaram muito bem aqui. Ninguém gosta de call...",
    author: "Beto M.",
    replies: 34,
    lastActivity: "Há 3 horas",
    active: false
  },
  {
    id: 6,
    title: "Estratégias de Growth Hacking",
    category: "Marketing",
    icon: "rocket_launch",
    lastComment: "Focamos em loops virais dentro do próprio onboarding do produto...",
    author: "Lucas V.",
    replies: 76,
    lastActivity: "Há 30 min",
    active: true
  },
  {
    id: 7,
    title: "Mitigando ataques DDoS básicos",
    category: "Cíber-Segurança",
    icon: "shield_locked",
    lastComment: "Cloudflare no plano PRO já ajuda muito com as rules de WAF baseadas em...",
    author: "Ana K.",
    replies: 51,
    lastActivity: "Há 1 dia",
    active: false
  },
  {
    id: 8,
    title: "Aumentando o Deep Work diário",
    category: "Produtividade",
    icon: "timer",
    lastComment: "Eu divido o dia em blocos de 90 minutos usando timer visual Pomodoro...",
    author: "Juliano A.",
    replies: 102,
    lastActivity: "Há 12 min",
    active: true
  },
  {
    id: 9,
    title: "Frameworks de Decisão Rápida",
    category: "Estratégia Empresarial",
    icon: "account_tree",
    lastComment: "Árvores de decisão são subestimadas. Desenhar a matriz de risco numa folha...",
    author: "Mariana L.",
    replies: 8,
    lastActivity: "Há 5 dias",
    active: false
  }
];

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
// MAIN COMPONENT
// -----------------------------
const ForumSection: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedForum, setSelectedForum] = useState<ForumPost | null>(null);

  // Filter Data
  const filteredData = FORUM_DATA.filter(post => activeFilter === 'Todos' || post.category === activeFilter);
  const displayedData = filteredData.slice(0, visibleCount);

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
            Comunidade Ativa
          </span>
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-2xl"
        >
          Fóruns de Inteligência
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-white/40 text-sm md:text-base max-w-xl font-light"
        >
          Conecte-se com outros membros da ATL Elite, solucione desafios do dia a dia e evolua de forma colaborativa.
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
        {CATEGORIES.map((cat) => {
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

      {/* FORUM GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
          {displayedData.map((post, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              key={post.id}
              onClick={() => setSelectedForum(post)}
              className="group cursor-pointer bg-[#0A1628]/90 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_15px_40px_-10px_rgba(0,240,255,0.15)]"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:bg-primary/10 group-hover:border-primary/30 flex items-center justify-center transition-colors duration-300">
                    <span className="material-symbols-outlined text-white/50 group-hover:text-primary text-[24px] transition-colors duration-300">
                      {post.icon}
                    </span>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-primary font-label text-[9px] tracking-[0.15em] uppercase font-bold">
                    {post.category}
                  </div>
                </div>

                <h3 className="text-xl font-headline font-bold text-white mb-3 leading-tight group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-white/40 text-sm line-clamp-2 leading-relaxed mb-6 font-light">
                  "{post.lastComment}"
                </p>
              </div>

              {/* CARD FOOTER */}
              <div className="pt-5 border-t border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                    <span className="material-symbols-outlined text-[16px] text-white/50">person</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-white/80">{post.author}</span>
                    <span className="text-[9px] text-white/30 uppercase tracking-widest">{post.lastActivity}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-primary text-[14px]">
                      <AnimatedCounter value={post.replies} />
                    </span>
                    <span className="text-[8px] text-white/30 uppercase tracking-[0.2em]">Respostas</span>
                  </div>
                  
                  {post.active && (
                    <div className="w-2 h-2 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88] animate-pulse" title="Tópico Ativo Agora"></div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* LOAD MORE BUTTON */}
      {visibleCount < filteredData.length && (
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
              Ver Mais Fóruns
              <span className="material-symbols-outlined text-[14px] group-hover:translate-y-0.5 transition-transform">expand_more</span>
            </span>
          </button>
        </motion.div>
      )}

      {/* SIMPLE INTERACTIVE MODAL */}
      <AnimatePresence>
        {selectedForum && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedForum(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#050B14] border border-primary/30 shadow-[0_0_50px_rgba(0,240,255,0.15)] rounded-[2rem] p-8 md:p-12 max-w-2xl w-full relative"
            >
              <button 
                onClick={() => setSelectedForum(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-white/50">close</span>
              </button>
              
              <div className="bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-primary font-label text-[10px] tracking-[0.15em] uppercase font-bold inline-block mb-6">
                {selectedForum.category}
              </div>
              
              <h2 className="text-3xl font-headline font-bold text-white mb-4">
                {selectedForum.title}
              </h2>
              
              <div className="flex items-center gap-3 mb-8 pb-8 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/50">person</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">{selectedForum.author}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">{selectedForum.lastActivity}</div>
                </div>
              </div>
              
              <div className="text-white/70 leading-relaxed font-light space-y-4">
                <p>"{selectedForum.lastComment}..."</p>
                <p className="text-white/30 text-sm italic mt-8 border-l-2 border-primary/30 pl-4 py-2">
                  (Simulação da expansão do tópico no fórum. Em um ambiente real, esta modal buscaria todos os comentários e integrações do banco de dados.)
                </p>
              </div>
              
              <div className="mt-12 w-full flex justify-end">
                <button 
                  onClick={() => setSelectedForum(null)}
                  className="bg-primary hover:bg-[#00E5FF] text-black font-label font-bold px-8 py-3 rounded-xl uppercase tracking-[0.15em] text-[11px] transition-colors"
                >
                  Entrar na Discussão
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
};

export default ForumSection;
