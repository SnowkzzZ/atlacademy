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
        <div className="bg-[#020302] text-on-surface font-body selection:bg-primary/30 selection:text-white min-h-screen relative flex items-center justify-center overflow-hidden">

            {/* Ultimate Premium Background */}
            <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[#010301]"></div>
                
                {/* Advanced Tech Grid Pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.05]" 
                    style={{ 
                        backgroundImage: `
                            linear-gradient(rgba(0, 255, 135, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 135, 0.1) 1px, transparent 1px)
                        `, 
                        backgroundSize: '40px 40px' 
                    }}
                ></div>

                {/* Animated Deep Emerald Gradients */}
                <motion.div 
                    animate={{ 
                        scale: [1, 1.4, 1],
                        opacity: [0.15, 0.3, 0.15],
                        rotate: [0, 90, 0]
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] right-[-10%] w-[900px] h-[900px] bg-gradient-to-br from-primary/30 via-emerald-900/10 to-transparent rounded-full blur-[130px] mix-blend-screen"
                ></motion.div>
                
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.25, 0.1],
                        rotate: [0, -90, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-gradient-to-tr from-[#00FF87]/20 via-[#004A26]/10 to-transparent rounded-full blur-[140px] mix-blend-screen"
                ></motion.div>

                {/* Focus beam top-to-bottom */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[100vh] bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-[80px]"></div>

                {/* Vignette effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#010301] via-transparent to-[#010301] opacity-90"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#010301_100%)]"></div>
            </div>

            <main className="relative z-10 w-full max-w-[500px] px-5 py-8">
                
                <motion.div 
                    initial={{ opacity: 0, y: 30, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="relative group"
                >
                    {/* Floating Glow underlying the card */}
                    <div className="absolute -inset-1 bg-gradient-to-b from-primary/30 via-primary/5 to-transparent rounded-[3rem] blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000"></div>
                    
                    {/* Main Architectural Glass Card */}
                    <div className="relative bg-[#050B08]/60 backdrop-blur-[40px] p-10 md:p-14 flex flex-col items-center shadow-[0_40px_80px_-20px_rgba(0,10,5,1)] overflow-hidden rounded-[2.5rem] border border-white/5 group-hover:border-primary/20 transition-colors duration-700">
                        
                        {/* Shimmer laser line inside card top */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-80"></div>

                        {/* Top cyber accents */}
                        <div className="absolute top-6 left-6 flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/20"></span>
                        </div>
                        <div className="absolute top-6 right-6 font-label text-[8px] text-primary/30 uppercase tracking-[0.3em]">
                            V.2.4.0
                        </div>

                        {/* Logo and Typography */}
                        <div className="w-full flex flex-col items-center text-center space-y-7 relative z-10 mt-2 mb-8">
                            
                            {/* Decorative framing for logo */}
                            <div className="relative mb-2">
                                <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full scale-150 opacity-60"></div>
                                <motion.img 
                                    whileHover={{ scale: 1.05, filter: "drop-shadow(0px 0px 25px rgba(0,255,135,0.4))" }}
                                    transition={{ duration: 0.4 }}
                                    src={logoBase64} 
                                    alt="ATL Logo" 
                                    className="relative h-28 md:h-36 object-contain z-10" 
                                />
                            </div>

                            <div className="space-y-2 w-full pt-4 relative">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
                                
                                <h1 className="flex flex-col gap-2">
                                    <span className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] mt-4">
                                        ATL Academy
                                    </span>
                                </h1>
                            </div>
                        </div>

                        {/* Interactive Form */}
                        <form className="w-full space-y-6 relative z-10" onSubmit={handleAuth}>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, y: -10 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs tracking-wide p-4 rounded-2xl text-center flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.15)] backdrop-blur-md"
                                >
                                    <span className="material-symbols-outlined text-[16px]">dangerous</span>
                                    {error}
                                </motion.div>
                            )}
                            
                            <div className="space-y-4">
                                {/* Email Field - Emerald Variant */}
                                <div className="relative group/input">
                                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative flex items-center bg-[#030805] border border-white/10 rounded-2xl overflow-hidden focus-within:border-primary/40 focus-within:bg-[#06120B] transition-all duration-300 shadow-inner group-hover/input:border-white/20">
                                        <div className="pl-6 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white/20 text-[20px] group-focus-within/input:text-primary transition-colors">fingerprint</span>
                                        </div>
                                        <input
                                            className="w-full bg-transparent px-4 py-4 md:py-[22px] text-white placeholder:text-white/20 focus:outline-none font-body text-sm md:text-base selection:bg-primary/30"
                                            placeholder="Identificação (E-mail)"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Password Field - Emerald Variant */}
                                <div className="relative group/input">
                                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative flex items-center bg-[#030805] border border-white/10 rounded-2xl overflow-hidden focus-within:border-primary/40 focus-within:bg-[#06120B] transition-all duration-300 shadow-inner group-hover/input:border-white/20">
                                        <div className="pl-6 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white/20 text-[20px] group-focus-within/input:text-primary transition-colors">key</span>
                                        </div>
                                        <input
                                            className="w-full bg-transparent px-4 py-4 md:py-[22px] text-white placeholder:text-white/20 focus:outline-none font-body text-sm md:text-base selection:bg-primary/30"
                                            placeholder="Chave de Segurança"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button 
                                            className="pr-6 flex items-center justify-center text-white/20 hover:text-primary transition-colors duration-200 outline-none" 
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
                            <div className="flex justify-between items-center px-2 py-2">
                                <label className="flex items-center gap-3 cursor-pointer group/checkbox">
                                    <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all duration-300 ${rememberMe ? 'border-primary bg-primary/20 shadow-[0_0_15px_rgba(0,255,135,0.3)]' : 'border-white/10 bg-[#030805] group-hover/checkbox:border-white/30'}`}>
                                        <motion.span 
                                            initial={false}
                                            animate={{ scale: rememberMe ? 1 : 0, opacity: rememberMe ? 1 : 0 }}
                                            className="material-symbols-outlined text-[14px] text-primary drop-shadow-[0_0_5px_rgba(0,255,135,0.8)]"
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
                                    <span className={`text-[11px] font-label uppercase tracking-[0.2em] transition-colors duration-300 ${rememberMe ? 'text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-white/40 group-hover/checkbox:text-white/70'}`}>
                                        Manter Conexão
                                    </span>
                                </label>
                                
                                <button type="button" className="font-label text-[10px] text-white/30 hover:text-primary transition-colors uppercase tracking-[0.15em] border-b border-transparent hover:border-primary/50 pb-0.5">
                                    Acesso Perdido?
                                </button>
                            </div>

                            {/* Submit Button - The Emerald core */}
                            <motion.button 
                                whileHover={{ scale: (loading || !email || !password) ? 1 : 1.02 }}
                                whileTap={{ scale: (loading || !email || !password) ? 1 : 0.98 }}
                                disabled={loading || !email || !password}
                                className="relative w-full overflow-hidden group/btn disabled:opacity-50 disabled:cursor-not-allowed mt-8 rounded-2xl" 
                                type="submit"
                            >
                                {/* Glowing backdrop for button */}
                                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                                
                                {/* Button Surface */}
                                <div className="relative w-full bg-primary hover:bg-[#00E57A] text-black font-headline font-bold py-5 px-6 rounded-2xl text-[14px] tracking-[0.25em] transition-colors duration-300 uppercase shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_20px_rgba(0,255,135,0.3)] group-hover/btn:shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),0_0_35px_rgba(0,255,135,0.5)]">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
                                    
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {loading ? (
                                            <>
                                                <span className="w-5 h-5 border-[3px] border-black/20 border-t-black rounded-full animate-spin"></span>
                                                Sincronizando...
                                            </>
                                        ) : "Iniciar Operação"}
                                    </span>
                                </div>
                            </motion.button>
                        </form>
                    </div>
                </motion.div>

                {/* Footer Badges */}
                <div className="mt-12 flex flex-col justify-center items-center gap-5 opacity-50 hover:opacity-100 transition-opacity duration-700">
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_#00FF87] animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-[#00FF87]/20"></div>
                        <div className="w-2 h-2 rounded-full bg-[#00FF87]/20"></div>
                    </div>
                    <div className="flex items-center gap-4 border border-white/10 bg-white/[0.02] px-4 py-2 rounded-full backdrop-blur-md">
                        <span className="material-symbols-outlined text-primary text-[14px]">encrypted</span>
                        <p className="font-label text-[9px] font-bold tracking-[0.4em] uppercase text-white/50">
                            Protocolo de Criptografia Ativo
                        </p>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Login;
