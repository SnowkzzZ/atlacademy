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
        <div className="bg-[#020202] text-on-surface font-body selection:bg-primary/30 selection:text-white min-h-screen relative flex items-center justify-center overflow-hidden">

            {/* Premium Immersive Background */}
            <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[#020202]"></div>
                
                {/* Subtle Grid Pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.03]" 
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
                ></div>

                {/* Animated Gradient Orbs */}
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                        rotate: [0, 90, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-full blur-[100px] mix-blend-screen translate-x-1/3 -translate-y-1/3"
                ></motion.div>
                
                <motion.div 
                    animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.2, 0.4, 0.2],
                        rotate: [0, -90, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/10 via-teal-500/5 to-transparent rounded-full blur-[100px] mix-blend-screen -translate-x-1/3 translate-y-1/3"
                ></motion.div>

                {/* Vignette effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-[#020202] opacity-80"></div>
            </div>

            <main className="relative z-10 w-full max-w-[480px] px-4 py-8">
                
                <motion.div 
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative group"
                >
                    {/* Glowing border effect underneath the card */}
                    <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 via-white/5 to-transparent rounded-[2.5rem] blur-sm opacity-50"></div>
                    
                    {/* Main Card */}
                    <div className="relative bg-black/40 backdrop-blur-3xl p-10 md:p-14 flex flex-col items-center space-y-10 rounded-[2.5rem] border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
                        
                        {/* Shimmer line inside card top */}
                        <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                        {/* Logo and Titles */}
                        <div className="w-full flex flex-col items-center justify-center text-center space-y-8 relative z-10">
                            
                            {/* Decorative framing for logo */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent blur-2xl rounded-full scale-150 opacity-50"></div>
                                <motion.img 
                                    whileHover={{ scale: 1.05, filter: "drop-shadow(0px 0px 20px rgba(255,255,255,0.3))" }}
                                    transition={{ duration: 0.3 }}
                                    src={logoBase64} 
                                    alt="ATL Logo" 
                                    className="relative h-28 md:h-36 object-contain z-10" 
                                />
                            </div>

                            <div className="space-y-4 w-full">
                                <h1 className="flex flex-col gap-1">
                                    <span className="font-label text-xs md:text-sm tracking-[0.4em] text-white/40 uppercase">Acesso Autorizado</span>
                                    <span className="font-headline text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/40 filter drop-shadow-sm">
                                        Academy Hub
                                    </span>
                                </h1>
                            </div>
                        </div>

                        {/* Form */}
                        <form className="w-full space-y-6 relative z-10" onSubmit={handleAuth}>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs tracking-wide p-4 rounded-2xl text-center flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[16px]">error</span>
                                    {error}
                                </motion.div>
                            )}
                            
                            <div className="space-y-4">
                                {/* Email Field */}
                                <div className="relative group/input">
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden focus-within:border-white/30 focus-within:bg-[#111] transition-all duration-300 shadow-inner group-hover/input:border-white/20">
                                        <div className="pl-6 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white/20 text-[20px] group-focus-within/input:text-white/60 transition-colors">alternate_email</span>
                                        </div>
                                        <input
                                            className="w-full bg-transparent px-4 py-4 md:py-5 text-white placeholder:text-white/20 focus:outline-none font-body text-sm md:text-base selection:bg-white/20"
                                            placeholder="Seu Email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="relative group/input">
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden focus-within:border-white/30 focus-within:bg-[#111] transition-all duration-300 shadow-inner group-hover/input:border-white/20">
                                        <div className="pl-6 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white/20 text-[20px] group-focus-within/input:text-white/60 transition-colors">lock</span>
                                        </div>
                                        <input
                                            className="w-full bg-transparent px-4 py-4 md:py-5 text-white placeholder:text-white/20 focus:outline-none font-body text-sm md:text-base selection:bg-white/20"
                                            placeholder="Sua Senha"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button 
                                            className="pr-6 flex items-center justify-center text-white/20 hover:text-white/80 transition-colors duration-200 outline-none" 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Options Row */}
                            <div className="flex justify-between items-center px-1">
                                <label className="flex items-center gap-3 cursor-pointer group/checkbox">
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300 ${rememberMe ? 'border-primary bg-primary/10 shadow-[0_0_10px_rgba(0,255,135,0.2)]' : 'border-white/20 bg-white/[0.02] group-hover/checkbox:border-white/40'}`}>
                                        <motion.span 
                                            initial={false}
                                            animate={{ scale: rememberMe ? 1 : 0, opacity: rememberMe ? 1 : 0 }}
                                            className="material-symbols-outlined text-[14px] text-primary"
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
                                    <span className={`text-xs font-label uppercase tracking-[0.15em] transition-colors duration-300 ${rememberMe ? 'text-white/90' : 'text-white/40 group-hover/checkbox:text-white/70'}`}>
                                        Lembrar Acesso
                                    </span>
                                </label>
                                
                                <button type="button" className="font-label text-[10px] text-white/30 hover:text-white transition-colors uppercase tracking-[0.1em] border-b border-white/0 hover:border-white/50 pb-0.5">
                                    Esqueceu a senha?
                                </button>
                            </div>

                            {/* Submit Button */}
                            <motion.button 
                                whileHover={{ scale: (loading || !email || !password) ? 1 : 1.02 }}
                                whileTap={{ scale: (loading || !email || !password) ? 1 : 0.98 }}
                                disabled={loading || !email || !password}
                                className="relative w-full bg-white text-black font-headline font-bold py-5 rounded-2xl text-[14px] tracking-[0.25em] transition-all duration-300 uppercase mt-8 overflow-hidden group/btn disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]" 
                                type="submit"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-black/0 via-black/5 to-black/0 -translate-x-[200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>
                                            Verificando...
                                        </>
                                    ) : "Entrar na Plataforma"}
                                </span>
                            </motion.button>
                        </form>
                    </div>
                </motion.div>

                {/* Footer Badges */}
                <div className="mt-10 flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
                    <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/80 shadow-[0_0_8px_#00FF87] animate-pulse"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                    </div>
                    <p className="font-label text-[9px] tracking-[0.4em] uppercase text-center flex gap-2 items-center">
                        <span className="material-symbols-outlined text-[12px]">shield_lock</span>
                        Sistema de Acesso Restrito
                    </p>
                </div>

            </main>
        </div>
    );
};

export default Login;
