import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { logoBase64 } from '../logoBase64';

const Navbar: React.FC<{ isFixed?: boolean }> = ({ isFixed = true }) => {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className={`${isFixed ? 'fixed w-full' : 'sticky'} top-0 z-[100] pt-4 md:pt-6 px-4 md:px-10 pointer-events-none transition-all duration-500 ${scrolled ? 'pt-2 md:pt-4' : ''}`}>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-[1440px] mx-auto pointer-events-auto"
            >
                <div className={`liquid-glass-soft transition-all duration-500 px-4 md:px-8 py-3 flex justify-between items-center ${scrolled ? 'rounded-full bg-black/40 backdrop-blur-3xl border-white/10' : 'rounded-[2rem] bg-white/[0.02]'}`}>

                    {/* Left Side: Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2 md:gap-3 group">
                            <motion.img
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                src={logoBase64}
                                alt="ATL"
                                className="h-6 md:h-8 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                            />
                            <div className="h-4 w-px bg-white/20 hidden sm:block"></div>
                            <span className="font-headline font-bold text-[10px] md:text-xs tracking-[0.3em] text-white/90 block uppercase">ATL ACADEMY</span>
                        </Link>
                    </div>

                    {/* Center Links (Desktop Only) */}
                    <div className="hidden md:flex items-center p-1.5 space-x-1 rounded-full bg-black/20 border border-white/5">
                        {[
                            { name: 'PAINEL', path: '/' },
                            { name: 'CURSOS', path: '/explore' },
                            { name: 'INTELIGÊNCIA', path: '/intel' }
                        ].map((link) => (
                            <Link
                                key={link.name}
                                className={`relative px-6 py-2 rounded-full font-label text-[9px] font-semibold tracking-[0.2em] uppercase transition-all duration-500 overflow-hidden group`}
                                to={link.path}
                            >
                                <span className={`relative z-10 ${isActive(link.path) ? 'text-black' : 'text-white/40 group-hover:text-white'}`}>{link.name}</span>
                                {isActive(link.path) && (
                                    <motion.div
                                        layoutId="nav-bg"
                                        className="absolute inset-0 bg-primary rounded-full shadow-[0_0_20px_rgba(0,255,135,0.4)]"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Right Side: Account and Hamburger */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="hidden md:flex items-center gap-2">
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] transition-colors">
                                <span className="material-symbols-outlined text-white/50 text-[16px]">search</span>
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] transition-colors relative">
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_#00FF87]"></div>
                                <span className="material-symbols-outlined text-white/50 text-[16px]">notifications</span>
                            </motion.button>
                        </div>

                        <Link to="/profile" className="group">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="w-9 h-9 md:w-11 md:h-11 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03] group-hover:border-primary/40 transition-colors relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="material-symbols-outlined text-white/50 group-hover:text-white text-base md:text-lg transition-colors">person</span>
                            </motion.div>
                        </Link>

                        {/* Hamburger Button (Mobile Only) */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 z-50 rounded-full border border-white/10 bg-white/[0.03]">
                            <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                            <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                            <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="md:hidden fixed inset-0 top-0 left-0 w-full h-[100dvh] bg-black/95 backdrop-blur-3xl z-40 flex flex-col items-center justify-center p-12"
                        >
                            <div className="flex flex-col items-center space-y-10 w-full">
                                {['PAINEL', 'CURSOS', 'INTELIGÊNCIA'].map((item, i) => (
                                    <motion.div
                                        key={item}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * i }}
                                        className="w-full text-center"
                                    >
                                        <Link
                                            onClick={() => setIsMenuOpen(false)}
                                            className="text-4xl font-headline font-bold tracking-[0.2em] text-white/40 hover:text-primary transition-all duration-500 block py-2 uppercase"
                                            to={item === 'PAINEL' ? '/' : item === 'INTELIGÊNCIA' ? '/intel' : '/explore'}
                                        >
                                            {item}
                                        </Link>
                                    </motion.div>
                                ))}

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="pt-12 flex gap-8"
                                >
                                    <button className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03]">
                                        <span className="material-symbols-outlined text-white/50 text-2xl">search</span>
                                    </button>
                                    <button className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03] relative">
                                        <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_15px_#00FD86]"></div>
                                        <span className="material-symbols-outlined text-white/50 text-2xl">notifications</span>
                                    </button>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </nav>
    );
};

export default Navbar;
