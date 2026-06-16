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
        <div className="bg-black text-on-surface font-body selection:bg-primary/30 selection:text-white min-h-screen relative flex items-center justify-center overflow-hidden">

            {/* Premium Background */}
            <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[#000000]"></div>
                
                {/* Micro Tech Grid Pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.03]" 
                    style={{ 
                        backgroundImage: `
                            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                        `, 
                        backgroundSize: '48px 48px' 
                    }}
                ></div>

                {/* Animated Deep Radial Glows */}
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.15, 0.25, 0.15],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-[120px] mix-blend-screen"
                ></motion.div>
                
                <motion.div 
                    animate={{ 
                        scale: [1, 1.15, 1],
                        opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-[130px] mix-blend-screen"
                ></motion.div>

                {/* Subtle light leak at top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/5 rounded-full blur-[90px]"></div>
            </div>

            <main className="relative z-10 w-full max-w-[460px] px-6 py-12">
                
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="relative"
                >
                    {/* Architectural Glass Card */}
                    <div className="relative bg-white/[0.02] backdrop-blur-[48px] p-8 md:p-12 flex flex-col items-center shadow-2xl overflow-hidden rounded-[2.5rem] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-700">
                        
                        {/* Shimmer laser line inside card top */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                        {/* Top corner details */}
                        <div className="absolute top-6 left-8 flex gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/5"></span>
                        </div>
                        <div className="absolute top-6 right-8 font-label text-[8px] text-white/30 uppercase tracking-[0.25em] font-semibold">
                            SECURE CORE
                        </div>

                        {/* Logo and Typography */}
                        <div className="w-full flex flex-col items-center text-center space-y-4 relative z-10 mb-8 mt-4">
                            
                            {/* Decorative framing for logo */}
                            <div className="relative mb-2">
                                <div className="absolute inset-0 bg-white/5 blur-[40px] rounded-full scale-150"></div>
                                <motion.img 
                                    whileHover={{ scale: 1.03 }}
                                    transition={{ duration: 0.4 }}
                                    src={logoBase64} 
                                    alt="ATL Logo" 
                                    className="relative h-20 md:h-24 object-contain z-10 drop-shadow-[0_10px_20px_rgba(255,255,255,0.1)]" 
                                />
                            </div>

                            <div className="w-full relative">
                                <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-white uppercase tracking-[0.1em]">
                                    ATL Academy
                                </h1>
                                <p className="font-label text-[9px] tracking-[0.3em] text-white/40 uppercase mt-2 font-medium">Plataforma Elite de Desenvolvimento</p>
                            </div>
                        </div>

                        {/* Interactive Form */}
                        <form className="w-full space-y-6 relative z-10" onSubmit={handleAuth}>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs tracking-wide p-4 rounded-2xl text-center flex items-center justify-center gap-2.5 backdrop-blur-md"
                                >
                                    <span className="material-symbols-outlined text-[16px] text-red-400">error</span>
                                    {error}
                                </motion.div>
                            )}
                            
                            <div className="space-y-4">
                                {/* Email Field */}
                                <div className="relative group/input">
                                    <div className="relative flex items-center bg-white/[0.01] border border-white/[0.08] rounded-2xl overflow-hidden focus-within:border-primary/50 focus-within:bg-white/[0.03] transition-all duration-300 group-hover/input:border-white/[0.15]">
                                        <div className="pl-5 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white/30 text-[18px] group-focus-within/input:text-primary transition-colors">alternate_email</span>
                                        </div>
                                        <input
                                            className="w-full bg-transparent px-4 py-4 md:py-5 text-white placeholder:text-white/20 focus:outline-none font-body text-sm selection:bg-primary/30"
                                            placeholder="Identificação (E-mail)"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="relative group/input">
                                    <div className="relative flex items-center bg-white/[0.01] border border-white/[0.08] rounded-2xl overflow-hidden focus-within:border-primary/50 focus-within:bg-white/[0.03] transition-all duration-300 group-hover/input:border-white/[0.15]">
                                        <div className="pl-5 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white/30 text-[18px] group-focus-within/input:text-primary transition-colors">lock</span>
                                        </div>
                                        <input
                                            className="w-full bg-transparent px-4 py-4 md:py-5 text-white placeholder:text-white/20 focus:outline-none font-body text-sm selection:bg-primary/30"
                                            placeholder="Chave de Acesso"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button 
                                            className="pr-5 flex items-center justify-center text-white/30 hover:text-white transition-colors duration-200 outline-none" 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Options Row */}
                            <div className="flex justify-between items-center px-1 py-1">
                                <label className="flex items-center gap-2.5 cursor-pointer group/checkbox">
                                    <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all duration-300 ${rememberMe ? 'border-primary bg-primary/20' : 'border-white/15 bg-white/[0.01] group-hover/checkbox:border-white/30'}`}>
                                        <motion.span 
                                            initial={false}
                                            animate={{ scale: rememberMe ? 1 : 0, opacity: rememberMe ? 1 : 0 }}
                                            className="material-symbols-outlined text-[12px] text-primary font-bold"
                                        >
                                            check
                                        </motion.span>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="sr-only" 
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span className={`text-[10px] font-label uppercase tracking-[0.2em] transition-colors duration-300 ${rememberMe ? 'text-white/90' : 'text-white/40 group-hover/checkbox:text-white/70'}`}>
                                        Manter Conectado
                                    </span>
                                </label>
                                
                                <button type="button" className="font-label text-[9px] text-white/30 hover:text-white transition-colors uppercase tracking-[0.15em] pb-0.5">
                                    Recuperar Chave
                                </button>
                            </div>

                            {/* Submit Button */}
                            <motion.button 
                                whileHover={{ scale: (loading || !email || !password) ? 1 : 1.01 }}
                                whileTap={{ scale: (loading || !email || !password) ? 1 : 0.99 }}
                                disabled={loading || !email || !password}
                                className="relative w-full overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed mt-6 rounded-full" 
                                type="submit"
                            >
                                <div className="relative w-full bg-white text-black hover:bg-neutral-200 font-headline font-bold py-4.5 px-6 rounded-full text-[11px] tracking-[0.25em] transition-colors duration-300 uppercase text-center flex items-center justify-center">
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {loading ? (
                                            <>
                                                <span className="w-4 h-4 border-[2px] border-black/20 border-t-black rounded-full animate-spin"></span>
                                                Sincronizando...
                                            </>
                                        ) : "Acessar Plataforma"}
                                    </span>
                                </div>
                            </motion.button>
                        </form>
                    </div>
                </motion.div>

                {/* Footer Status */}
                <div className="mt-10 flex flex-col justify-center items-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
                    <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                    </div>
                    <div className="flex items-center gap-3 border border-white/[0.06] bg-white/[0.01] px-4 py-2 rounded-full backdrop-blur-md">
                        <span className="material-symbols-outlined text-primary text-[12px]">security</span>
                        <p className="font-label text-[8px] font-bold tracking-[0.3em] uppercase text-white/50">
                            Acesso Criptografado SSL
                        </p>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Login;
