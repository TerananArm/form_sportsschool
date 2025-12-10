'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, RotateCcw, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import ConfirmModal from '../../components/ConfirmModal';

export default function LevelsPage() {
    const router = useRouter();
    const { isDarkMode } = useTheme();
    const { t } = useLanguage();

    const [formData, setFormData] = useState({ name: '', department_id: '' });
    const [depts, setDepts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const res = await fetch('/api/dashboard/data?type=departments');
                if (res.ok) setDepts(await res.json());
            } catch (e) { console.error(e); }
        };
        fetchDepts();
    }, []);

    const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/dashboard/levels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setConfirmConfig({
                    isOpen: true,
                    title: t('saveSuccess'),
                    message: t('levelSaveSuccess'),
                    type: 'success',
                    onConfirm: () => {
                        setFormData({ name: '', department_id: '' });
                    }
                });
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            setConfirmConfig({ isOpen: true, title: t('error'), message: t('errorMsg'), type: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = async () => {
        const result = await Swal.fire({
            title: t('confirmClear'),
            text: t('confirmClearMessage') || 'คุณต้องการล้างข้อมูลในฟอร์มใช่หรือไม่?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3b82f6',
            confirmButtonText: t('adminRole') === 'ผู้ดูแลระบบ' ? 'ล้างข้อมูล' : 'Clear', // Fallback if t(clear) missing
            cancelButtonText: t('cancel'),
            background: isDarkMode ? '#1e293b' : '#fff',
            color: isDarkMode ? '#fff' : '#000'
        });

        if (result.isConfirmed) {
            setFormData({ name: '', department_id: '' });
        }
    };

    // ✅ Form Style: Gray Blur (Matches [menu]/page.js)
    const cardClass = `rounded-[40px] shadow-2xl p-10 transition-all duration-300 border backdrop-blur-3xl backdrop-saturate-150 ${isDarkMode ? 'bg-slate-800/60 border-white/10 shadow-black/50' : 'bg-slate-200/70 border-white/40 shadow-slate-300'}`;

    const inputClass = `w-full h-14 px-6 rounded-2xl border-2 outline-none transition-all placeholder-gray-400 font-medium backdrop-blur-md ${isDarkMode
        ? 'bg-slate-900/50 border-white/10 text-white focus:border-red-500 focus:bg-slate-900/70'
        : 'bg-white/40 border-white/40 text-slate-800 focus:border-red-500 focus:bg-white/80'
        }`;

    return (
        <div className="pb-20 max-w-5xl mx-auto animate-fade-in flex items-center justify-center min-h-[calc(100vh-120px)]">
            <ConfirmModal isOpen={confirmConfig.isOpen} {...confirmConfig} onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })} />

            <div className={`w-full ${cardClass}`}>

                {/* Header */}
                <div className={`flex items-center gap-5 mb-10 pb-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
                    <button onClick={() => router.back()} className={`p-3.5 rounded-full transition-all border backdrop-blur-md shadow-sm ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-white/40 hover:bg-white/60 border-white/40 text-slate-700'}`}>
                        <ArrowLeft size={28} />
                    </button>
                    <div>
                        <h1 className={`text-4xl font-black tracking-tight drop-shadow-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t('addLevelTitle')}</h1>
                        <p className={`mt-1 text-lg font-medium ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>{t('addLevelDesc')}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-2.5">
                            <label className={`block text-sm font-bold uppercase tracking-wider opacity-80 pl-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                {t('levelName')}
                            </label>
                            <input
                                type="text"
                                name="name"
                                placeholder={t('levelNamePlaceholder')}
                                value={formData.name}
                                onChange={handleChange}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className={`block text-sm font-bold uppercase tracking-wider opacity-80 pl-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                {t('department')}
                            </label>
                            <div className="relative">
                                <select name="department_id" onChange={handleChange} className={inputClass} value={formData.department_id} required>
                                    <option value="">{t('selectDept')}</option>
                                    {depts.map(d => <option key={d.id} value={d.id} className="text-black">{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className={`pt-8 flex gap-4 border-t mt-4 ${isDarkMode ? 'border-white/10' : 'border-white/20'}`}>
                        <button type="submit" disabled={isLoading} className="flex-1 py-4 text-white font-bold text-lg rounded-2xl shadow-xl transition-all transform active:scale-[0.98] hover:shadow-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500">
                            {isLoading ? t('saving') : <span className="flex items-center justify-center gap-2"><Save size={22} /> {t('saveData')}</span>}
                        </button>
                        <button type="button" onClick={handleClear} className={`px-8 py-4 font-bold text-lg rounded-2xl border transition-all active:scale-[0.98] flex items-center gap-2 backdrop-blur-md ${isDarkMode ? 'bg-slate-700 border-white/10 hover:bg-slate-600 text-white' : 'bg-white/40 border-white/40 hover:bg-white/60 text-slate-700'}`}><RotateCcw size={22} /> {t('clearForm')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
