import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoBase64 } from '../logoBase64';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    
    // Fallback to type checking for state
    const state = location.state as { from?: Location };
    const from = state?.from?.pathname || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            navigate(from, { replace: true });
        }
    }, [user, navigate, from]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (signUpError) throw signUpError;
                
                alert("Conta criada com sucesso! Faça login para continuar.");
                setIsSignUp(false);
                setPassword('');
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
                // Se der sucesso, o AuthContext receberá o novo usuário e o useEffect fará o redirect
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro na autenticação.');
        } finally {
            setLoading(false);
        }
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
                            <h1 className="font-headline text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60 tracking-tight">
                                {isSignUp ? "Novo Acesso" : "Login Seguro"}
                            </h1>
                            <p className="text-white/40 text-sm font-label tracking-widest uppercase">
                                {isSignUp ? "Cadastro de Membro" : "Acesso Autorizado Somente"}
                            </p>
                        </div>
                    </div>

                    <form className="w-full space-y-6" onSubmit={handleAuth}>
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg text-center backdrop-blur-sm">
                                {error}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div className="relative group/input">
                                <div className="absolute inset-0 bg-white/5 rounded-2xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500"></div>
                                <input
                                    className="relative w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all duration-300 font-body text-base backdrop-blur-md shadow-inner"
                                    placeholder="Seu e-mail profissional"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="relative group/input">
                                <div className="absolute inset-0 bg-white/5 rounded-2xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500"></div>
                                <input
                                    className="relative w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all duration-300 font-body text-base backdrop-blur-md shadow-inner"
                                    placeholder="Chave de segurança (Senha)"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button 
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors duration-200 z-10" 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {!isSignUp && (
                            <div className="flex justify-between items-center px-1">
                                <label className="flex items-center gap-3 cursor-pointer group/checkbox">
                                    <div className="w-5 h-5 rounded border border-white/20 bg-white/[0.05] flex items-center justify-center group-hover/checkbox:border-white/40 transition-colors">
                                        <span className="material-symbols-outlined text-[14px] text-white opacity-0 transition-opacity group-has-[:checked]:opacity-100">check</span>
                                    </div>
                                    <input type="checkbox" className="sr-only" />
                                    <span className="text-white/50 text-xs font-label uppercase tracking-widest group-hover/checkbox:text-white/80 transition-colors">Lembrar</span>
                                </label>
                                <a className="font-label text-[10px] text-white/50 hover:text-white transition-colors uppercase tracking-widest border-b border-transparent hover:border-white/50 pb-0.5" href="#">Recuperar Acesso</a>
                            </div>
                        )}

                        <button 
                            disabled={loading}
                            className="relative w-full bg-white text-black font-headline font-bold py-5 rounded-2xl text-[13px] tracking-[2px] hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-500 active:scale-[0.98] uppercase mt-4 overflow-hidden group/btn disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed" 
                            type="submit"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                            {loading ? "Processando..." : (isSignUp ? "Criar Conta" : "Entrar na Academia")}
                        </button>
                    </form>

                    <footer className="w-full pt-8 border-t border-white/10 text-center">
                        <button 
                            type="button" 
                            onClick={() => { setIsSignUp(!isSignUp); setError(''); setPassword(''); }}
                            className="text-white/40 hover:text-white transition-colors font-label text-[10px] tracking-[3px] uppercase flex items-center justify-center gap-2 w-full"
                        >
                            {isSignUp ? "Já possuo um convite (Fazer Login)" : "Solicitar Convite de Associação (Criar Conta)"}
                            <span className="material-symbols-outlined text-sm">
                                {isSignUp ? "login" : "arrow_right_alt"}
                            </span>
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
