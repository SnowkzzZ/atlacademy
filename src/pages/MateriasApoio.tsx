import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useData, type SupportMaterial } from '../context/DataContext';

// Força o download do arquivo (mesmo cross-origin do Storage)
const downloadFile = async (url: string, name: string) => {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = name || 'material';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
    } catch {
        // Fallback: abre em nova aba
        window.open(url, '_blank');
    }
};

const MateriaisApoio: React.FC = () => {
    const { materialCategories, supportMaterials, isLoading } = useData();
    const [activeCat, setActiveCat] = useState<string>('all');

    const sortedCats = useMemo(
        () => [...materialCategories].sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999)),
        [materialCategories]
    );

    const visible = useMemo(() => {
        const list = activeCat === 'all'
            ? supportMaterials
            : supportMaterials.filter(m => m.categoryId === activeCat);
        return [...list].sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999) || b.createdAt - a.createdAt);
    }, [supportMaterials, activeCat]);

    return (
        <div className="bg-[#030303] text-white/90 min-h-screen font-body relative overflow-x-hidden">
            {/* Background glows */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[#030303]" />
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-blue-500/5 blur-3xl" />
                <div className="dot-grid absolute inset-0 opacity-[0.03]" />
            </div>

            <Navbar />

            <main className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-32 md:pt-40 pb-24">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary text-[18px]">download_for_offline</span>
                        <span className="font-label text-[10px] tracking-[4px] uppercase text-primary/80">Central de Divulgação</span>
                    </div>
                    <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50">
                        Materiais de Apoio
                    </h1>
                    <p className="text-white/40 text-sm md:text-base mt-4 max-w-2xl leading-relaxed">
                        Baixe posts e vídeos prontos para divulgar os produtos. Escolha o produto abaixo e faça o download do material que precisar.
                    </p>
                </motion.div>

                {/* Category filter */}
                <div className="flex flex-wrap gap-2 mb-10">
                    <button
                        onClick={() => setActiveCat('all')}
                        className={`px-5 py-2.5 rounded-full font-label text-[10px] font-semibold tracking-[2px] uppercase transition-all duration-300 border ${activeCat === 'all' ? 'bg-primary text-black border-primary shadow-[0_0_20px_rgba(0,240,255,0.25)]' : 'text-white/40 border-white/10 bg-white/[0.02] hover:text-white hover:bg-white/5'}`}
                    >
                        Todos
                    </button>
                    {sortedCats.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCat(cat.id)}
                            className={`px-5 py-2.5 rounded-full font-label text-[10px] font-semibold tracking-[2px] uppercase transition-all duration-300 border flex items-center gap-2 ${activeCat === cat.id ? 'bg-primary text-black border-primary shadow-[0_0_20px_rgba(0,240,255,0.25)]' : 'text-white/40 border-white/10 bg-white/[0.02] hover:text-white hover:bg-white/5'}`}
                        >
                            {cat.icon && <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>}
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="py-24 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-t-2 border-primary border-r-2 animate-spin" />
                        <p className="text-white/30 font-label text-[10px] uppercase tracking-widest">Carregando materiais...</p>
                    </div>
                ) : visible.length === 0 ? (
                    <div className="liquid-glass-soft p-16 text-center border-white/5 rounded-3xl">
                        <span className="material-symbols-outlined text-white/10 text-6xl block mb-4">folder_open</span>
                        <p className="text-white/30 font-label text-[11px] tracking-widest uppercase">Nenhum material disponível ainda</p>
                        <p className="text-white/20 text-xs mt-2">Novos materiais aparecem aqui assim que forem publicados.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {visible.map((m, i) => (
                            <MaterialCard key={m.id} material={m} index={i} categoryName={materialCategories.find(c => c.id === m.categoryId)?.name} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

const MaterialCard: React.FC<{ material: SupportMaterial; index: number; categoryName?: string }> = ({ material, index, categoryName }) => {
    const isVideo = material.type === 'video';
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        if (!material.fileUrl) return;
        setDownloading(true);
        await downloadFile(material.fileUrl, material.fileName || material.title);
        setDownloading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4) }}
            className="liquid-glass-soft rounded-3xl overflow-hidden border-white/5 hover:border-primary/20 transition-all duration-300 group flex flex-col"
        >
            {/* Thumbnail / preview */}
            <div className="relative aspect-[4/3] bg-black/40 overflow-hidden">
                {material.thumbnailUrl ? (
                    <img src={material.thumbnailUrl} alt={material.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/10 text-6xl">{isVideo ? 'movie' : 'image'}</span>
                    </div>
                )}
                {/* Type badge */}
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full font-label text-[9px] font-bold tracking-[2px] uppercase backdrop-blur-md flex items-center gap-1 ${isVideo ? 'bg-purple-500/20 text-purple-200 border border-purple-400/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                    <span className="material-symbols-outlined text-[12px]">{isVideo ? 'play_circle' : 'photo'}</span>
                    {isVideo ? 'Vídeo' : 'Post'}
                </div>
            </div>

            {/* Info */}
            <div className="p-5 flex flex-col flex-1">
                {categoryName && <span className="font-label text-[9px] tracking-widest uppercase text-primary/70 mb-1.5">{categoryName}</span>}
                <h3 className="font-headline text-base font-bold text-white leading-tight line-clamp-2">{material.title}</h3>
                {material.description && <p className="text-white/35 text-xs leading-relaxed mt-2 line-clamp-2 flex-1">{material.description}</p>}

                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="mt-4 w-full bg-white/[0.04] hover:bg-primary hover:text-black border border-white/10 hover:border-primary text-white font-label text-[10px] font-bold tracking-[2px] uppercase py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-[16px]">{downloading ? 'progress_activity' : 'download'}</span>
                    {downloading ? 'Baixando...' : 'Baixar'}
                </button>
            </div>
        </motion.div>
    );
};

export default MateriaisApoio;
