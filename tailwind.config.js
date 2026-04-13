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
                "primary": "#00F5FF",
                "primary-hover": "#00E5FF",
                "secondary": "#00BFFF",
                "surface-container-lowest": "#050B14",
                "surface-container-low": "#0A1628",
                "surface-container": "#0D1F3C",
                "surface-container-high": "#121F3A",
                "surface-container-highest": "#192B4D",
                "surface-variant": "#0A1628",
                "surface-glass": "rgba(5, 11, 20, 0.6)",
                "border-light": "rgba(0, 245, 255, 0.15)",
                "border-accent": "rgba(0, 245, 255, 0.3)",
                "outline": "rgba(0, 245, 255, 0.2)",
                "outline-variant": "rgba(0, 245, 255, 0.1)",
                "inverse-on-surface": "#8BB8CC",
                "on-surface": "#E8F4F8",
                "on-background": "#E8F4F8",
                "text-muted": "#8BB8CC"
            },
            fontFamily: {
                "headline": ["Montserrat", "sans-serif"],
                "body": ["Inter", "sans-serif"],
                "label": ["Inter", "sans-serif"],
                "mono": ["JetBrains Mono", "monospace"],
                "oxanium": ["Montserrat", "sans-serif"]
            }
        },
    },
    plugins: [],
}
