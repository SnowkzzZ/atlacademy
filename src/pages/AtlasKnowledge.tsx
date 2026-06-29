import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface KnowledgeEntry {
    id: string;
    service: string;
    category: string;
    question: string;
    answer: string;
    approved: boolean;
    createdBy: string;
    createdAt: number;
    helpful_count: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const SERVICES = [
    { name: 'ATL Service',    icon: 'support_agent',  color: 'text-primary border-primary/20 bg-primary/5' },
    { name: 'ATL Energy',     icon: 'bolt',           color: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5' },
    { name: 'ATL Seguros',    icon: 'shield',         color: 'text-blue-400 border-blue-400/20 bg-blue-400/5' },
    { name: 'ATL Consórcios', icon: 'group',          color: 'text-purple-400 border-purple-400/20 bg-purple-400/5' },
    { name: 'ATL Academy',    icon: 'school',         color: 'text-green-400 border-green-400/20 bg-green-400/5' },
];

const CATEGORIES = ['geral', 'produto', 'comercial', 'técnico', 'cadastro', 'financeiro'];

function serviceColor(name: string) {
    return SERVICES.find(s => s.name === name)?.color || 'text-white/60 border-white/10 bg-white/5';
}
function serviceIcon(name: string) {
    return SERVICES.find(s => s.name === name)?.icon || 'help';
}

// ─── Formulário de novo registro ──────────────────────────────────────────────
const NewEntryForm: React.FC<{ service: string; onSaved: () => void }> = ({ service, onSaved }) => {
    const [question,  setQuestion]  = useState('');
    const [answer,    setAnswer]    = useState('');
    const [category,  setCategory]  = useState('geral');
    const [createdBy, setCreatedBy] = useState('');
    const [saving,    setSaving]    = useState(false);
    const [done,      setDone]      = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !answer.trim()) return;
        setSaving(true);
        await supabase.from('atlas_knowledge').insert({
            service,
            category,
            question: question.trim(),
            answer: answer.trim(),
            createdBy: createdBy.trim() || 'Atendente',
            approved: false,
        });
        setSaving(false);
        setDone(true);
        setQuestion(''); setAnswer(''); setCategory('geral'); setCreatedBy('');
        setTimeout(() => { setDone(false); onSaved(); }, 2000);
    };

    return (
        <form onSubmit={handleSubmit} className="liquid-glass-soft rounded-3xl border-white/5 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-[18px]">add_circle</span>
                <span className="font-label text-[10px] uppercase tracking-[0.3em] text-primary/70">Novo registro</span>
            </div>

            <div>
                <label className="font-label text-[9px] uppercase tracking-widest text-white/30 block mb-1.5">Seu nome</label>
                <input
                    value={createdBy}
                    onChange={e => setCreatedBy(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/40 transition-colors"
                />
            </div>

            <div>
                <label className="font-label text-[9px] uppercase tracking-widest text-white/30 block mb-1.5">Categoria</label>
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={`px-3 py-1 rounded-full font-label text-[9px] font-semibold uppercase tracking-wider border transition-all duration-200 ${category === cat ? 'bg-primary text-black border-primary' : 'text-white/30 border-white/10 hover:text-white hover:border-white/20'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="font-label text-[9px] uppercase tracking-widest text-white/30 block mb-1.5">Pergunta / Erro encontrado</label>
                <textarea
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    rows={2}
                    placeholder="Qual foi a dúvida ou o erro que chegou?"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/40 transition-colors resize-none"
                    required
                />
            </div>

            <div>
                <label className="font-label text-[9px] uppercase tracking-widest text-white/30 block mb-1.5">Resposta correta</label>
                <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    rows={3}
                    placeholder="Qual é a resposta ou solução correta?"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/40 transition-colors resize-none"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={saving || done || !question.trim() || !answer.trim()}
                className={`w-full py-3 rounded-2xl font-label text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${done ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-primary/10 hover:bg-primary hover:text-black border border-primary/20 hover:border-primary text-primary hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] disabled:opacity-40'}`}
            >
                <span className="material-symbols-outlined text-[15px]">
                    {done ? 'check_circle' : saving ? 'progress_activity' : 'send'}
                </span>
                {done ? 'Enviado para revisão!' : saving ? 'Enviando...' : 'Enviar para a Atlas'}
            </button>

            <p className="text-white/20 text-[10px] text-center">Registros passam por revisão antes de entrar na Atlas</p>
        </form>
    );
};

// ─── Card de conhecimento ─────────────────────────────────────────────────────
const KnowledgeCard: React.FC<{ entry: KnowledgeEntry; index: number }> = ({ entry, index }) => {
    const [open, setOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
            className="liquid-glass-soft rounded-2xl border-white/5 hover:border-primary/15 transition-all duration-300"
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full text-left p-5 flex items-start gap-4"
            >
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-[15px]">help_outline</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-label text-[8px] uppercase tracking-widest text-white/25 border border-white/10 px-2 py-0.5 rounded-full">
                            {entry.category}
                        </span>
                    </div>
                    <p className="text-white/80 text-sm font-medium leading-snug line-clamp-2">{entry.question}</p>
                </div>
                <span className={`material-symbols-outlined text-white/20 text-[18px] shrink-0 mt-1 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-0 border-t border-white/[0.05]">
                            <div className="flex items-center gap-2 mt-4 mb-2">
                                <span className="material-symbols-outlined text-green-400 text-[15px]">check_circle</span>
                                <span className="font-label text-[8px] uppercase tracking-widest text-green-400/70">Resposta Atlas</span>
                            </div>
                            <p className="text-white/60 text-sm leading-relaxed">{entry.answer}</p>
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-white/20 text-[10px]">por {entry.createdBy}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ─── Página principal ─────────────────────────────────────────────────────────
const AtlasKnowledge: React.FC = () => {
    const [entries,        setEntries]        = useState<KnowledgeEntry[]>([]);
    const [loading,        setLoading]        = useState(true);
    const [activeService,  setActiveService]  = useState(SERVICES[0].name);
    const [activeCategory, setActiveCategory] = useState('todos');
    const [showForm,       setShowForm]       = useState(false);
    const [search,         setSearch]         = useState('');

    const load = async () => {
        const { data } = await supabase
            .from('atlas_knowledge')
            .select('*')
            .eq('approved', true)
            .order('createdAt', { ascending: false });
        setEntries((data as KnowledgeEntry[]) || []);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const serviceEntries = useMemo(() =>
        entries.filter(e => e.service === activeService),
    [entries, activeService]);

    const filtered = useMemo(() => {
        let list = serviceEntries;
        if (activeCategory !== 'todos') list = list.filter(e => e.category === activeCategory);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(e => e.question.toLowerCase().includes(q) || e.answer.toLowerCase().includes(q));
        }
        return list;
    }, [serviceEntries, activeCategory, search]);

    const categoriesInService = useMemo(() => {
        const cats = [...new Set(serviceEntries.map(e => e.category))];
        return cats;
    }, [serviceEntries]);

    const totalByService = useMemo(() => {
        const map: Record<string, number> = {};
        entries.forEach(e => { map[e.service] = (map[e.service] || 0) + 1; });
        return map;
    }, [entries]);

    return (
        <div className="bg-[#030303] text-white/90 min-h-screen font-body relative overflow-x-hidden">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[#030303]" />
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-3xl" />
                <div className="dot-grid absolute inset-0 opacity-[0.03]" />
            </div>

            <Navbar />

            <main className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-32 md:pt-40 pb-24">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.16,1,0.3,1] }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
                        <span className="font-label text-[10px] tracking-[4px] uppercase text-primary/80">Inteligência Contínua</span>
                    </div>
                    <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50">
                        Base da Atlas
                    </h1>
                    <p className="text-white/40 text-sm md:text-base mt-4 max-w-2xl leading-relaxed">
                        Cada registro que você faz aqui ensina a Atlas. Com o tempo, ela resolve mais casos sozinha — e você só é acionado quando realmente importa.
                    </p>
                </motion.div>

                {/* Serviços */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1, ease: [0.16,1,0.3,1] }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10"
                >
                    {SERVICES.map(svc => (
                        <button
                            key={svc.name}
                            onClick={() => { setActiveService(svc.name); setActiveCategory('todos'); setSearch(''); }}
                            className={`p-4 rounded-2xl border text-left transition-all duration-300 ${activeService === svc.name ? svc.color : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}
                        >
                            <span className={`material-symbols-outlined text-[22px] block mb-2 ${activeService === svc.name ? '' : 'text-white/25'}`}>
                                {svc.icon}
                            </span>
                            <p className={`font-label text-[9px] font-bold uppercase tracking-wider leading-tight ${activeService === svc.name ? '' : 'text-white/30'}`}>
                                {svc.name.replace('ATL ', '')}
                            </p>
                            <p className={`font-headline text-lg font-bold mt-1 ${activeService === svc.name ? '' : 'text-white/20'}`}>
                                {totalByService[svc.name] || 0}
                                <span className="font-label text-[9px] font-normal ml-1 opacity-60">casos</span>
                            </p>
                        </button>
                    ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Coluna principal */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Filtros + busca */}
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setActiveCategory('todos')}
                                    className={`px-4 py-1.5 rounded-full font-label text-[9px] font-semibold uppercase tracking-wider border transition-all duration-200 ${activeCategory === 'todos' ? 'bg-primary text-black border-primary' : 'text-white/30 border-white/10 hover:text-white'}`}
                                >
                                    Todos
                                </button>
                                {categoriesInService.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-4 py-1.5 rounded-full font-label text-[9px] font-semibold uppercase tracking-wider border transition-all duration-200 ${activeCategory === cat ? 'bg-primary text-black border-primary' : 'text-white/30 border-white/10 hover:text-white'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <div className="relative sm:ml-auto">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-[16px]">search</span>
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar..."
                                    className="bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/30 transition-colors w-48"
                                />
                            </div>
                        </div>

                        {/* Lista */}
                        {loading ? (
                            <div className="py-16 flex flex-col items-center gap-4">
                                <div className="w-10 h-10 rounded-full border-t-2 border-primary border-r-2 animate-spin" />
                                <p className="text-white/30 font-label text-[10px] uppercase tracking-widest">Carregando base...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="liquid-glass-soft rounded-3xl border-white/5 p-16 text-center">
                                <span className="material-symbols-outlined text-white/10 text-5xl block mb-3">psychology</span>
                                <p className="text-white/30 font-label text-[10px] uppercase tracking-widest">Nenhum registro ainda</p>
                                <p className="text-white/15 text-xs mt-2">Seja o primeiro a ensinar a Atlas sobre {activeService}.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filtered.map((entry, i) => (
                                    <KnowledgeCard key={entry.id} entry={entry} index={i} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Coluna lateral — formulário */}
                    <div className="space-y-4">
                        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${serviceColor(activeService)}`}>
                            <span className={`material-symbols-outlined text-[20px]`}>{serviceIcon(activeService)}</span>
                            <div>
                                <p className="font-label text-[8px] uppercase tracking-widest opacity-60">Registrando para</p>
                                <p className="font-headline text-sm font-bold">{activeService}</p>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {showForm ? (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <NewEntryForm service={activeService} onSaved={() => { load(); setShowForm(false); }} />
                                </motion.div>
                            ) : (
                                <motion.button
                                    key="btn"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    onClick={() => setShowForm(true)}
                                    className="w-full py-4 rounded-2xl font-label text-[10px] font-bold tracking-[0.2em] uppercase bg-primary/10 hover:bg-primary hover:text-black border border-primary/20 hover:border-primary text-primary transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    Ensinar a Atlas
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* Info */}
                        <div className="liquid-glass-soft rounded-2xl border-white/5 p-5 space-y-4">
                            <p className="font-label text-[9px] uppercase tracking-widest text-white/30">Como funciona</p>
                            {[
                                { icon: 'edit_note',      text: 'Atendente registra a pergunta e a resposta correta' },
                                { icon: 'fact_check',     text: 'Equipe valida o conteúdo antes de entrar na Atlas' },
                                { icon: 'psychology',     text: 'Atlas usa o registro em futuros atendimentos' },
                                { icon: 'trending_up',    text: 'Com o tempo, menos casos chegam para humanos' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary/50 text-[16px] mt-0.5">{item.icon}</span>
                                    <p className="text-white/30 text-xs leading-relaxed">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AtlasKnowledge;
