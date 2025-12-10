'use client';
import { Loader2, Sparkles } from 'lucide-react';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F5F5F7]/80 dark:bg-[#0D1117]/80 backdrop-blur-xl transition-all duration-500">
            <div className="relative flex flex-col items-center justify-center">

                {/* Outer Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 via-purple-500/30 to-pink-500/30 blur-[100px] rounded-full animate-pulse"></div>

                {/* Glass Container */}
                <div className="relative w-32 h-32 rounded-[32px] bg-white/10 dark:bg-black/20 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-2xl flex items-center justify-center overflow-hidden group">

                    {/* Inner Rotating Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent rotate-45 translate-y-full group-hover:translate-y-[-200%] transition-transform duration-1000"></div>

                    {/* Icon */}
                    <div className="relative z-10">
                        <div className="absolute inset-0 animate-ping opacity-50">
                            <Sparkles size={48} className="text-blue-400 dark:text-blue-500" />
                        </div>
                        <Loader2 size={48} className="animate-spin text-slate-800 dark:text-white" />
                    </div>
                </div>

                {/* Text */}
                <div className="mt-8 text-center space-y-2">
                    <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-white animate-pulse">
                        EduSched AI
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        กำลังโหลดข้อมูล...
                    </p>
                </div>
            </div>
        </div>
    );
}
