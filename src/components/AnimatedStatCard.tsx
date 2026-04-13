import React, { useEffect, useState } from 'react';
import { motion, animate, useInView } from 'framer-motion';

interface Props {
    label: string;
    value: string | number;
    icon: string;
}

const AnimatedStatCard: React.FC<Props> = ({ label, value, icon }) => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const [displayValue, setDisplayValue] = useState(typeof value === 'number' ? 0 : value);
    const [displayHours, setDisplayHours] = useState(0);
    const [displayMins, setDisplayMins] = useState(0);

    // If it's a time format like "10h 30m"
    const isTime = typeof value === 'string' && value.includes('h');

    useEffect(() => {
        if (!isInView) return;

        if (typeof value === 'number') {
            const controls = animate(0, value, {
                duration: 2.5,
                ease: [0.16, 1, 0.3, 1], // Custom spring-like easing for super smooth finish
                onUpdate: (v) => setDisplayValue(Math.floor(v))
            });
            return controls.stop;
        } else if (isTime) {
            const hMatch = value.match(/(\d+)h/);
            const mMatch = value.match(/(\d+)m/);
            const h = hMatch ? parseInt(hMatch[1]) : 0;
            const m = mMatch ? parseInt(mMatch[1]) : 0;
            
            const hControls = animate(0, h, { duration: 2.5, ease: [0.16, 1, 0.3, 1], onUpdate: v => setDisplayHours(Math.floor(v)) });
            const mControls = animate(0, m, { duration: 2.5, ease: [0.16, 1, 0.3, 1], onUpdate: v => setDisplayMins(Math.floor(v)) });
            
            return () => { hControls.stop(); mControls.stop(); };
        }
    }, [isInView, value, isTime]);

    return (
        <motion.div
            ref={ref}
            whileHover={{ y: -10, scale: 1.02 }}
            className="group relative rounded-[2rem] md:aspect-square overflow-hidden bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.05] p-6 md:p-10 flex flex-col justify-between transition-all duration-700"
            style={{
                boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
            }}
        >
            {/* Ambient Background Glow on Hover */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
            
            {/* Ambient Bottom Glow */}
            <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] opacity-30 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"></div>

            {/* Icon Block */}
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[1.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-10 group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all duration-500 relative z-10">
                <span className="material-symbols-outlined text-white/30 group-hover:text-primary transition-colors duration-500 text-3xl md:text-4xl">{icon}</span>
            </div>
            
            {/* Texts */}
            <div className="relative z-10 mt-auto">
                <div className="font-label text-white/40 text-[9px] md:text-[11px] tracking-[0.3em] uppercase mb-2 md:mb-4">{label}</div>
                <div className="font-headline text-5xl md:text-[5rem] font-bold tracking-tighter text-white leading-none drop-shadow-2xl flex items-end">
                    {isTime ? (
                        <>
                            {displayHours}<span className="text-xl md:text-3xl text-white/20 font-light mb-1 md:mb-2 mx-1 md:mx-2">h</span>
                            {displayMins}<span className="text-xl md:text-3xl text-white/20 font-light mb-1 md:mb-2 ml-1">m</span>
                        </>
                    ) : (
                        displayValue
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default AnimatedStatCard;
