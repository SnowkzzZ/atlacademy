import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logoBase64 } from '../logoBase64';

const Login: React.FC = () => {
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        navigate('/');
    };

    return (
        <div className="bg-[#030303] text-on-surface font-body selection:bg-white selection:text-black min-h-screen relative flex items-center justify-center overflow-hidden">

            {/* Immersive background layer */}
            <div className="fixed inset-0 z-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#030303]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl pointer-events-none opacity-60"></div>
                <div className="absolute w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none left-0 bottom-0"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.03]"></div>
            </div>

            <main className="relative z-10 w-full max-w-[480px] p-6">
                {/* Apple Style Liquid Glass Floating Card */}
                <div className="liquid-glass p-12 flex flex-col items-center space-y-10 group relative">

                    {/* Subtle inner top highlight */}
                    <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                    <div className="w-full flex flex-col items-center justify-center text-center space-y-6">
                        <img src={logoBase64} alt="ATL Logo" className="h-20 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] pb-4 border-b border-white/5 w-full object-contain" />

                        <div className="space-y-2 pt-2">
                            <h1 className="font-headline text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60 tracking-tight">Login Seguro</h1>
                            <p className="text-white/40 text-sm font-label tracking-widest uppercase">Acesso Autorizado Somente</p>
                        </div>
                    </div>

                    <form className="w-full space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-4">
                            <div className="relative group/input">
                                <div className="absolute inset-0 bg-white/5 rounded-2xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500"></div>
                                <input
                                    className="relative w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all duration-300 font-body text-base backdrop-blur-md shadow-inner"
                                    placeholder="Seu e-mail profissional"
                                    type="email"
                                    required
                                />
                            </div>

                            <div className="relative group/input">
                                <div className="absolute inset-0 bg-white/5 rounded-2xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500"></div>
                                <input
                                    className="relative w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all duration-300 font-body text-base backdrop-blur-md shadow-inner"
                                    placeholder="Chave de segurança (Senha)"
                                    type="password"
                                    required
                                />
                                <button className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors duration-200 z-10" type="button">
                                    <span className="material-symbols-outlined text-xl">visibility</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center px-1">
                            <label className="flex items-center gap-3 cursor-pointer group/checkbox">
                                <div className="w-5 h-5 rounded border border-white/20 bg-white/[0.05] flex items-center justify-center group-hover/checkbox:border-white/40 transition-colors">
                                    <span className="material-symbols-outlined text-[14px] text-white opacity-0 transition-opacity">check</span>
                                </div>
                                <span className="text-white/50 text-xs font-label uppercase tracking-widest group-hover/checkbox:text-white/80 transition-colors">Lembrar</span>
                            </label>
                            <a className="font-label text-[10px] text-white/50 hover:text-white transition-colors uppercase tracking-widest border-b border-transparent hover:border-white/50 pb-0.5" href="#">Recuperar Acesso</a>
                        </div>

                        <button className="relative w-full bg-white text-black font-headline font-bold py-5 rounded-2xl text-[13px] tracking-[2px] hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-500 active:scale-[0.98] uppercase mt-4 overflow-hidden group/btn" type="submit">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                            Entrar na Academia
                        </button>
                    </form>

                    <footer className="w-full pt-8 border-t border-white/10 text-center">
                        <button type="button" className="text-white/40 hover:text-white transition-colors font-label text-[10px] tracking-[3px] uppercase flex items-center justify-center gap-2 w-full">
                            Solicitar Convite de Associação
                            <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
                        </button>
                    </footer>
                </div>

                <div className="text-center mt-12 pb-4">
                    <div className="font-label text-[9px] text-white/20 tracking-[6px] uppercase">
                        ATL ACADEMY // PROTOCOLO SEGURO V2
                    </div>
                </div>
            </main>

        </div>
    );
};

export default Login;
