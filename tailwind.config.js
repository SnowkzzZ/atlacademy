/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#00F0FF",
                "primary-hover": "#00D6E6",
                "secondary": "#00BFFF",
                "surface-container-lowest": "#000000",
                "surface-container-low": "#080808",
                "surface-container": "#0E0E10",
                "surface-container-high": "#151518",
                "surface-container-highest": "#1C1C21",
                "surface-variant": "#0A0A0C",
                "surface-glass": "rgba(0, 0, 0, 0.7)",
                "border-light": "rgba(255, 255, 255, 0.06)",
                "border-accent": "rgba(0, 240, 255, 0.3)",
                "outline": "rgba(255, 255, 255, 0.08)",
                "outline-variant": "rgba(255, 255, 255, 0.04)",
                "inverse-on-surface": "#FFFFFF",
                "on-surface": "#F5F5F7",
                "on-background": "#FFFFFF",
                "text-muted": "#8E8E93"
            },
            fontFamily: {
                "headline": ["Outfit", "Inter", "sans-serif"],
                "body": ["Inter", "sans-serif"],
                "label": ["Inter", "sans-serif"],
                "mono": ["SF Mono", "JetBrains Mono", "monospace"],
                "oxanium": ["Outfit", "sans-serif"]
            }
        },
    },
    plugins: [],
}
