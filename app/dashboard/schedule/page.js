// app/dashboard/schedule/page.js
'use client';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSound } from '../../context/SoundContext';
import {
    Plus, Wand2, Printer, FileSpreadsheet, Trash2,
    RotateCcw, ChevronDown, Filter, CalendarCheck, ArrowLeft, Loader2, Search, X
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import AgentProcess from '../../components/AgentProcess';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export default function SchedulePage() {
    const { isDarkMode } = useTheme();
    const { t } = useLanguage();
    const { play } = useSound();
    const router = useRouter();

    // States
    const currentYear = new Date().getFullYear() + 543;
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const defaultTerm = (currentMonth >= 10 || currentMonth <= 3) ? `2/${currentYear}` : `1/${currentYear}`;
    const [filters, setFilters] = useState({ term: defaultTerm, department: '', classLevel: '', teacher: '' });
    const [scheduleData, setScheduleData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    // ✅ Agent State
    const [agentStep, setAgentStep] = useState('Planning');
    const [agentLogs, setAgentLogs] = useState([]);
    const [showTable, setShowTable] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [mounted, setMounted] = useState(false); // ✅ Mounted State

    useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

    // Modal Data States
    const [manualFormData, setManualFormData] = useState({ day: 'วันจันทร์', subject_id: '', teacher_id: '', class_level: '', start_period: 1, duration: 1, room_id: '' });
    const [clearFormData, setClearFormData] = useState({ mode: 'all', value: '' });

    // Options
    const [options, setOptions] = useState({
        terms: [`1/${currentYear}`, `2/${currentYear}`, `1/${currentYear + 1}`],
        depts: [],
        levels: [],
        teachers: [],
        subjects: [],
        rooms: []
    });

    // Modal Control
    const [showManualModal, setShowManualModal] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    // ✅ Helper: ฟังก์ชันดึงข้อมูลแบบปลอดภัย (ป้องกันเว็บพังถ้า API Error)
    const safeFetch = async (url) => {
        try {
            const res = await fetch(url);
            if (!res.ok) return []; // ถ้าไม่ OK ให้คืนค่าว่าง
            const data = await res.json();
            // ตรวจสอบว่าเป็น Array หรือไม่ ถ้าไม่ใช่ (เช่น เป็น Error Object) ให้คืนค่าว่าง
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error(`Error fetching ${url}:`, e);
            return [];
        }
    };

    // Initial Fetch Options & Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // ใช้ safeFetch แทน fetch ปกติ
                const [d, l, t, s, r] = await Promise.all([
                    safeFetch('/api/dashboard/data?type=departments'),
                    safeFetch('/api/dashboard/data?type=class_levels'),
                    safeFetch('/api/dashboard/data?type=teachers'),
                    safeFetch('/api/dashboard/data?type=subjects'),
                    safeFetch('/api/dashboard/data?type=rooms'),
                ]);

                setOptions(prev => ({
                    ...prev,
                    depts: d,
                    levels: l,
                    teachers: t,
                    subjects: s.map(sub => ({ ...sub, teacher_id: sub.teacher_id || '', teacher_room_id: sub.teacher_room_id || '' })),
                    rooms: r
                }));

                if (!filters.term && options.terms.length > 0) setFilters(prev => ({ ...prev, term: options.terms[0] }));

            } catch (e) { console.error(e); }
        };
        fetchData();
    }, []);

    // Fetch Schedule Trigger
    useEffect(() => {
        if (filters.department && filters.classLevel) {
            fetchSchedule();
            setShowTable(true);
        } else {
            setShowTable(false);
            setScheduleData({});
        }
    }, [filters.department, filters.classLevel, filters.term, filters.teacher]);

    const fetchSchedule = async () => {
        setLoading(true);
        setSelectedIds(new Set());
        try {
            const q = new URLSearchParams(filters).toString();
            const res = await fetch(`/api/dashboard/schedule?${q}`);
            // เช็คก่อนแปลงเป็น JSON
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setScheduleData(data || {});
        } catch (error) {
            setScheduleData({});
            setConfirmConfig({ isOpen: true, title: 'ผิดพลาด', message: 'ไม่สามารถดึงข้อมูลตารางสอนได้ (ตรวจสอบการเชื่อมต่อ Database)', type: 'danger' });
        }
        finally { setLoading(false); }
    };

    // --- Handle Forms & Actions ---

    // 1. Manual Add Submission
    const handleManualAddSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setShowManualModal(false);
        try {
            const res = await fetch('/api/dashboard/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'manual_add', data: { ...manualFormData, term: filters.term } }),
            });

            const result = await res.json();
            if (res.ok) {
                setConfirmConfig({ isOpen: true, title: 'เพิ่มสำเร็จ', message: result.message, type: 'success', onConfirm: fetchSchedule });
            } else if (res.status === 409) {
                setConfirmConfig({ isOpen: true, title: 'เพิ่มไม่สำเร็จ', message: result.message, type: 'warning' });
            } else {
                setConfirmConfig({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: result.message, type: 'danger' });
            }
        } catch (error) {
            setConfirmConfig({ isOpen: true, title: 'ข้อผิดพลาด', message: 'การเชื่อมต่อขัดข้อง', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    // 2. Clear Table Submission
    const handleClearSubmit = async (mode, value) => {
        setShowClearModal(false);
        setLoading(true);
        try {
            const res = await fetch('/api/dashboard/schedule', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear_table', mode: mode, term: filters.term, value: value }),
            });
            const result = await res.json();
            if (res.ok) {
                setConfirmConfig({ isOpen: true, title: 'ล้างข้อมูลสำเร็จ', message: result.message, type: 'success', onConfirm: fetchSchedule });
            } else {
                setConfirmConfig({ isOpen: true, title: 'ล้างข้อมูลไม่สำเร็จ', message: result.message, type: 'danger' });
            }
        } catch (error) {
            setConfirmConfig({ isOpen: true, title: 'ข้อผิดพลาด', message: 'การเชื่อมต่อขัดข้อง', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    // 3. Auto Generate Submission (✅ เชื่อมต่อ AI)
    const handleAutoGenerate = () => {
        // Case 1: Generate Single Class (Existing Logic)
        if (filters.department && filters.classLevel) {
            setConfirmConfig({
                isOpen: true,
                title: t('autoGenTitle'),
                message: `ระบบจะลบตารางสอนเก่าของ "${filters.classLevel}" ออกทั้งหมดและจัดใหม่โดยใช้ AI \nยืนยันหรือไม่?`,
                confirmText: t('confirm'),
                cancelText: t('cancel'),
                type: 'warning',
                onConfirm: () => generateSingleSchedule(filters.classLevel, filters.department)
            });
            return;
        }

        // Case 2: Generate ALL Classes (New Logic)
        setConfirmConfig({
            isOpen: true,
            title: t('autoGenTitle'),
            message: t('autoGenMessage'),
            confirmText: t('autoGenConfirm'),
            cancelText: t('cancel'),
            type: 'warning',
            onConfirm: generateAllSchedules
        });
    };

    const generateSingleSchedule = async (classLevel, department) => {
        setLoading(true);
        setAgentStep('Planning');
        setAgentLogs([{ message: 'Analyzing constraints...', type: 'info' }]);

        try {
            // Simulate Thinking Process
            await new Promise(r => setTimeout(r, 800));
            setAgentStep('Reasoning');
            setAgentLogs(prev => [...prev, { message: 'Designing optimal strategy...', type: 'info' }]);

            await new Promise(r => setTimeout(r, 800));
            setAgentStep('Action');
            setAgentLogs(prev => [...prev, { message: `Assigning schedule for ${classLevel}...`, type: 'info' }]);

            const res = await fetch('/api/ai-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    term: filters.term,
                    department: department,
                    classLevel: classLevel
                }),
            });

            setAgentStep('Review');
            setAgentLogs(prev => [...prev, { message: 'Verifying conflicts...', type: 'info' }]);
            await new Promise(r => setTimeout(r, 600));

            const result = await res.json();
            if (res.ok) {
                setAgentLogs(prev => [...prev, { message: 'Optimization Complete!', type: 'success' }]);
                setConfirmConfig({ isOpen: true, title: t('success'), message: result.message, type: 'success', onConfirm: fetchSchedule });
            } else {
                setAgentLogs(prev => [...prev, { message: 'Error: ' + result.message, type: 'error' }]);
                setConfirmConfig({ isOpen: true, title: t('error'), message: result.message, type: 'danger' });
            }
        } catch (error) {
            setAgentLogs(prev => [...prev, { message: 'Connection Failed', type: 'error' }]);
            setConfirmConfig({ isOpen: true, title: t('error'), message: 'AI ไม่ตอบสนอง', type: 'danger' });
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };

    const generateAllSchedules = async () => {
        setLoading(true);
        setAgentStep('Planning');
        setAgentLogs([{ message: 'Initializing Batch Process...', type: 'info' }]);

        const total = options.levels.length;
        let successCount = 0;
        let failCount = 0;
        let skippedCount = 0;
        let failures = []; // Store failure details

        // Fetch all curriculum data once to check rules
        let allCurriculum = [];
        try {
            const res = await fetch(`/api/dashboard/data?type=curriculum`);
            allCurriculum = await res.json();
        } catch (e) {
            console.error("Failed to fetch curriculum for check", e);
        }

        for (let i = 0; i < total; i++) {
            const level = options.levels[i];
            const levelName = level.level;
            const departmentName = level.department_name || '';

            // Check if class has rules
            const hasRules = allCurriculum.some(c => c.level === levelName);

            if (!hasRules) {
                skippedCount++;
                setAgentLogs(prev => [...prev, { message: `⚠️ ${levelName}: ${t('autoGenSkipped')}`, type: 'warning' }]);
                failures.push(`${levelName}: ${t('autoGenSkipped')}`);
                continue; // Skip this class
            }

            setAgentStep('Action');
            setAgentLogs(prev => [...prev, { message: `Processing (${i + 1}/${total}): ${levelName}...`, type: 'info' }]);

            try {
                const res = await fetch('/api/ai-schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        term: filters.term,
                        department: departmentName,
                        classLevel: levelName
                    }),
                });

                const result = await res.json();

                if (res.ok) {
                    successCount++;
                    setAgentLogs(prev => [...prev, { message: `✅ ${levelName}: ${t('success')}`, type: 'success' }]);
                } else {
                    failCount++;
                    failures.push(`${levelName}: ${result.message || 'Unknown error'}`);
                    setAgentLogs(prev => [...prev, { message: `❌ ${levelName}: ${result.message || 'Failed'}`, type: 'error' }]);
                }

            } catch (e) {
                console.error(`Failed to generate for ${levelName}`, e);
                failCount++;
                failures.push(`${levelName}: Connection/Server Error`);
                setAgentLogs(prev => [...prev, { message: `❌ ${levelName}: Error`, type: 'error' }]);
            }

            // Small delay between requests
            await new Promise(r => setTimeout(r, 200));
        }

        setAgentStep('Review');
        setAgentLogs(prev => [...prev, { message: 'Finalizing and verifying...', type: 'info' }]);
        await new Promise(r => setTimeout(r, 500));

        setLoading(false);
        setLoadingMessage('');

        // Construct detailed message
        let message = `${t('autoGenSuccess')}: ${successCount}\n${t('autoGenFail')}: ${failCount}\n${t('autoGenSkipped')}: ${skippedCount}`;
        if (failures.length > 0) {
            message += `\n\nDetails:\n- ${failures.join('\n- ')}`;
        }

        setConfirmConfig({
            isOpen: true,
            title: t('success'),
            message: message,
            type: successCount > 0 ? 'success' : 'danger',
            onConfirm: () => {
                if (filters.department && filters.classLevel) fetchSchedule();
            }
        });
    };

    // 4. Bulk/Single Delete Submission
    const handleSingleDelete = (id) => {
        setConfirmConfig({
            isOpen: true, title: 'ยืนยันลบคาบ?', message: 'คาบวิชาจะถูกลบออกจากตาราง', confirmText: 'ลบ', cancelText: 'ยกเลิก', type: 'delete', onConfirm: () => handleBulkDelete([id])
        });
    }

    const handleBulkDelete = async (ids = Array.from(selectedIds)) => {
        setLoading(true);
        setSelectedIds(new Set());
        try {
            const res = await fetch('/api/dashboard/schedule', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'bulk_delete', ids: ids }),
            });
            const result = await res.json();
            if (res.ok) {
                setConfirmConfig({ isOpen: true, title: 'ลบสำเร็จ', message: result.message, type: 'success', onConfirm: fetchSchedule });
            } else {
                setConfirmConfig({ isOpen: true, title: 'ลบไม่สำเร็จ', message: result.message, type: 'danger' });
            }
        } catch (error) {
            setConfirmConfig({ isOpen: true, title: 'ข้อผิดพลาด', message: 'การเชื่อมต่อขัดข้อง', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    // --- Helper Render Functions ---
    const periods = [...Array(10)].map((_, i) => i + 1);
    const days = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์'];
    const timeSlots = [
        "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
        "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00",
        "16:00-17:00", "17:00-18:00"
    ];

    const renderSlot = (day, period) => {
        const dayData = scheduleData && scheduleData[day];
        const cell = dayData ? dayData[period] : null;

        const isSubject = cell && cell !== 'skip';

        if (cell === 'skip') return null;

        const colSpan = isSubject ? cell.duration : 1;
        const slotId = isSubject ? cell.id : null;
        const isSelected = selectedIds.has(slotId);

        // Lunch Break Styling (Period 5) - Vertical Merged Column
        if (period === 5) {
            if (day === 'วันจันทร์') {
                return (
                    <td
                        key={`${day}-${period}`}
                        rowSpan={5}
                        className="p-0 align-middle text-center bg-gray-100/50 dark:bg-white/5 border-r border-dashed border-gray-300 dark:border-white/10 relative"
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="-rotate-90 whitespace-nowrap text-sm text-gray-400 dark:text-white/30 font-bold tracking-widest">
                                {t('lunchBreak')}
                            </div>
                        </div>
                    </td>
                );
            } else {
                return null;
            }
        }

        return (
            <td
                key={`${day}-${period}`}
                colSpan={colSpan}
                className={`p-1.5 align-top h-32 transition-colors relative border-r border-dashed border-gray-200 dark:border-white/5`}
            >
                {isSubject && (
                    <div
                        className={`relative w-full h-full min-h-[100px] p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group border ${isSelected
                            ? 'ring-2 ring-offset-2 ring-blue-500 z-10'
                            : 'hover:shadow-md'
                            } ${isDarkMode
                                ? 'bg-[#1e293b] border-white/5 hover:bg-[#253045]'
                                : 'bg-[#E3F2FD] border-blue-100 hover:bg-[#BBDEFB]'
                            }`}
                        onClick={() => setSelectedIds(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(slotId)) newSet.delete(slotId);
                            else newSet.add(slotId);
                            return newSet;
                        })}
                    >
                        <input type="checkbox" className="hidden" checked={isSelected} onChange={() => { }} />

                        {/* Course Code */}
                        <div className={`font-black text-sm ${isDarkMode ? 'text-blue-300' : 'text-[#1565C0]'}`}>
                            {cell.subject_code}
                        </div>

                        {/* Subject Name */}
                        <div className={`text-xs font-bold text-center line-clamp-2 leading-tight ${isDarkMode ? 'text-white/90' : 'text-slate-700'}`}>
                            {cell.subject_name || 'รายวิชา'}
                        </div>

                        {/* Teacher Name */}
                        <div className={`text-[10px] ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                            {cell.teacher_name || 'ไม่ระบุครู'}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap justify-center gap-1 mt-1">
                            {/* Room Badge */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${isDarkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-[#FFF8E1] text-[#F57F17] border border-amber-100'
                                }`}>
                                🚪 {cell.room_name || '-'}
                            </span>

                            {/* Class Level Badge */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#E8F5E9] text-[#2E7D32] border border-emerald-100'
                                }`}>
                                {cell.class_level}
                            </span>
                        </div>

                        {/* Delete Button (Hover only) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleSingleDelete(slotId); }}
                            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-600 hover:scale-110"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}
            </td>
        );
    };

    const glassCard = `w-full rounded-[40px] p-8 md:p-10 shadow-2xl transition-all border backdrop-blur-3xl backdrop-saturate-150 relative overflow-hidden group ${isDarkMode ? 'bg-slate-800/60 border-white/10 shadow-black/50' : 'bg-slate-200/70 border-white/40 shadow-slate-300'
        }`;

    const inputGlass = `h-12 px-4 rounded-xl border outline-none font-medium w-full transition-all appearance-none ${isDarkMode
        ? 'bg-slate-900/50 border-white/10 text-white focus:bg-slate-900/70 focus:border-white/30'
        : 'bg-white/50 border-slate-300 text-slate-800 focus:bg-white focus:border-red-400 focus:shadow-sm'
        }`;

    const labelClass = `block text-xs font-bold uppercase tracking-wider mb-2 ml-1 opacity-70 ${isDarkMode ? 'text-white' : 'text-slate-600'}`;
    const btnBase = "h-11 px-6 rounded-full font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg border";

    return (
        <div className="pb-20 max-w-[1600px] mx-auto animate-fade-in px-4">
            <ConfirmModal isOpen={confirmConfig.isOpen} {...confirmConfig} onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })} />

            {/* ... (Header section remains same) ... */}
            <div className={`${glassCard} mb-8 flex flex-col gap-6 animate-slide-up delay-100`}>
                {/* Texture Overlay */}
                <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none"></div>

                {/* ... (Toolbar content) ... */}
                {/* Header & Back Button */}
                <div className={`flex items-start gap-6 pb-4 border-b ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
                    <button onClick={() => router.back()} className={`p-4 rounded-full transition-all border backdrop-blur-md shadow-sm active:scale-95 group ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-white/40 hover:bg-white/60 border-white/40 text-slate-700'}`}>
                        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className={`text-4xl font-black tracking-tight drop-shadow-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>จัดตารางสอน</h1>
                        <p className={`mt-1 text-lg font-medium ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>สร้างและจัดการตารางสอนประจำภาคเรียน</p>
                    </div>
                </div>

                <div className={`p-4 mb-6 rounded-2xl border shadow-sm backdrop-blur-xl transition-all relative z-10 ${glassCard}`}>
                    <div className="flex flex-nowrap gap-3 items-end overflow-x-auto pb-2 no-scrollbar w-full">
                        {/* Term Selector */}
                        <div className="flex flex-col gap-1 min-w-[100px]">
                            <label className={`text-xs font-bold ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {t('term')}
                            </label>
                            <div className="relative group">
                                <select
                                    value={filters.term}
                                    onChange={(e) => setFilters({ ...filters, term: e.target.value })}
                                    className={`appearance-none pl-4 pr-10 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all cursor-pointer w-full ${isDarkMode
                                        ? 'bg-[#1e293b] border-white/10 text-white hover:border-red-500/50 focus:border-red-500'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-red-300 focus:border-red-500 shadow-sm'
                                        }`}
                                >
                                    {options.terms.map(term => (
                                        <option key={term} value={term}>{term}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-red-500 transition-colors" size={16} />
                            </div>
                        </div>

                        {/* Department Selector */}
                        <div className="flex flex-col gap-1 min-w-[180px]">
                            <label className={`text-xs font-bold ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {t('department')}
                            </label>
                            <div className="relative group">
                                <select
                                    value={filters.department}
                                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                                    className={`appearance-none pl-4 pr-10 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all cursor-pointer w-full ${isDarkMode
                                        ? 'bg-[#1e293b] border-white/10 text-white hover:border-red-500/50 focus:border-red-500'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-red-300 focus:border-red-500 shadow-sm'
                                        }`}
                                >
                                    <option value="">{t('select')}</option>
                                    {options.depts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-red-500 transition-colors" size={16} />
                            </div>
                        </div>

                        {/* Class Level Selector */}
                        <div className="flex flex-col gap-1 min-w-[150px]">
                            <label className={`text-xs font-bold ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {t('classLevel')}
                            </label>
                            <div className="relative group">
                                <select
                                    value={filters.classLevel}
                                    onChange={(e) => setFilters({ ...filters, classLevel: e.target.value })}
                                    className={`appearance-none pl-4 pr-10 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all cursor-pointer w-full ${isDarkMode
                                        ? 'bg-[#1e293b] border-white/10 text-white hover:border-red-500/50 focus:border-red-500'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-red-300 focus:border-red-500 shadow-sm'
                                        }`}
                                >
                                    <option value="">{t('select')}</option>
                                    {options.levels
                                        .filter(l => !filters.department || l.department_name === filters.department)
                                        .map(l => <option key={l.id} value={l.level}>{l.level}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-red-500 transition-colors" size={16} />
                            </div>
                        </div>

                        {/* Spacer to push buttons to the right if needed, or just keep them close. 
                            User asked for "same line", usually implies a toolbar. 
                            Let's add a vertical divider */}
                        <div className={`w-px h-10 mx-2 self-center ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>

                        {/* Action Buttons */}
                        <button
                            onClick={() => setShowManualModal(true)}
                            className={`h-[42px] px-4 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 whitespace-nowrap min-w-[120px] justify-center ${isDarkMode
                                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'
                                }`}
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">{t('addSubjectBtn')}</span>
                        </button>

                        <button
                            onClick={handleAutoGenerate}
                            className={`h-[42px] px-4 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 whitespace-nowrap min-w-[140px] justify-center ${isDarkMode
                                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-purple-400'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-purple-600 shadow-sm'
                                }`}
                        >
                            <Wand2 size={18} />
                            <span className="hidden sm:inline">{t('autoGenBtn')}</span>
                        </button>

                        {/* Clear Table Button */}
                        <button
                            onClick={() => setShowClearModal(true)}
                            className={`h-[42px] px-4 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 whitespace-nowrap min-w-[120px] justify-center ${isDarkMode
                                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-red-400'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-red-600 shadow-sm'
                                }`}
                        >
                            <RotateCcw size={18} />
                            <span className="hidden sm:inline">{t('clearTableBtn')}</span>
                        </button>

                        {/* Delete Selected Button */}
                        {selectedIds.size > 0 && (
                            <button
                                onClick={() => handleBulkDelete()}
                                className="h-[42px] px-4 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/30 hover:bg-red-500 transition-all flex items-center gap-2 whitespace-nowrap min-w-[120px] justify-center"
                            >
                                <Trash2 size={18} />
                                <span className="hidden sm:inline">{t('deleteSelectedBtn')} ({selectedIds.size})</span>
                            </button>
                        )}

                        <button
                            onClick={async () => {
                                const teacherName = options.teachers?.find(t => t.id == filters.teacher)?.name || '';

                                // Fetch Curriculum Subjects for this Class Level
                                let curriculumSubjects = [];
                                if (filters.classLevel) {
                                    try {
                                        const res = await fetch(`/api/dashboard/data?type=curriculum`);
                                        const allCurriculum = await res.json();
                                        // Filter for current class level
                                        curriculumSubjects = allCurriculum.filter(c => c.level === filters.classLevel).map(c => ({
                                            code: c.code,
                                            name: c.subject_name,
                                            // Find credit/hours from main subjects list if possible
                                            ...options.subjects.find(s => s.code === c.code)
                                        }));
                                    } catch (e) {
                                        console.error("Failed to fetch curriculum for print", e);
                                    }
                                }

                                const printData = {
                                    scheduleData,
                                    filters,
                                    subjects: curriculumSubjects.length > 0 ? curriculumSubjects : (options.subjects || []),
                                    studentInfo: { ...filters, teacherName }
                                };
                                localStorage.setItem('printData', JSON.stringify(printData));
                                window.open('/print', '_blank');
                            }}
                            className={`h-[42px] px-4 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 whitespace-nowrap min-w-[100px] justify-center ${isDarkMode
                                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'
                                }`}
                        >
                            <Printer size={18} />
                            <span className="hidden sm:inline">{t('printBtn')}</span>
                        </button>
                    </div>
                </div>

                {/* --- 2. Content Area (Table) --- */}

                {/* Loading State (Agent Process) - Show regardless of table visibility */}
                {loading ? (
                    <div className={`overflow-hidden ${glassCard} p-0`}>
                        <div className="p-16 flex justify-center">
                            <AgentProcess step={agentStep} logs={agentLogs} />
                        </div>
                    </div>
                ) : !showTable ? (
                    // Empty State
                    <div className={`w-full rounded-[30px] flex flex-col items-center justify-center py-32 px-4 text-center transition-all ${isDarkMode
                        ? 'bg-[#151925]'
                        : 'bg-slate-50/50 border-2 border-dashed border-slate-300'
                        }`}>
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-md'}`}>
                            <CalendarCheck size={48} className={isDarkMode ? 'text-white/50' : 'text-orange-400'} />
                        </div>
                        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
                            {t('emptyStateTitle')}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {t('emptyStateDesc')}
                        </p>
                    </div>
                ) : (
                    // Table Component
                    <div className={`overflow-hidden ${glassCard} p-0 animate-slide-up delay-200`}>
                        {/* Texture Overlay */}
                        <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none"></div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 relative z-10">
                            <table className="w-full table-fixed border-collapse bg-white dark:bg-[#1e293b]">
                                <thead className={`text-xs font-bold uppercase ${isDarkMode ? 'bg-[#151925] text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                                    <tr>
                                        <th className="p-4 w-24 border-b border-r border-slate-200 dark:border-white/10 text-center">{t('timeDay')}</th>
                                        {periods.slice(0, 4).map((p, i) => (
                                            <th key={p} className="p-3 border-b border-l border-slate-200 dark:border-white/10 text-center font-bold">
                                                <span className="block text-sm">{timeSlots[i]}</span>
                                            </th>
                                        ))}
                                        {/* Lunch Break Header */}
                                        <th className="p-3 border-b border-l border-slate-200 dark:border-white/10 text-center bg-slate-100 dark:bg-white/5 font-bold">
                                            <span className="block text-sm">12:00-13:00</span>
                                        </th>
                                        {periods.slice(5).map((p, i) => (
                                            <th key={p} className="p-3 border-b border-l border-slate-200 dark:border-white/10 text-center font-bold">
                                                <span className="block text-sm">{timeSlots[i + 5]}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {days.map(day => (
                                        <tr key={day} className={`text-sm border-b-2 ${isDarkMode ? 'border-white/10 divide-x divide-white/5' : 'border-slate-300 divide-x divide-slate-200'}`}>
                                            <td className="p-4 font-bold border-r-2 border-slate-300 dark:border-white/10 text-center bg-white dark:bg-[#151925]">
                                                {day === 'วันจันทร์' ? t('monday') :
                                                    day === 'วันอังคาร' ? t('tuesday') :
                                                        day === 'วันพุธ' ? t('wednesday') :
                                                            day === 'วันพฤหัสบดี' ? t('thursday') :
                                                                day === 'วันศุกร์' ? t('friday') :
                                                                    day === 'วันเสาร์' ? t('saturday') :
                                                                        day === 'วันอาทิตย์' ? t('sunday') : day}
                                            </td>
                                            {periods.slice(0, 4).map(period => renderSlot(day, period))}

                                            {/* Lunch Break Column */}
                                            {day === 'วันจันทร์' && (
                                                <td rowSpan={5} className="border-l border-slate-200 dark:border-white/10 text-center align-middle bg-slate-100 dark:bg-white/5">
                                                    <div className="h-full flex items-center justify-center">
                                                        <span className="text-sm font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">{t('lunchBreak')}</span>
                                                    </div>
                                                </td>
                                            )}

                                            {periods.slice(5).map(period => renderSlot(day, period))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- 3. Modals --- */}

                {/* Manual Add Modal */}
                {showManualModal && mounted && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={() => setShowManualModal(false)}></div>
                        <form onSubmit={handleManualAddSubmit} className={`relative w-full max-w-md rounded-[32px] p-8 shadow-2xl backdrop-blur-3xl border ${isDarkMode ? 'bg-[#151925]/90 border-white/10' : 'bg-white/95 border-slate-200'}`}>
                            <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t('manualAddTitle')}</h3>
                            <button type="button" onClick={() => setShowManualModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"><X size={20} className={isDarkMode ? 'text-white' : 'text-slate-600'} /></button>

                            <div className="space-y-4">
                                {/* Day */}
                                <div>
                                    <label className={labelClass}>{t('day')}</label>
                                    <div className="relative">
                                        <select name="day" className={inputGlass} value={manualFormData.day} onChange={e => setManualFormData({ ...manualFormData, day: e.target.value })}>
                                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                                    </div>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className={labelClass}>{t('subject')}</label>
                                    <div className="relative">
                                        <select
                                            name="subject_id"
                                            className={inputGlass}
                                            required
                                            value={manualFormData.subject_id}
                                            onChange={e => {
                                                const id = e.target.value;
                                                const sub = options.subjects?.find(s => s.id == id);
                                                const duration = sub ? sub.theory_hours + sub.practice_hours : 1;
                                                setManualFormData({
                                                    ...manualFormData,
                                                    subject_id: id,
                                                    teacher_id: sub ? sub.teacher_id : '',
                                                    room_id: sub ? sub.teacher_room_id : '',
                                                    duration: duration || 1,
                                                    class_level: filters.classLevel || '',
                                                });
                                            }}
                                        >
                                            <option value="">{t('select')}</option>
                                            {options.subjects?.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name} ({s.theory_hours + s.practice_hours} {t('duration')})</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                                    </div>
                                </div>

                                {/* Teacher */}
                                <div>
                                    <label className={labelClass}>{t('teacher')}</label>
                                    <div className="relative">
                                        <select name="teacher_id" className={inputGlass} required value={manualFormData.teacher_id} onChange={e => setManualFormData({ ...manualFormData, teacher_id: e.target.value })}>
                                            <option value="">{t('select')}</option>
                                            {options.teachers?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                                    </div>
                                </div>

                                {/* Room */}
                                <div>
                                    <label className={labelClass}>{t('room')}</label>
                                    <div className="relative">
                                        <select name="room_id" className={inputGlass} value={manualFormData.room_id} onChange={e => setManualFormData({ ...manualFormData, room_id: e.target.value })}>
                                            <option value="">{t('select')}</option>
                                            {options.rooms?.map(r => <option key={r.name} value={r.id}>{r.name} ({r.type})</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                                    </div>
                                </div>

                                {/* Class Level */}
                                <div>
                                    <label className={labelClass}>{t('classLevel')}</label>
                                    <input type="text" name="class_level" className={inputGlass} required placeholder="e.g. 1/1" value={manualFormData.class_level} onChange={e => setManualFormData({ ...manualFormData, class_level: e.target.value })} />
                                </div>

                                {/* Start Period & Duration */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>{t('startPeriod')}</label>
                                        <input type="number" name="start_period" className={inputGlass} min="1" max="10" required value={manualFormData.start_period} onChange={e => setManualFormData({ ...manualFormData, start_period: parseInt(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>{t('duration')}</label>
                                        <input type="number" name="duration" className={inputGlass} min="1" max={10 - manualFormData.start_period + 1} required readOnly style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f0f4f8' }} value={manualFormData.duration} />
                                    </div>
                                </div>

                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setShowManualModal(false)} className={`py-3 px-5 rounded-xl font-bold text-sm border ${isDarkMode ? 'border-white/10 text-white/70 hover:bg-white/5' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{t('cancel')}</button>
                                <button type="submit" className="py-3 px-5 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/30">{t('save')}</button>
                            </div>
                        </form>
                    </div>,
                    document.body
                )}

                {/* Clear Table Modal */}
                {showClearModal && mounted && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={() => setShowClearModal(false)}></div>
                        <div className={`relative w-full max-w-md rounded-[32px] p-8 shadow-2xl backdrop-blur-3xl border ${isDarkMode ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
                            <h3 className={`text-2xl font-bold mb-6 text-red-600`}>{t('clearTableBtn')}</h3>
                            <button type="button" onClick={() => setShowClearModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"><X size={20} className={isDarkMode ? 'text-white' : 'text-slate-600'} /></button>

                            <div className="space-y-4">
                                {/* Term */}
                                <div>
                                    <label className={labelClass}>{t('term')}</label>
                                    <input type="text" className={inputGlass} readOnly value={filters.term} />
                                </div>

                                {/* Clear Mode */}
                                <div>
                                    <label className={labelClass}>{t('warning')}</label>
                                    <div className="relative">
                                        <select name="mode" className={inputGlass} value={clearFormData.mode} onChange={e => setClearFormData({ mode: e.target.value, value: '' })}>
                                            <option value="all">{t('all')}</option>
                                            <option value="dept">{t('department')}</option>
                                            <option value="class">{t('classLevel')}</option>
                                            <option value="teacher">{t('teacher')}</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                                    </div>
                                </div>

                                {/* Clear Value (Dynamic Input) */}
                                {(clearFormData.mode !== 'all') && (
                                    <div>
                                        <label className={labelClass}>{t('select')}</label>
                                        <div className="relative">
                                            <select name="value" className={inputGlass} required value={clearFormData.value} onChange={e => setClearFormData({ ...clearFormData, value: e.target.value })}>
                                                <option value="">{t('select')}</option>
                                                {clearFormData.mode === 'dept' && options.depts?.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                                {clearFormData.mode === 'class' && [...new Set(options.levels?.map(l => l.level) || [])].map(level => <option key={level} value={level}>{level}</option>)}
                                                {clearFormData.mode === 'teacher' && options.teachers?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                                        </div>
                                    </div>
                                )}

                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setShowClearModal(false)} className={`py-3 px-5 rounded-xl font-bold text-sm border ${isDarkMode ? 'border-white/10 text-white/70 hover:bg-white/5' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{t('cancel')}</button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (clearFormData.mode !== 'all' && !clearFormData.value) {
                                            alert(t('emptyStateTitle'));
                                            return;
                                        }
                                        handleClearSubmit(clearFormData.mode, clearFormData.value);
                                    }}
                                    className="py-3 px-5 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/30"
                                >
                                    {t('confirm')}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            </div>
        </div>
    );
}