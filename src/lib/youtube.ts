// YouTube IFrame API helpers

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady?: () => void;
    }
}

let _apiPromise: Promise<void> | null = null;

export const loadYouTubeAPI = (): Promise<void> => {
    if (typeof window === 'undefined') return Promise.resolve();
    if (window.YT?.Player) return Promise.resolve();
    if (_apiPromise) return _apiPromise;

    _apiPromise = new Promise<void>((resolve) => {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
        if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
        }
    });
    return _apiPromise;
};

export const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m?.[1] ?? null;
};

export const getYouTubeThumbnail = (id: string): string =>
    `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

export const getYouTubeDuration = (videoId: string): Promise<number> => {
    return new Promise(async (resolve) => {
        try {
            await loadYouTubeAPI();
            const divId = `yt-dur-${Date.now()}`;
            const div = document.createElement('div');
            div.id = divId;
            div.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:320px;height:180px;';
            document.body.appendChild(div);

            new window.YT.Player(divId, {
                videoId,
                playerVars: { autoplay: 0, controls: 0, mute: 1 },
                events: {
                    onReady: (e: any) => {
                        const secs = e.target.getDuration?.() ?? 0;
                        setTimeout(() => {
                            try { e.target.destroy(); } catch { }
                            try { document.body.removeChild(div); } catch { }
                        }, 300);
                        resolve(secs > 0 ? secs : 0);
                    },
                    onError: () => {
                        try { document.body.removeChild(div); } catch { }
                        resolve(0);
                    }
                }
            });
        } catch { resolve(0); }
    });
};

export const fmtDuration = (secs: number): string => {
    if (!secs || secs <= 0) return '00h 00m';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
};
