import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Course } from '../context/DataContext';

interface ModuleCardProps {
    course: Course;
    index: number;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ course, index }) => {
    const courseLink = course.lastLessonId ? `/lesson/${course.lastLessonId}` : `/lesson/${course.id}`;

    const dispTitle = course.cardTitle || course.title;
    const dispSubtitle = course.cardSubtitle || course.subtitle || "MODULO BASE";
    const dispThumb = course.cardThumbnail || course.thumbnailUrl;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="shrink-0 w-[240px] md:w-[300px]"
        >
            <Link to={courseLink} className="module-card-vertical group block">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    {dispThumb ? (
                        <img 
                            src={dispThumb} 
                            className="w-full h-full object-cover group-hover:scale-105 group-hover:blur-[2px] transition-all duration-700 ease-out" 
                            alt={dispTitle}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/0" />
                    )}
                </div>

                {/* Hover progress indicator */}
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[8px] font-bold text-white uppercase tracking-widest">{course.progress}%</span>
                    </div>
                </div>

                {/* Bottom Content (Glass Footer) */}
                <div className="module-card-overlay-bottom flex flex-col items-center text-center">
                    <p className="font-label text-[10px] text-white/80 tracking-[0.3em] font-bold uppercase mb-1 flex items-center justify-center gap-1">
                        {dispSubtitle}
                        {course.icon && <span className="material-symbols-outlined text-[10px] text-primary">{course.icon}</span>}
                    </p>
                    <h3 className="font-headline text-2xl md:text-[28px] leading-tight font-black text-white uppercase drop-shadow-lg w-full group-hover:scale-105 transition-transform duration-500">
                        {dispTitle}
                    </h3>
                    <p className="font-label text-[9px] text-primary/80 tracking-[0.2em] uppercase mt-3 group-hover:text-primary transition-colors">
                        {course.instructor}
                    </p>
                </div>
            </Link>
        </motion.div>
    );
};

export default ModuleCard;
