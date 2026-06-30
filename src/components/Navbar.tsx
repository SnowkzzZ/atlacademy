import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { logoBase64 } from '../logoBase64';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

// ── Time formatter ─────────────────────────────────────────────────────────────
const timeAgo = (ts: number): string => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return 'Agora mesmo';
    if (mins < 60) return `${mins}min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h atrás`;
    return '1 dia atrás';
};

const Navbar: React.FC<{ isFixed?: boolean }> = ({ isFixed = true }) => {
    const { isAdmin } = useAuth();
    const location = useLocation();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    const [isMenuOpen,  setIsMenuOpen]  = React.useState(false);
    const [scrolled,    setScrolled]    = React.useState(false);
    const [notifOpen,   setNotifOpen]   = React.useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close notif panel when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        if (notifOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [notifOpen]);

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

                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2 md:gap-3 group">
                            <motion.img
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                src={logoBase64}
                                alt="ATL"
                                className="h-6 md:h-8 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                            />
                            <div className="h-4 w-px bg-white/20 hidden sm:block" />
                            <span className="font-headline font-bold text-[10px] md:text-xs tracking-[0.3em] text-white/90 block uppercase">ATL ACADEMY</span>
                        </Link>
                    </div>

                    {/* Center Links */}
                    <div className="hidden md:flex items-center p-1.5 space-x-1 rounded-full bg-black/20 border border-white/5">
                        {[
                            { name: 'PAINEL',       path: '/' },
                            { name: 'CURSOS',       path: '/explore' },
                            { name: 'MATERIAIS',    path: '/materiais' },
                            { name: 'AGENDA', path: '/treinamentos' },
                            { name: 'INTELIGÊNCIA', path: '/intel' },
                        ].map(link => (
                            <Link
                                key={link.name}
                                className={`relative px-6 py-2 rounded-full font-label text-[9px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 ${isActive(link.path) ? 'nav-item-active' : 'text-white/40 hover:text-white'}`}
                                to={link.path}
                            >
                                {link.name}
                            </Link>
                        ))}
                        {isAdmin && (
                            <Link
                                to="/painel"
                                className="nav-central-comando font-label text-[9px] font-bold tracking-[0.2em] px-6 py-2 uppercase hover:bg-[#00F0FF] hover:text-[#050B14]"
                            >
                                CENTRAL DE COMANDO
                            </Link>
                        )}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="hidden md:flex items-center gap-2">
                            {/* Search */}
                            <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] transition-colors"
                            >
                                <span className="material-symbols-outlined text-white/50 nav-icon text-[16px]">search</span>
                            </motion.button>

                            {/* Notifications Bell */}
                            <div className="relative" ref={notifRef}>
                                <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => setNotifOpen(v => !v)}
                                    className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] transition-colors relative"
                                >
                                    {unreadCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-black text-[9px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_#00F0FF] font-mono leading-none"
                                        >
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </motion.span>
                                    )}
                                    <span className="material-symbols-outlined text-white/50 nav-icon text-[16px]">notifications</span>
                                </motion.button>

                                {/* Dropdown Panel */}
                                <AnimatePresence>
                                    {notifOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                            transition={{ duration: 0.2, ease: 'easeOut' }}
                                            className="absolute right-0 top-12 w-[340px] rounded-[1.5rem] border border-white/10 overflow-hidden shadow-2xl z-50"
                                            style={{
                                                background: 'rgba(5,8,15,0.95)',
                                                backdropFilter: 'blur(40px)',
                                            }}
                                        >
                                            {/* Header */}
                                            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-headline text-sm font-bold text-white uppercase tracking-wide">Notificações</span>
                                                    {unreadCount > 0 && (
                                                        <span className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/25 font-label text-[9px] text-primary font-bold tracking-wider">
                                                            {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={markAllAsRead}
                                                        className="font-label text-[9px] text-white/30 hover:text-primary transition-colors uppercase tracking-wider"
                                                    >
                                                        Marcar todas
                                                    </button>
                                                )}
                                            </div>

                                            {/* List */}
                                            <div className="max-h-[360px] overflow-y-auto custom-scrollbar-premium">
                                                {notifications.length === 0 ? (
                                                    <div className="py-12 flex flex-col items-center gap-3 text-center px-6">
                                                        <span className="material-symbols-outlined text-white/10 text-4xl">notifications_none</span>
                                                        <p className="text-white/20 font-label text-[10px] tracking-widest uppercase">Sem notificações</p>
                                                    </div>
                                                ) : (
                                                    notifications
                                                        .slice()
                                                        .sort((a, b) => b.createdAt - a.createdAt)
                                                        .map(notif => (
                                                            <div
                                                                key={notif.id}
                                                                className={`flex items-start gap-3 px-5 py-4 border-b border-white/[0.04] transition-colors ${notif.read ? 'opacity-50' : 'hover:bg-white/[0.03]'}`}
                                                            >
                                                                {/* Icon */}
                                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${notif.type === 'course' ? 'bg-purple-500/15 border border-purple-500/25' : 'bg-primary/10 border border-primary/20'}`}>
                                                                    <span className={`material-symbols-outlined text-[16px] ${notif.type === 'course' ? 'text-purple-400' : 'text-primary'}`}
                                                                        style={{ fontVariationSettings: "'FILL' 1" }}>
                                                                        {notif.type === 'course' ? 'play_circle' : 'movie'}
                                                                    </span>
                                                                </div>

                                                                {/* Text */}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-white/90 font-label text-[11px] font-semibold leading-snug line-clamp-1">
                                                                        {notif.title}
                                                                    </p>
                                                                    <p className="text-white/35 font-label text-[10px] mt-0.5 leading-snug">
                                                                        {notif.subtitle}
                                                                    </p>
                                                                    <p className="text-white/20 font-label text-[9px] mt-1.5 uppercase tracking-widest">
                                                                        {timeAgo(notif.createdAt)}
                                                                    </p>
                                                                </div>

                                                                {/* Read indicator + button */}
                                                                <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
                                                                    {!notif.read && (
                                                                        <>
                                                                            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_#00F0FF]" />
                                                                            <button
                                                                                onClick={() => markAsRead(notif.id)}
                                                                                className="text-white/20 hover:text-primary transition-colors"
                                                                                title="Marcar como lida"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                )}
                                            </div>

                                            {/* Footer */}
                                            {notifications.length > 0 && (
                                                <div className="px-5 py-3 border-t border-white/[0.06]">
                                                    <p className="text-white/15 font-label text-[9px] uppercase tracking-widest text-center">
                                                        Notificações expiram após 24 horas
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Profile */}
                        <Link to="/profile" className="group">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="w-9 h-9 md:w-11 md:h-11 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03] transition-colors relative overflow-hidden"
                            >
                                <span className="material-symbols-outlined text-white/50 nav-icon text-base md:text-lg">person</span>
                            </motion.div>
                        </Link>

                        {/* Hamburger (Mobile) */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 z-50 rounded-full border border-white/10 bg-white/[0.03]"
                        >
                            <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                            <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
                            <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="md:hidden fixed inset-0 top-0 left-0 w-full h-[100dvh] bg-black/95 backdrop-blur-3xl z-40 flex flex-col items-center justify-center p-12"
                        >
                            <div className="flex flex-col items-center space-y-10 w-full">
                                {[
                                    { name: 'PAINEL',       path: '/' },
                                    { name: 'CURSOS',       path: '/explore' },
                                    { name: 'MATERIAIS',    path: '/materiais' },
                                    { name: 'AGENDA', path: '/treinamentos' },
                                    { name: 'INTELIGÊNCIA', path: '/intel' },
                                ].map((link, i) => (
                                    <motion.div
                                        key={link.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * i }}
                                        className="w-full text-center"
                                    >
                                        <Link
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`text-4xl font-headline font-bold tracking-[0.2em] transition-all duration-500 block py-2 uppercase ${isActive(link.path) ? 'text-primary drop-shadow-[0_0_15px_rgba(0,240,255,0.4)] font-black' : 'text-white/40 hover:text-white'}`}
                                            to={link.path}
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.div>
                                ))}

                                {isAdmin && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="w-full">
                                        <Link
                                            onClick={() => setIsMenuOpen(false)}
                                            className="text-2xl font-headline font-bold tracking-[0.2em] text-primary border border-primary/20 bg-primary/5 py-4 rounded-2xl block text-center uppercase"
                                            to="/painel"
                                        >
                                            Central de Comando
                                        </Link>
                                    </motion.div>
                                )}

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="pt-12 flex gap-8">
                                    <button className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03]">
                                        <span className="material-symbols-outlined text-white/50 text-2xl">search</span>
                                    </button>
                                    <button
                                        onClick={() => { setIsMenuOpen(false); setNotifOpen(true); }}
                                        className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03] relative"
                                    >
                                        {unreadCount > 0 && (
                                            <span className="absolute top-3 right-3 min-w-[20px] h-[20px] px-1 bg-primary text-black text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_#00F0FF]">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
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
