// app/components/AnimatedBackground.js
'use client';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';

export default function AnimatedBackground() {
    const { isDarkMode } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            {/* Base Gradient */}
            <div className={`absolute inset-0 transition-all duration-1000 ${isDarkMode
                    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
                    : 'bg-gradient-to-br from-blue-50 via-white to-rose-50'
                }`} />

            {/* Animated Mesh Gradient */}
            <div className="mesh-gradient absolute inset-0" />

            {/* Floating Orbs */}
            <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-drift ${isDarkMode ? 'bg-red-500/10' : 'bg-red-300/20'
                }`} />
            <div className={`absolute top-1/2 right-1/4 w-80 h-80 rounded-full blur-3xl animate-drift-slow ${isDarkMode ? 'bg-purple-500/10' : 'bg-purple-300/15'
                }`} />
            <div className={`absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full blur-3xl animate-drift-reverse ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-300/15'
                }`} />
            <div className={`absolute top-1/3 right-1/3 w-64 h-64 rounded-full blur-3xl animate-blob ${isDarkMode ? 'bg-emerald-500/8' : 'bg-emerald-300/10'
                }`} />

            {/* Grid Pattern */}
            <div className={`absolute inset-0 ${isDarkMode
                    ? 'bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]'
                    : 'bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)]'
                }`} style={{ backgroundSize: '60px 60px' }} />

            {/* Floating Particles */}
            {[...Array(8)].map((_, i) => (
                <div
                    key={i}
                    className={`particle ${isDarkMode ? 'bg-white/10' : 'bg-slate-400/20'}`}
                    style={{
                        width: `${Math.random() * 8 + 4}px`,
                        height: `${Math.random() * 8 + 4}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${i * 2}s`,
                        animationDuration: `${15 + Math.random() * 10}s`,
                    }}
                />
            ))}

            {/* Subtle Noise Texture */}
            <div className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                }}
            />
        </div>
    );
}
