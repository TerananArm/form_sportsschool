// app/dashboard/curriculum/page.js
'use client';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSound } from '../../context/SoundContext';
import { ListChecks, Save, RotateCcw, Check, BookOpen, ArrowLeft, ChevronDown, Loader2, Wand2 } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { useRouter } from 'next/navigation';

export default function CurriculumPage() {
    const { isDarkMode } = useTheme();
    const { t } = useLanguage();
    const router = useRouter();

    const [level, setLevel] = useState('');
    const [dept, setDept] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [checkedIds, setCheckedIds] = useState(new Set());
    const [recommendedIds, setRecommendedIds] = useState(new Set()); // ✅ AI Recommendations
    const [loading, setLoading] = useState(false);

    const [options, setOptions] = useState({ levels: [], depts: [] });
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    useEffect(() => {
        const init = async () => {
            const [l, d] = await Promise.all([
                fetch('/api/dashboard/data?type=class_levels').then(r => r.json()),
                fetch('/api/dashboard/data?type=departments').then(r => r.json())
            ]);
            setOptions({ levels: l, depts: d });
        };
        init();
    }, []);

    useEffect(() => {
        if (level && dept) fetchCurriculum();
    }, [level, dept]);

    const fetchCurriculum = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/curriculum?level=${level}&dept=${dept}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setSubjects(data);
                setCheckedIds(new Set(data.filter(s => s.is_enrolled).map(s => s.id)));
            } else {
                setSubjects([]);
                setCheckedIds(new Set());
                console.error("Invalid data format:", data);
            }
            setRecommendedIds(new Set()); // Reset recommendations on new fetch
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAskAI = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ai-curriculum', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ department: dept, classLevel: level })
            });
            const result = await res.json();
            if (result.recommendedIds) {
                // Ensure IDs are numbers (DB uses Int)
                const recIds = result.recommendedIds.map(id => Number(id));
                setRecommendedIds(new Set(recIds));
                setConfirmConfig({ isOpen: true, title: t('aiRecommendSuccess'), message: `${t('aiRecommendMessage')} (${recIds.length} ${t('unitSubject')})`, type: 'success' });
            }
        } catch (e) {
            setConfirmConfig({ isOpen: true, title: t('error'), message: t('aiRecommendError'), type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/dashboard/curriculum', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level, dept, subject_ids: Array.from(checkedIds) })
            });
            if (res.ok) setConfirmConfig({ isOpen: true, title: t('saveSuccess'), message: t('saveSuccess'), type: 'success' });
        } catch (e) { setConfirmConfig({ isOpen: true, title: t('error'), message: t('saveSuccess'), type: 'danger' }); } // Reusing saveSuccess as placeholder for error msg if needed or just 'Error'
        finally { setLoading(false); }
    };

    const toggle = (id) => {
        const newSet = new Set(checkedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setCheckedIds(newSet);
    };

    // --- STYLES ---
    const cardClass = `w-full rounded-[40px] p-8 md:p-12 shadow-2xl transition-all border backdrop-blur-3xl backdrop-saturate-150 relative overflow-hidden group ${isDarkMode ? 'bg-slate-800/60 border-white/10 shadow-black/50' : 'bg-slate-200/70 border-white/40 shadow-slate-300'}`;

    const inputClass = `w-full h-14 px-6 pr-12 rounded-2xl border-2 outline-none transition-all font-medium backdrop-blur-md appearance-none ${isDarkMode
        ? 'bg-slate-900/50 border-white/10 text-white focus:border-red-500 focus:bg-slate-900/70'
        : 'bg-white/40 border-slate-200 text-slate-900 focus:border-red-500 focus:bg-white focus:shadow-sm'
        }`;

    return (
        <div className="pb-20 max-w-5xl mx-auto animate-fade-in px-4">
            <ConfirmModal isOpen={confirmConfig.isOpen} {...confirmConfig} onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })} />

            {/* Main Content Card */}
            <div className={`${cardClass} animate-slide-up delay-100`}>
                {/* Texture Overlay */}
                <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none"></div>

                {/* Unified Header */}
                <div className={`flex items-start gap-6 mb-8 pb-6 border-b relative z-10 ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
                    <button onClick={() => router.back()} className={`p-4 rounded-full transition-all border backdrop-blur-md shadow-sm active:scale-95 group ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-white/40 hover:bg-white/60 border-white/40 text-slate-700'}`}>
                        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className={`text-4xl font-black tracking-tight drop-shadow-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                            {t('curriculumTitle')}
                        </h1>
                        <p className={`mt-1 text-lg font-medium ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                            {t('curriculumDesc')}
                        </p>
                    </div>
                </div>

                {/* Filter Section - Department FIRST, then Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
                    <div>
                        <label className={`block text-sm font-bold uppercase tracking-wider pl-1 mb-2 ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>{t('department')}</label>
                        <div className="relative">
                            <select className={inputClass} value={dept} onChange={e => { setDept(e.target.value); setLevel(''); setSubjects([]); setCheckedIds(new Set()); }}>
                                <option value="">{t('selectDept')}</option>
                                {options.depts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                            </select>
                            <ChevronDown size={18} className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`} />
                        </div>
                    </div>
                    <div>
                        <label className={`block text-sm font-bold uppercase tracking-wider pl-1 mb-2 ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>{t('classLevel')}</label>
                        <div className="relative">
                            <select
                                className={inputClass}
                                value={level}
                                onChange={e => { setLevel(e.target.value); setSubjects([]); setCheckedIds(new Set()); }}
                                disabled={!dept}
                            >
                                <option value="">{dept ? t('selectLevel') : 'เลือกแผนกก่อน'}</option>
                                {/* Filter levels by selected department */}
                                {options.levels
                                    ?.filter(l => l.department_name === dept)
                                    .map(l => <option key={l.id} value={l.level}>{l.level}</option>)
                                }
                            </select>
                            <ChevronDown size={18} className={`absolute right-4 top-1/2 -translate-y-1/2 opacity-50 ${isDarkMode ? 'text-white' : 'text-slate-800'}`} />
                        </div>
                    </div>
                </div>

                {/* Subject List and Actions */}
                {level && dept && (
                    <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-full ${isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-800'}`}><BookOpen size={24} /></div>
                                <div>
                                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t('allSubjects')}</h3>
                                    <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>{t('selectSubjectsDesc')}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="text-lg font-black text-red-500 px-3 py-1.5 rounded-xl border border-red-500/30 backdrop-blur-md">
                                    {t('selectedCount')} {checkedIds.size} {t('unitSubject')}
                                </div>
                            </div>
                        </div>

                        <div className={`max-h-[500px] overflow-y-auto custom-scrollbar pr-4 space-y-2 border p-4 rounded-[20px] ${isDarkMode ? 'bg-slate-900/40 border-white/10' : 'bg-white/40 border-white/40'}`}>
                            {loading && <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-red-500" size={32} /></div>}
                            {!loading && (() => {
                                const targetDept = options.depts?.find(d => d.name === dept);
                                const targetDeptId = targetDept ? targetDept.id : null;

                                return subjects
                                    .sort((a, b) => {
                                        // 1. Same Department
                                        const aIsDept = a.departmentId === targetDeptId ? 1 : 0;
                                        const bIsDept = b.departmentId === targetDeptId ? 1 : 0;
                                        if (bIsDept !== aIsDept) return bIsDept - aIsDept;

                                        return 0;
                                    })
                                    .map(s => {
                                        const isChecked = checkedIds.has(s.id);
                                        const isDeptSubject = s.departmentId === targetDeptId;

                                        return (
                                            <div
                                                key={s.id}
                                                onClick={() => toggle(s.id)}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 
                                            ${isChecked
                                                        ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 shadow-md'
                                                        : isDeptSubject
                                                            ? `border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800 hover:bg-blue-100` // Dept Highlight
                                                            : `border-transparent hover:bg-white/40 ${isDarkMode ? 'hover:bg-white/10' : ''}`
                                                    }
                                        `}
                                            >
                                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-150 shrink-0 ${isChecked ? 'bg-emerald-600 border-emerald-600' : 'border-slate-400'}`}>
                                                    {isChecked && <Check size={16} className="text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`font-mono text-base font-bold ${isChecked ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>{s.code}</div>

                                                        {/* Department Badge */}
                                                        {isDeptSubject && (
                                                            <span className="px-2 py-0.5 rounded-md bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                                                                <BookOpen size={10} /> วิชาแผนก
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`font-bold text-lg ${isChecked ? 'text-emerald-950 dark:text-emerald-100' : 'text-slate-900 dark:text-white'}`}>{s.name}</div>
                                                </div>
                                                <div className={`text-sm font-bold w-16 text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{s.credit} {t('credit')}</div>
                                            </div>
                                        );
                                    });
                            })()}

                            {!loading && subjects.length === 0 && (
                                <div className="p-16 text-center">
                                    <BookOpen className={`mx-auto mb-4 ${isDarkMode ? 'text-white/50' : 'text-slate-400'}`} size={48} />
                                    <p className={`text-xl font-medium ${isDarkMode ? 'text-white/80' : 'text-slate-600'}`}>{t('noSubjectsFound')}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8">
                            <button onClick={handleSave} disabled={loading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-lg shadow-xl shadow-red-500/20 hover:shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />} {t('saveData')}
                            </button>
                        </div>
                    </div>
                )}

                {!(level && dept) && (
                    <div className="text-center py-16">
                        <ListChecks className={`mx-auto mb-4 ${isDarkMode ? 'text-white/50' : 'text-slate-400'}`} size={64} />
                        <p className={`text-xl font-medium ${isDarkMode ? 'text-white/80' : 'text-slate-600'}`}>{t('selectLevelDeptFirst')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}