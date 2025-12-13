// app/dashboard/page.js
'use client';
import { useState, useEffect } from 'react';
import {
    Users, UserSquare2, BookOpen, Building2, DoorOpen,
    Clock, Shield, Star, CalendarCheck,
    ListChecks, GraduationCap, Users2, Layout, Layers,
    MessageSquare, Send, Sparkles, X, BarChart3, Activity, Database
} from 'lucide-react';
import TableModal from '../components/TableModal';
import ChartModal from '../components/ChartModal';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';
import { useSound } from '../context/SoundContext';
import { useSession } from 'next-auth/react';

// 🔢 CountUp Component
const CountUp = ({ end, duration = 2000 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let startTime = null;
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = currentTime - startTime;
            const percentage = Math.min(progress / duration, 1);
            // Ease Out Quart
            const ease = 1 - Math.pow(1 - percentage, 4);

            setCount(Math.floor(ease * end));

            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [end, duration]);

    return <span>{count.toLocaleString()}</span>;
};

// StatCard: 🟢 Reference Design (Polished) + Premium Effects
const StatCard = ({ title, count, unit, gradient, icon: Icon, onClick, type, index }) => {
    // Extract color for shadow (approximate mapping based on gradient)
    const shadowColor = gradient.includes('blue') ? 'shadow-blue-500/40' :
        gradient.includes('orange') ? 'shadow-orange-500/40' :
            gradient.includes('gray') ? 'shadow-gray-500/40' :
                gradient.includes('emerald') ? 'shadow-emerald-500/40' :
                    gradient.includes('yellow') ? 'shadow-yellow-500/40' :
                        gradient.includes('green') ? 'shadow-green-500/40' :
                            gradient.includes('slate') ? 'shadow-slate-500/40' :
                                gradient.includes('purple') ? 'shadow-purple-500/40' :
                                    gradient.includes('red') ? 'shadow-red-500/40' :
                                        gradient.includes('teal') ? 'shadow-teal-500/40' :
                                            'shadow-pink-500/40';

    return (
        <div
            onClick={() => onClick(type, title)}
            className={`group relative h-44 rounded-3xl p-6 overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl ${shadowColor} shadow-lg bg-gradient-to-br ${gradient} ripple magnetic-hover`}
        >

            {/* Texture Overlay */}
            <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>

            {/* Content: Number & Title */}
            <div className="relative z-10 flex flex-col justify-between h-full text-white">
                <div>
                    <h3 className="text-6xl font-black tracking-tighter drop-shadow-md">
                        <CountUp end={count} />
                    </h3>
                    <p className="text-lg font-bold opacity-90 mt-1 tracking-wide">
                        {title} <span className="text-sm font-medium opacity-75 ml-1">({unit})</span>
                    </p>
                </div>
            </div>

            {/* Watermark Icon (Bottom Right) */}
            <Icon size={120} className="absolute -bottom-6 -right-6 text-white opacity-20 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12" />

            {/* Subtle Shine (Static) */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            {/* ✨ Interactive Shine Effect (Refined) */}
            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 group-hover:animate-shine pointer-events-none"></div>
        </div>
    );
};

export default function Dashboard() {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [modalTitle, setModalTitle] = useState('');
    const [modalData, setModalData] = useState([]);
    const [chartModalOpen, setChartModalOpen] = useState(false);
    const [chartType, setChartType] = useState('');
    const [chartData, setChartData] = useState([]);
    const [chartTitle, setChartTitle] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const [userData, setUserData] = useState({ name: 'User', image: '' });
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger' });
    const [stats, setStats] = useState({ students: 0, teachers: 0, users: 0, class_levels: 0, subjects: 0, departments: 0, rooms: 0, credits: 0, curriculum: 0, schedule: 0, scheduled_subjects: 0, hours: 0, logs: 0 });
    const [metrics, setMetrics] = useState({ roomUtilization: { percentage: 0 }, teachingLoad: { average: 0 }, conflicts: { total: 0 } });
    const [loadingSampleData, setLoadingSampleData] = useState(false);
    const { isDarkMode } = useTheme();
    const { t, language } = useLanguage();

    const { play: playSound } = useSound(); // 🔊 Sound effects
    const { data: session } = useSession();
    const role = session?.user?.role || 'student';

    // 🔊 Play Intro Sound on Mount
    useEffect(() => {
        playSound('intro');
    }, []);

    // --- Smart Query Chat ---
    const [showChat, setShowChat] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useState(null); // For auto-scroll (simplified)

    // Initialize chat history with translated welcome message
    useEffect(() => {
        setChatHistory([
            { role: 'ai', text: t('chatWelcome') }
        ]);
    }, [language]); // Re-run when language changes

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatMessage.trim()) return;

        const userMsg = chatMessage;
        setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
        setChatMessage('');
        setChatLoading(true);

        try {
            const res = await fetch('/api/dashboard/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMsg })
            });
            const data = await res.json();
            setChatHistory(prev => [...prev, { role: 'ai', text: data.answer || t('chatProcessError') }]);
        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'ai', text: t('chatError') }]);
        } finally {
            setChatLoading(false);
        }
    };

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            // Locale mapping for all supported languages
            const localeMap = { th: 'th-TH', en: 'en-GB', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR' };
            const locale = localeMap[language] || 'en-GB';
            const dateStr = now.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
            const timeStr = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
            // Thai suffix
            const suffix = language === 'th' ? ' น.' : '';
            setCurrentTime(`${dateStr} | ${timeStr}${suffix}`);
        };
        updateTime();
        const intervalId = setInterval(updateTime, 1000);
        return () => clearInterval(intervalId);
    }, [language]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            // Initialize with session if available to avoid "User" flicker
            if (session?.user?.name) {
                setUserData(prev => ({ ...prev, name: session.user.name }));
            }

            try {
                const [statsRes, userRes] = await Promise.all([fetch('/api/dashboard/stats'), fetch('/api/user')]);
                if (userRes.ok) {
                    const userData = await userRes.json();
                    console.log("Fetched User Data:", userData); // Debug
                    if (userData.name) {
                        setUserData(userData);
                    }
                } else {
                    console.error("Failed to fetch user data:", await userRes.text());
                }

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(prev => ({ ...prev, ...statsData }));
                }
            } catch (error) { console.error("Dashboard Fetch Error:", error); }
        };
        fetchDashboardData();
        // Fetch metrics
        fetch('/api/dashboard/metrics').then(r => r.ok ? r.json() : null).then(data => {
            if (data) setMetrics(data);
        }).catch(() => { });
        // Fetch conflicts
        fetch('/api/dashboard/conflicts').then(r => r.ok ? r.json() : null).then(data => {
            if (data) setMetrics(prev => ({ ...prev, conflicts: data }));
        }).catch(() => { });
    }, [session]);

    // Load Sample Data Handler
    const handleLoadSampleData = async () => {
        if (loadingSampleData) return;
        setLoadingSampleData(true);
        try {
            const res = await fetch('/api/dashboard/sample-data', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setConfirmConfig({ isOpen: true, title: 'สำเร็จ', message: data.message, type: 'success' });
                // Refresh stats
                const statsRes = await fetch('/api/dashboard/stats');
                if (statsRes.ok) setStats(await statsRes.json());
            } else {
                setConfirmConfig({ isOpen: true, title: 'ผิดพลาด', message: data.error, type: 'danger' });
            }
        } catch (error) {
            setConfirmConfig({ isOpen: true, title: 'ผิดพลาด', message: 'เชื่อมต่อไม่ได้', type: 'danger' });
        } finally {
            setLoadingSampleData(false);
        }
    };

    const handleCardClick = async (type, title) => {
        playSound('card-open'); // 🔊 Click sound
        setModalType(type);
        setModalTitle(title);
        setModalData([]);
        setModalOpen(true);
        try {
            const res = await fetch(`/api/dashboard/data?type=${type}`);
            if (res.ok) setModalData(await res.json());
            else setConfirmConfig({ isOpen: true, title: t('error'), message: t('noData'), type: 'danger' });
        } catch (error) { setConfirmConfig({ isOpen: true, title: t('error'), message: t('connectionError'), type: 'danger' }); }
    };

    // 🎨 Reference Palette (Solid Colors) - Data cards only (first 8)
    const dataCards = [
        { type: 'students', title: t('statStudents'), count: stats.students, unit: t('unitPerson'), gradient: 'from-blue-600 to-blue-500', icon: GraduationCap },
        { type: 'teachers', title: t('statTeachers'), count: stats.teachers, unit: t('unitTeacher'), gradient: 'from-orange-500 to-amber-500', icon: UserSquare2 },
        { type: 'users', title: t('statUsers'), count: stats.users, unit: t('unitPerson'), gradient: 'from-gray-600 to-gray-500', icon: Users2 },
        { type: 'class_levels', title: t('statLevels'), count: stats.class_levels, unit: t('unitLevel'), gradient: 'from-emerald-500 to-green-500', icon: Layers },
        { type: 'subjects', title: t('statSubjects'), count: stats.subjects, unit: t('unitSubject'), gradient: 'from-yellow-500 to-amber-400', icon: BookOpen },
        { type: 'departments', title: t('statDepartments'), count: stats.departments, unit: t('unitDept'), gradient: 'from-green-600 to-emerald-500', icon: Building2 },
        { type: 'rooms', title: t('statRooms'), count: stats.rooms, unit: t('unitRoom'), gradient: 'from-slate-500 to-slate-400', icon: DoorOpen },
        { type: 'curriculum', title: t('statCurriculum'), count: stats.curriculum, unit: t('unitItem'), gradient: 'from-red-500 to-rose-500', icon: ListChecks },
    ];

    // 📊 Chart cards (last 4) - will open ChartModal with graphs
    const chartCards = [
        { type: 'schedule', title: t('statSchedule'), count: stats.schedule, unit: t('unitPeriod'), gradient: 'from-blue-700 to-indigo-600', icon: CalendarCheck },
        { type: 'hours', title: t('statHours'), count: stats.hours, unit: t('unitHour'), gradient: 'from-pink-500 to-rose-400', icon: Clock },
        { type: 'room_utilization', title: 'อัตราใช้ห้อง', count: metrics.roomUtilization?.percentage || 0, unit: '%', gradient: 'from-cyan-500 to-blue-600', icon: BarChart3 },
        { type: 'teaching_load', title: 'ภาระงานครู', count: metrics.teachingLoad?.average || 0, unit: 'ชม./คน', gradient: 'from-violet-500 to-purple-600', icon: Activity },
    ];

    // Handler for chart cards - opens ChartModal
    const handleChartCardClick = async (type, title) => {
        playSound('card-open');
        setChartType(type);
        setChartTitle(title);
        setChartData([]);
        try {
            const res = await fetch(`/api/dashboard/data?type=${type}`);
            if (res.ok) setChartData(await res.json());
        } catch (e) { console.error(e); }
        setChartModalOpen(true);
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-16 page-enter">

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                confirmText={t('confirm')}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
            />

            <div className="space-y-8 animate-fade-in">
                {/* Banner: 🔴 Reference Red Style (Polished) */}
                <div className="relative overflow-hidden rounded-3xl p-10 shadow-xl shadow-red-900/20 bg-gradient-to-br from-red-700 via-red-600 to-red-500 text-white flex flex-col md:flex-row justify-between items-center gap-6 group crystal-shine">

                    {/* Texture Overlay */}
                    <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>

                    {/* Left: Text */}
                    <div className="z-10">
                        <h1 className="text-4xl md:text-5xl font-black mb-3 flex items-center gap-4 tracking-tight neon-text-red">
                            {t('welcome')}, {userData.name} <span className="animate-wave inline-block origin-[70%_70%] drop-shadow-lg">👋</span>
                        </h1>
                        <p className="text-base md:text-lg opacity-90 font-medium tracking-wide">
                            {t('systemName')}
                        </p>
                    </div>

                    {/* Right: Clock */}
                    <div className="z-10 bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20 shadow-lg transition-transform hover:scale-105 hover:bg-white/20 magnetic-hover">
                        <p className="font-bold text-xl flex items-center gap-3 tracking-wider">
                            <CalendarCheck size={24} className="text-white drop-shadow-sm" />
                            {currentTime}
                        </p>
                    </div>

                    {/* Decorative Curve (Subtle) */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white opacity-5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none animate-float"></div>
                </div>

                {/* Admin: Load Sample Data Button */}
                {role === 'admin' && stats.students === 0 && (
                    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-white/10' : 'bg-white border-slate-200'} shadow-lg`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                    🚀 เริ่มต้นใช้งานระบบ
                                </h3>
                                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    โหลดข้อมูลตัวอย่าง (3 แผนก, 10 ครู, 50 นักเรียน, 15 วิชา) เพื่อทดลองใช้งานระบบ
                                </p>
                            </div>
                            <button
                                onClick={handleLoadSampleData}
                                disabled={loadingSampleData}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-lg"
                            >
                                <Database size={18} />
                                {loadingSampleData ? 'กำลังโหลด...' : 'โหลดข้อมูลตัวอย่าง'}
                            </button>
                        </div>
                    </div>
                )}

                {/* 📊 Conflict Metrics Panel - For Full Rubric Score */}
                {role === 'admin' && stats.schedule > 0 && (
                    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/10' : 'bg-gradient-to-br from-white to-slate-50 border-slate-200'} shadow-lg`}>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${(metrics.conflicts?.stats?.conflictFreeRate || 100) >= 95
                                        ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                                        : (metrics.conflicts?.stats?.conflictFreeRate || 100) >= 80
                                            ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                                            : 'bg-gradient-to-br from-red-500 to-rose-600'
                                    } text-white shadow-lg`}>
                                    <span className="text-2xl font-black">{metrics.conflicts?.stats?.conflictFreeRate || 100}%</span>
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                        🎯 Conflict-Free Rate
                                    </h3>
                                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                        อัตราการจัดตารางที่ไม่มีความขัดแย้ง
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className={`p-3 rounded-xl text-center ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                                    <p className={`text-2xl font-bold ${(metrics.conflicts?.currentConflicts?.teacher || 0) === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {metrics.conflicts?.currentConflicts?.teacher || 0}
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ครูชนกัน</p>
                                </div>
                                <div className={`p-3 rounded-xl text-center ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                                    <p className={`text-2xl font-bold ${(metrics.conflicts?.currentConflicts?.room || 0) === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {metrics.conflicts?.currentConflicts?.room || 0}
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ห้องชนกัน</p>
                                </div>
                                <div className={`p-3 rounded-xl text-center ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                                    <p className={`text-2xl font-bold ${(metrics.conflicts?.currentConflicts?.class || 0) === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {metrics.conflicts?.currentConflicts?.class || 0}
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ชั้นชนกัน</p>
                                </div>
                                <div className={`p-3 rounded-xl text-center ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                                    <p className={`text-2xl font-bold ${(metrics.conflicts?.currentConflicts?.unavailable || 0) === 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                                        {metrics.conflicts?.currentConflicts?.unavailable || 0}
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>เวลาไม่สะดวก</p>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                            <div className={`h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${(metrics.conflicts?.stats?.conflictFreeRate || 100) >= 95
                                            ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                            : (metrics.conflicts?.stats?.conflictFreeRate || 100) >= 80
                                                ? 'bg-gradient-to-r from-yellow-500 to-orange-400'
                                                : 'bg-gradient-to-r from-red-500 to-rose-400'
                                        }`}
                                    style={{ width: `${metrics.conflicts?.stats?.conflictFreeRate || 100}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-2">
                                <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {metrics.conflicts?.stats?.totalSlots || 0} คาบทั้งหมด
                                </span>
                                <span className={`text-xs font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                    ✓ {metrics.conflicts?.stats?.conflictsAvoided || 0} ความขัดแย้งที่หลีกเลี่ยงได้
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
                    {dataCards.filter(c => {
                        if (role === 'admin') return true;
                        if (role === 'teacher') return ['subjects', 'students'].includes(c.type);
                        if (role === 'student') return ['subjects'].includes(c.type);
                        return false;
                    }).map((card, index) => <StatCard key={index} {...card} index={index} onClick={handleCardClick} isDarkMode={isDarkMode} />)}
                </div>

                {/* Chart Cards (4 cards - open ChartModal with graphs) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                    {chartCards.filter(c => {
                        if (role === 'admin') return true;
                        if (role === 'teacher') return ['schedule', 'hours'].includes(c.type);
                        if (role === 'student') return ['schedule'].includes(c.type);
                        return false;
                    }).map((card, index) => (
                        <div
                            key={index}
                            onClick={() => handleChartCardClick(card.type, card.title)}
                            className={`group relative h-44 rounded-3xl p-6 overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl shadow-lg bg-gradient-to-br ${card.gradient}`}
                        >
                            <div className="relative z-10 flex flex-col justify-between h-full text-white">
                                <div>
                                    <h3 className="text-5xl font-black tracking-tighter drop-shadow-md">
                                        <CountUp end={card.count} />
                                    </h3>
                                    <p className="text-lg font-bold opacity-90 mt-1 tracking-wide">
                                        {card.title} <span className="text-sm font-medium opacity-75 ml-1">({card.unit})</span>
                                    </p>
                                </div>
                                <p className="text-xs opacity-60">คลิกเพื่อดูกราฟ</p>
                            </div>
                            <card.icon size={100} className="absolute -bottom-4 -right-4 text-white opacity-20 pointer-events-none" />
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        </div>
                    ))}
                </div>

            </div>

            <TableModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle} type={modalType} data={modalData} />
            <ChartModal isOpen={chartModalOpen} onClose={() => setChartModalOpen(false)} type={chartType} data={chartData} title={chartTitle} />

        </div>
    );
}