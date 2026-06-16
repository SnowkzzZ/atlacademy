import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';

const Profile: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const { courses } = useData();
    const navigate = useNavigate();

    const handleLogout = async () => {
        // Remove admin bypass if present
        localStorage.removeItem('atl_admin_is_master');
        await supabase.auth.signOut();
        navigate('/login');
    };

    // Extract display name — prefer full_name from metadata, fallback to email prefix
    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
    const emailPrefix = user?.email ? user.email.split('@')[0] : 'Usuário';
    const displayName = fullName || emailPrefix;
    const displayEmail = user?.email || (isAdmin ? 'admin@atl.academy' : '');

    // Real stats from courses
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.progress === 100).length;
    const totalWatchedSeconds = courses.reduce((acc, c) => acc + (c.watchedSeconds || 0), 0);
    const totalHours = Math.floor(totalWatchedSeconds / 3600);
    const totalMinutes = Math.floor((totalWatchedSeconds % 3600) / 60);
    const overallProgress = totalCourses > 0
        ? Math.round(courses.reduce((acc, c) => acc + (c.progress || 0), 0) / totalCourses)
        : 0;

    return (
        <div className="font-body text-white/90 min-h-screen relative bg-black">
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-black"></div>
                <div className="absolute top-1/4 right-1/4 w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/4 w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-3xl"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.02]"></div>
            </div>

            <Navbar />

            <main className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 pt-28 md:pt-36 pb-20 space-y-12">
                {/* Profile Card */}
                <div className="liquid-glass-soft p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center md:items-start relative overflow-hidden">
                    {/* Dynamic glass glow */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

                    {/* Avatar */}
                    <div className="w-36 h-36 md:w-44 md:h-44 rounded-[2rem] border border-white/10 overflow-hidden shrink-0 relative flex items-center justify-center bg-white/[0.02] backdrop-blur-3xl shadow-2xl">
                        <span className="material-symbols-outlined text-white/40 text-[80px] md:text-[90px] drop-shadow-xl">person</span>
                        <div className="absolute top-3 right-3 w-4 h-4 md:w-5 md:h-5 bg-primary rounded-full border-4 border-black shadow-[0_0_15px_#00F5FF] z-20"></div>
                    </div>

                    <div className="space-y-6 flex-1 text-center md:text-left pt-2">
                        <div>
                            {isAdmin && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full mb-3">
                                    <span className="material-symbols-outlined text-red-400 text-[12px]">admin_panel_settings</span>
                                    <span className="font-label text-[9px] text-red-400 uppercase tracking-widest">Administrador Master</span>
                                </div>
                            )}
                            {!isAdmin && (
                                <div className="inline-flex premium-pill mb-3">Membro ATL Academy</div>
                            )}
                            <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight text-white mb-2 drop-shadow-lg uppercase">
                                {displayName}
                            </h1>
                            {displayEmail && (
                                <p className="text-white/40 font-body text-sm">{displayEmail}</p>
                            )}
                        </div>

                        {/* Overall progress bar */}
                        {!isAdmin && (
                            <div className="space-y-2">
                                <div className="flex justify-between font-label text-[9px] uppercase tracking-widest text-white/30">
                                    <span>Progresso Geral</span>
                                    <span className="text-primary">{overallProgress}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-1000"
                                        style={{ width: `${overallProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-4 border-t border-white/10">
                            <button
                                onClick={handleLogout}
                                className="px-6 py-3 liquid-glass-soft rounded-2xl font-headline text-sm tracking-[2px] transition-all hover:bg-white/10 hover:border-white/20 uppercase flex items-center gap-3"
                            >
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                Sair da Conta
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                {!isAdmin && (
                    <>
                        <h2 className="font-headline text-2xl md:text-3xl font-bold tracking-tight px-2">Suas Métricas</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="liquid-glass-soft p-8 flex flex-col justify-between gap-6 group">
                                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner group-hover:bg-primary/20 transition-colors">
                                    <span className="material-symbols-outlined text-white/50 text-xl group-hover:text-primary transition-colors">layers</span>
                                </div>
                                <div>
                                    <div className="font-label text-white/30 text-[9px] tracking-[4px] uppercase mb-2">Módulos</div>
                                    <div className="font-headline text-4xl font-bold tracking-tighter text-white">{totalCourses}</div>
                                    <div className="font-label text-[9px] text-white/20 mt-1">{completedCourses} concluídos</div>
                                </div>
                            </div>

                            <div className="liquid-glass-soft p-8 flex flex-col justify-between gap-6 group">
                                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner group-hover:bg-blue-500/20 transition-colors">
                                    <span className="material-symbols-outlined text-white/50 text-xl group-hover:text-blue-400 transition-colors">schedule</span>
                                </div>
                                <div>
                                    <div className="font-label text-white/30 text-[9px] tracking-[4px] uppercase mb-2">Tempo Assistido</div>
                                    <div className="font-headline text-4xl font-bold tracking-tighter text-white">
                                        {totalHours > 0 ? `${totalHours}h` : `${totalMinutes}m`}
                                    </div>
                                    <div className="font-label text-[9px] text-white/20 mt-1">
                                        {totalHours > 0 ? `${totalMinutes} min adicionais` : 'de treinamento'}
                                    </div>
                                </div>
                            </div>

                            <div className="liquid-glass-soft p-8 flex flex-col justify-between gap-6 group">
                                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner group-hover:bg-purple-500/20 transition-colors">
                                    <span className="material-symbols-outlined text-white/50 text-xl group-hover:text-purple-400 transition-colors">workspace_premium</span>
                                </div>
                                <div>
                                    <div className="font-label text-white/30 text-[9px] tracking-[4px] uppercase mb-2">Progresso Total</div>
                                    <div className="font-headline text-4xl font-bold tracking-tighter text-white">{overallProgress}<span className="text-white/30 text-2xl">%</span></div>
                                    <div className="font-label text-[9px] text-white/20 mt-1">da plataforma</div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {isAdmin && (
                    <div className="liquid-glass-soft p-8 border-red-500/10 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-400">admin_panel_settings</span>
                            <h2 className="font-headline text-lg font-bold uppercase tracking-wide text-red-400">Acesso Administrativo</h2>
                        </div>
                        <p className="text-white/40 text-sm">Você está logado como Administrador Master. Acesse a Central de Comando para gerenciar o conteúdo da plataforma.</p>
                        <a href="/painel" className="self-start px-6 py-3 bg-white text-black rounded-xl font-headline font-bold text-[10px] tracking-[2px] uppercase hover:bg-primary transition-all">
                            Ir para Central de Comando
                        </a>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Profile;
