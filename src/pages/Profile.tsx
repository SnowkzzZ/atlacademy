import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Profile: React.FC = () => {
    return (
        <div className="font-body text-white/90 min-h-screen relative bg-[#030303]">
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[#030303]"></div>
                <div className="absolute top-1/4 right-1/4 w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/4 w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-3xl"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.02]"></div>
            </div>

            <Navbar />

            <main className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 py-32 space-y-16">
                <div className="liquid-glass-soft p-12 md:p-16 flex flex-col md:flex-row gap-16 items-center md:items-start relative overflow-hidden">
                    {/* Dynamic glass glow */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="w-48 h-48 rounded-[40px] border border-white/10 p-2 overflow-hidden shrink-0 relative flex items-center justify-center bg-white/[0.02] backdrop-blur-3xl shadow-2xl">
                        <span className="material-symbols-outlined text-white/40 text-[100px] drop-shadow-xl">person</span>
                        <div className="absolute top-4 right-4 w-5 h-5 bg-primary rounded-full border-4 border-[#030303] shadow-[0_0_15px_#00FF87] z-20"></div>
                    </div>

                    <div className="space-y-8 flex-1 text-center md:text-left pt-4">
                        <div>
                            <div className="inline-flex premium-pill mb-6">ID_MEMBRO: #8942-ATL</div>
                            <h1 className="font-headline text-6xl md:text-7xl font-bold tracking-tight text-white mb-4 shadow-black drop-shadow-lg">Agente_X</h1>
                            <p className="text-white/60 font-body text-xl">Arquiteto de Inteligência Cibernética</p>
                        </div>

                        <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-6 border-t border-white/10">
                            <button className="px-8 py-4 bg-white text-black rounded-full font-headline font-bold text-sm tracking-[2px] transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)] uppercase">
                                EDITAR PERFIL
                            </button>
                            <Link to="/login" className="px-8 py-4 liquid-glass-soft rounded-full font-headline text-sm tracking-[2px] transition-all hover:bg-white/10 hover:border-white/20 uppercase flex items-center gap-3">
                                <span className="material-symbols-outlined text-[20px]">logout</span>
                                Sair
                            </Link>
                        </div>
                    </div>
                </div>

                <h2 className="font-headline text-3xl font-bold tracking-tight px-4">Métricas Operacionais</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="liquid-glass-soft p-10 flex flex-col justify-between aspect-square group">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-8 shadow-inner group-hover:bg-primary/20 transition-colors">
                            <span className="material-symbols-outlined text-white/50 text-2xl group-hover:text-primary">military_tech</span>
                        </div>
                        <div>
                            <div className="font-label text-white/40 text-[10px] tracking-[4px] uppercase mb-4">NÍVEL_ATUAL</div>
                            <div className="font-headline text-5xl font-medium tracking-tighter text-white">Nvl <span className="text-primary/90">14</span></div>
                        </div>
                    </div>

                    <div className="liquid-glass-soft p-10 flex flex-col justify-between aspect-square group">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-8 shadow-inner group-hover:bg-blue-500/20 transition-colors">
                            <span className="material-symbols-outlined text-white/50 text-2xl group-hover:text-blue-400">task_alt</span>
                        </div>
                        <div>
                            <div className="font-label text-white/40 text-[10px] tracking-[4px] uppercase mb-4">OPERAÇÕES_CONCLUÍDAS</div>
                            <div className="font-headline text-5xl font-medium tracking-tighter text-white">28</div>
                        </div>
                    </div>

                    <div className="liquid-glass-soft p-10 flex flex-col justify-between aspect-square group">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-8 shadow-inner group-hover:bg-purple-500/20 transition-colors">
                            <span className="material-symbols-outlined text-white/50 text-2xl group-hover:text-purple-400">workspace_premium</span>
                        </div>
                        <div>
                            <div className="font-label text-white/40 text-[10px] tracking-[4px] uppercase mb-4">PONTOS_DE_EXP</div>
                            <div className="font-headline text-5xl font-medium tracking-tighter text-white">1,450</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;
