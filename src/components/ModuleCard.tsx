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
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                            alt={dispTitle}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/0" />
                    )}
                </div>

                {/* Bottom Content (Glass Footer) */}
                <div className="module-card-overlay-bottom backdrop-blur-md z-20 flex flex-col items-center text-center">
                    <p className="font-label text-[8px] md:text-[10px] text-white/40 tracking-[0.3em] uppercase mb-1">
                        {dispSubtitle}
                    </p>
                    <h3 className="font-headline text-lg md:text-2xl font-bold text-white tracking-widest uppercase truncate w-full group-hover:text-primary transition-all">
                        {dispTitle}
                    </h3>
                    <div className="mt-3 py-1 px-4 rounded-full bg-white/5 border border-white/5 group-hover:bg-white/10 group-hover:border-white/10 transition-all">
                        <p className="font-label text-[8px] md:text-[9px] text-white/30 tracking-widest uppercase">
                            {course.instructor}
                        </p>
                    </div>
                </div>

                {/* Hover progress indicator or detail */}
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[8px] font-bold text-white uppercase tracking-widest">{course.progress}%</span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default ModuleCard;
