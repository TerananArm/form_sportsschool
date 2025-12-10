'use client';
import { BrainCircuit, Search, Database, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function AgentProcess({ step, logs = [] }) {
    const { isDarkMode } = useTheme();
    const { t } = useLanguage();

    const steps = [
        { id: 1, label: 'Planning', desc: t('agentPlanning'), icon: Search, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 2, label: 'Reasoning', desc: t('agentReasoning'), icon: BrainCircuit, color: 'text-violet-500', bg: 'bg-violet-500/10' },
        { id: 3, label: 'Action', desc: t('agentAction'), icon: Database, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { id: 4, label: 'Review', desc: t('agentReview'), icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    ];

    const currentStepIdx = steps.findIndex(s => s.label === step);
    const activeStep = steps[currentStepIdx !== -1 ? currentStepIdx : 0];

    return (
        <div className={`w-full max-w-2xl mx-auto rounded-[30px] overflow-hidden border backdrop-blur-3xl shadow-2xl transition-all duration-500 ${isDarkMode ? 'bg-slate-900/80 border-white/10 shadow-black/50' : 'bg-white/80 border-white/40 shadow-slate-300'}`}>

            {/* Header: Agent Status */}
            <div className={`p-8 text-center border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                <div className="relative inline-block mb-4">
                    <div className={`absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse ${isDarkMode ? 'bg-violet-500' : 'bg-violet-400'}`}></div>
                    <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner border ${isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}>
                        <Sparkles className={`w-10 h-10 animate-spin-slow ${activeStep.color}`} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                    </div>
                </div>

                <h2 className={`text-2xl font-black tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    {t('autoGenTitle')}
                </h2>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t('autoGenMessage')}
                </p>
            </div>

            {/* Process Steps */}
            <div className="p-8 grid grid-cols-4 gap-4 relative">
                {/* Connecting Line */}
                <div className={`absolute top-1/2 left-10 right-10 h-1 -translate-y-1/2 rounded-full z-0 ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500 rounded-full transition-all duration-1000 ease-in-out"
                        style={{ width: `${((currentStepIdx + 1) / steps.length) * 100}%` }}
                    />
                </div>

                {steps.map((s, idx) => {
                    const isActive = idx === currentStepIdx;
                    const isCompleted = idx < currentStepIdx;

                    return (
                        <div key={s.id} className="relative z-10 flex flex-col items-center gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 
                                ${isActive
                                    ? `${s.bg} ${s.color} border-current scale-110 shadow-lg`
                                    : isCompleted
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : `${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-600' : 'bg-white border-slate-200 text-slate-300'}`
                                }`
                            }>
                                {isCompleted ? <CheckCircle2 size={20} /> : <s.icon size={20} className={isActive ? 'animate-pulse' : ''} />}
                            </div>
                            <div className="text-center">
                                <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 transition-colors ${isActive ? s.color : isCompleted ? 'text-emerald-500' : 'opacity-40'}`}>
                                    {s.label}
                                </p>
                                <p className={`text-[10px] font-medium hidden md:block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {s.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Live Logs Terminal */}
            <div className={`mx-8 mb-8 rounded-xl p-4 font-mono text-xs h-32 overflow-y-auto custom-scrollbar border ${isDarkMode ? 'bg-black/40 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <div className="flex items-center gap-2 mb-2 opacity-50 border-b pb-2 border-dashed border-current">
                    <Loader2 size={10} className="animate-spin" />
                    <span>AGENT_LOGS_STREAM</span>
                </div>
                <div className="space-y-1.5">
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-2 animate-fade-in">
                            <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                            <span className={log.type === 'error' ? 'text-red-500' : log.type === 'success' ? 'text-emerald-500' : ''}>
                                {log.message}
                            </span>
                        </div>
                    ))}
                    <div className="animate-pulse opacity-50">_</div>
                </div>
            </div>

        </div>
    );
}
