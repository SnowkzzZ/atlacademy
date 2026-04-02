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
                "primary": "#00FF87",
                "primary-container": "#00fd86",
                "surface-container-lowest": "#000000",
                "surface-container-low": "#080808",
                "surface-container": "#0C0C0C",
                "surface-container-high": "#121212",
                "surface-container-highest": "#1A1A1A",
                "surface-variant": "#1A1A1A",
                "surface-glass": "#050505",
                "border-light": "rgba(255, 255, 255, 0.05)",
                "border-accent": "rgba(0, 255, 135, 0.15)",
                "outline": "#757575",
                "outline-variant": "#484848",
                "inverse-on-surface": "#555555",
                "on-surface": "#ffffff",
                "on-background": "#ffffff"
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
