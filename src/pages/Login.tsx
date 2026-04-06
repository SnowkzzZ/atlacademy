import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Initial load: check for remembered email
    useEffect(() => {
        const savedEmail = localStorage.getItem('atl_remembered_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    // Redirect if already authenticated
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
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            
            if (signInError) throw signInError;
            
            // Handle Remember Me
            if (rememberMe) {
                localStorage.setItem('atl_remembered_email', email);
            } else {
                localStorage.removeItem('atl_remembered_email');
            }
            
            // If successful, onAuthStateChange will trigger and user state will update
        } catch (err: any) {
            setError(err.message || 'Credenciais inválidas. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#030303] text-on-surface font-body selection:bg-white selection:text-black min-h-screen relative flex items-center justify-center overflow-hidden">

            {/* Immersive background layer */}
            <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
                <div className="absolute inset-0 bg-[#030303]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-[120px] opacity-60"></div>
                <div className="absolute w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] left-[-10%] bottom-[-10%]"></div>
                <div className="dot-grid absolute inset-0 opacity-[0.02]"></div>
            </div>

            <main className="relative z-10 w-full max-w-[440px] px-6 py-12">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="liquid-glass p-10 md:p-14 flex flex-col items-center space-y-10 group relative rounded-[2.5rem] shadow-2xl border border-white/10"
                >
                    {/* Subtle inner top highlight */}
                    <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50"></div>

                    <div className="w-full flex flex-col items-center justify-center text-center space-y-8">
                        <motion.img 
                            whileHover={{ scale: 1.05 }}
                            src={logoBase64} 
                            alt="ATL Logo" 
                            className="h-28 md:h-32 drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] object-contain" 
                        />

                        <div className="space-y-1 w-full border-t border-white/5 pt-8">
                            <h1 className="font-headline text-4xl font-bold text-white tracking-tight drop-shadow-md">
                                Login
                            </h1>
                        </div>
                    </div>

                    <form className="w-full space-y-6" onSubmit={handleAuth}>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs tracking-wide p-4 rounded-2xl text-center backdrop-blur-sm"
                            >
                                {error}
                            </motion.div>
                        )}
                        <div className="space-y-4">
                            <div className="relative group/input">
                                <div className="absolute inset-0 bg-white/5 rounded-2xl blur-lg opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500"></div>
                                <input
                                    className="relative w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all duration-300 font-body text-base backdrop-blur-md shadow-inner"
                                    placeholder="Seu Email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="relative group/input">
                                <div className="absolute inset-0 bg-white/5 rounded-2xl blur-lg opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500"></div>
                                <input
                                    className="relative w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all duration-300 font-body text-base backdrop-blur-md shadow-inner"
                                    placeholder="Senha"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button 
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors duration-200 z-10 p-2" 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-[20px] block">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center px-2">
                            <label className="flex items-center gap-3 cursor-pointer group/checkbox">
                                <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all duration-300 ${rememberMe ? 'border-primary bg-primary/20' : 'border-white/20 bg-white/[0.02] group-hover/checkbox:border-white/40'}`}>
                                    <span className={`material-symbols-outlined text-[14px] transition-all duration-300 ${rememberMe ? 'text-primary opacity-100 scale-100' : 'text-white opacity-0 scale-50'}`}>check</span>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className={`text-xs font-label uppercase tracking-[0.15em] transition-colors duration-300 ${rememberMe ? 'text-white/90' : 'text-white/50 group-hover/checkbox:text-white/80'}`}>Lembrar</span>
                            </label>
                            
                            {/* Opcional: Manter ou remover o "Recuperar Acesso" */}
                            <a className="font-label text-[10px] text-white/40 hover:text-white transition-colors uppercase tracking-[0.1em]" href="#">Esqueceu a senha?</a>
                        </div>

                        <button 
                            disabled={loading || !email || !password}
                            className="relative w-full bg-white text-black font-headline font-bold py-5 rounded-2xl text-[13px] tracking-[0.2em] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-500 active:scale-[0.98] uppercase mt-6 overflow-hidden group/btn disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed disabled:hover:shadow-none" 
                            type="submit"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                            {loading ? "Autenticando..." : "Entrar"}
                        </button>
                    </form>
                </motion.div>

                <div className="text-center mt-12 pb-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="font-label text-[9px] text-white/20 tracking-[0.4em] uppercase"
                    >
                        ATL ACADEMY // ACESSO RESTRITO
                    </motion.div>
                </div>
            </main>

        </div>
    );
};

export default Login;
