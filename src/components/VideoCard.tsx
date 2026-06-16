import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Lesson } from '../context/DataContext';
import { getYouTubeId } from '../lib/youtube';

interface VideoCardProps {
    lesson: Lesson;
    courseTitle: string;
    instructor: string;
    index: number;
}

const VideoCard: React.FC<VideoCardProps> = ({ lesson, courseTitle, instructor, index }) => {
    const lessonLink = `/lesson/${lesson.id}`;
    const progress = lesson.progress ?? 0;
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);

    const ytVideoId = getYouTubeId(lesson.videoUrl || '');
    const displayThumbnail = lesson.thumbnailUrl || (ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg` : null);

    if (isPlayingPreview) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="shrink-0 w-[280px] md:w-[360px] snap-center md:snap-start"
            >
                <div className="relative aspect-video rounded-3xl overflow-hidden border border-primary bg-black shadow-2xl">
                    {ytVideoId ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&modestbranding=1&rel=0`}
                            className="w-full h-full border-0"
                            allow="autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                        />
                    ) : lesson.videoUrl ? (
                        <video
                            src={lesson.videoUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            controls
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#0E0E10]">
                            <span className="text-white/40 text-xs font-label">Sem sinal de vídeo</span>
                        </div>
                    )}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsPlayingPreview(false);
                        }}
                        className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/80 hover:bg-black border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all shadow-lg hover:scale-105 active:scale-95"
                        title="Fechar Preview"
                    >
                        <span className="material-symbols-outlined text-sm font-bold">close</span>
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.05 }}
            className="shrink-0 w-[280px] md:w-[360px] snap-center md:snap-start"
        >
            <Link to={lessonLink} className="group block relative aspect-video rounded-3xl overflow-hidden border border-white/10 hover:border-primary/45 bg-[#0A0E17] transition-all duration-500 shadow-2xl">
                {/* Background Video Thumbnail */}
                {displayThumbnail ? (
                    <img 
                        src={displayThumbnail} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out origin-center" 
                        alt={lesson.title}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0e1726] to-[#05080f] flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/5 text-4xl">motion_photos_on</span>
                    </div>
                )}

                {/* Ambient dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90"></div>

                {/* Hover Play Button Overlay (Triggers Preview) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsPlayingPreview(true);
                        }}
                        className="w-14 h-14 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center backdrop-blur-md shadow-lg scale-90 group-hover:scale-100 transition-transform duration-500 hover:bg-primary/40 hover:scale-110 active:scale-95"
                        title="Ver Preview"
                    >
                        <span className="material-symbols-outlined text-primary text-2xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </div>
                    <span className="font-label text-[9px] text-primary tracking-[0.25em] uppercase font-bold bg-black/60 px-3 py-1 rounded-full border border-primary/20 backdrop-blur-sm">
                        Ver Preview
                    </span>
                </div>

                {/* Category Badge (Top Left) */}
                <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md font-label text-[8px] tracking-[0.15em] uppercase text-white/80 font-bold">
                        {courseTitle}
                    </span>
                </div>

                {/* Duration Badge (Top Right) */}
                <div className="absolute top-4 right-4 z-10">
                    <span className="px-2 py-0.5 rounded bg-black/60 border border-white/5 backdrop-blur-md font-label text-[8px] tracking-widest text-white/70">
                        {lesson.duration || '00:00'}
                    </span>
                </div>

                {/* Lesson Details (Bottom Overlay) */}
                <div className="absolute bottom-5 inset-x-5 z-10 flex flex-col justify-end">
                    <span className="font-label text-[8px] text-primary tracking-[0.2em] uppercase mb-1 font-bold">
                        {instructor}
                    </span>
                    <h4 className="font-headline text-sm md:text-base font-bold text-white/95 truncate uppercase leading-tight group-hover:text-white transition-colors">
                        {lesson.title}
                    </h4>
                </div>

                {/* Bottom Edge Progress Bar */}
                {progress > 0 && (
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10">
                        <div 
                            className="h-full bg-primary transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </Link>
        </motion.div>
    );
};

export default VideoCard;
