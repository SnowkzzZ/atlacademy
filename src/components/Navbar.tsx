import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { logoBase64 } from '../logoBase64';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC<{ isFixed?: boolean }> = ({ isFixed = true }) => {
    const { user } = useAuth();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);

    const isMasterAdmin = user?.email === 'juliano.atl';

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
                <div className={`navbar-premium transition-all duration-500 px-4 md:px-8 py-3 flex justify-between items-center ${scrolled ? 'rounded-full' : 'rounded-[2rem]'}`}>

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
                                className={`relative px-6 py-2 rounded-full font-label text-[9px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 ${isActive(link.path) ? 'nav-item-active' : 'text-white/40 hover:text-white'}`}
                                to={link.path}
                            >
                                {link.name}
                            </Link>
                        ))}
                        
                        {/* Master Admin Special Card */}
                        {isMasterAdmin && (
                            <Link
                                to="/painel"
                                className="nav-central-comando font-label text-[9px] font-bold tracking-[0.2em] px-6 py-2 uppercase hover:bg-[#00F0FF] hover:text-[#050B14]"
                            >
                                CENTRAL DE COMANDO
                            </Link>
                        )}
                    </div>

                    {/* Right Side: Account and Hamburger */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="hidden md:flex items-center gap-2">
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] transition-colors">
                                <span className="material-symbols-outlined text-white/50 nav-icon text-[16px]">search</span>
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] transition-colors relative">
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_#00F5FF]"></div>
                                <span className="material-symbols-outlined text-white/50 nav-icon text-[16px]">notifications</span>
                            </motion.button>
                        </div>

                        <Link to="/profile" className="group">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="w-9 h-9 md:w-11 md:h-11 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03] transition-colors relative overflow-hidden"
                            >
                                <span className="material-symbols-outlined text-white/50 nav-icon text-base md:text-lg">person</span>
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

                                {/* Mobile Master Admin Card */}
                                {isMasterAdmin && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="w-full"
                                    >
                                        <Link
                                            onClick={() => setIsMenuOpen(false)}
                                            className="text-2xl font-headline font-bold tracking-[0.2em] text-primary border border-primary/20 bg-primary/5 py-4 rounded-2xl block text-center uppercase"
                                            to="/painel"
                                        >
                                            Central de Comando
                                        </Link>
                                    </motion.div>
                                )}

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
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
