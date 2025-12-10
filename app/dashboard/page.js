// app/dashboard/page.js
'use client';
import { useState, useEffect } from 'react';
import {
    Users, UserSquare2, BookOpen, Building2, DoorOpen,
    Clock, Shield, Star, CalendarCheck,
    ListChecks, GraduationCap, Users2, Layout, Layers,
    MessageSquare, Send, Sparkles, X
} from 'lucide-react';
import TableModal from '../components/TableModal';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';
import { useSound } from '../context/SoundContext';

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

// StatCard: 🟢 Reference Design (Polished)
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

    // Calculate delay based on index (max 700ms)
    const delayClass = index < 8 ? `delay-${index * 100}` : 'delay-700';

    return (
        <div
            onClick={() => onClick(type, title)}
            className={`group relative h-44 rounded-3xl p-6 overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl ${shadowColor} shadow-lg bg-gradient-to-br ${gradient} animate-slide-up opacity-0 ${delayClass}`}
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
            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 animate-shine pointer-events-none"></div>
        </div>
    );
};

export default function Dashboard() {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [modalTitle, setModalTitle] = useState('');
    const [modalData, setModalData] = useState([]);
    const [currentTime, setCurrentTime] = useState('');
    const [userData, setUserData] = useState({ name: 'User', image: '' });
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger' });
    const [stats, setStats] = useState({ students: 0, teachers: 0, users: 0, class_levels: 0, subjects: 0, departments: 0, rooms: 0, credits: 0, curriculum: 0, schedule: 0, scheduled_subjects: 0, hours: 0, logs: 0 });
    const { isDarkMode } = useTheme();
    const { t, language } = useLanguage();
    const { play: playSound } = useSound(); // 🔊 Sound effects

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
            try {
                const [statsRes, userRes] = await Promise.all([fetch('/api/dashboard/stats'), fetch('/api/user')]);
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUserData(userData);
                }
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(prev => ({ ...prev, ...statsData }));
                }
            } catch (error) { console.error(error); }
        };
        fetchDashboardData();
    }, []);

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

    // 🎨 Reference Palette (Solid Colors)
    const cards = [
        { type: 'students', title: t('statStudents'), count: stats.students, unit: t('unitPerson'), gradient: 'from-blue-600 to-blue-500', icon: GraduationCap },
        { type: 'teachers', title: t('statTeachers'), count: stats.teachers, unit: t('unitTeacher'), gradient: 'from-orange-500 to-amber-500', icon: UserSquare2 },
        { type: 'users', title: t('statUsers'), count: stats.users, unit: t('unitPerson'), gradient: 'from-gray-600 to-gray-500', icon: Users2 },
        { type: 'class_levels', title: t('statLevels'), count: stats.class_levels, unit: t('unitLevel'), gradient: 'from-emerald-500 to-green-500', icon: Layers },
        { type: 'subjects', title: t('statSubjects'), count: stats.subjects, unit: t('unitSubject'), gradient: 'from-yellow-500 to-amber-400', icon: BookOpen },
        { type: 'departments', title: t('statDepartments'), count: stats.departments, unit: t('unitDept'), gradient: 'from-green-600 to-emerald-500', icon: Building2 },
        { type: 'rooms', title: t('statRooms'), count: stats.rooms, unit: t('unitRoom'), gradient: 'from-slate-500 to-slate-400', icon: DoorOpen },
        { type: 'credits', title: t('statCredits'), count: stats.credits, unit: t('unitCredit'), gradient: 'from-purple-600 to-fuchsia-500', icon: Star },
        { type: 'curriculum', title: t('statCurriculum'), count: stats.curriculum, unit: t('unitItem'), gradient: 'from-red-500 to-rose-500', icon: ListChecks },
        { type: 'schedule', title: t('statSchedule'), count: stats.schedule, unit: t('unitPeriod'), gradient: 'from-blue-700 to-indigo-600', icon: CalendarCheck },
        { type: 'scheduled_subjects', title: t('statScheduledSubjects'), count: stats.scheduled_subjects, unit: t('unitSubject'), gradient: 'from-teal-500 to-cyan-500', icon: Layout },
        { type: 'hours', title: t('statHours'), count: stats.hours, unit: t('unitHour'), gradient: 'from-pink-500 to-rose-400', icon: Clock },
        // { type: 'logs', title: 'Logs กิจกรรม', count: stats.logs, unit: 'รายการ', gradient: 'from-slate-600 to-slate-800', icon: Shield }, // Logs not in reference image
    ];

    return (
        <div className="max-w-[1600px] mx-auto pb-16">

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
                <div className="relative overflow-hidden rounded-3xl p-10 shadow-xl shadow-red-900/20 bg-gradient-to-br from-red-700 via-red-600 to-red-500 text-white flex flex-col md:flex-row justify-between items-center gap-6 group">

                    {/* Texture Overlay */}
                    <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>

                    {/* Left: Text */}
                    <div className="z-10">
                        <h1 className="text-4xl md:text-5xl font-black mb-3 flex items-center gap-4 tracking-tight">
                            {t('welcome')}, {userData.name} <span className="animate-wave inline-block origin-[70%_70%] drop-shadow-lg">👋</span>
                        </h1>
                        <p className="text-base md:text-lg opacity-90 font-medium tracking-wide">
                            {t('systemName')}
                        </p>
                    </div>

                    {/* Right: Clock */}
                    <div className="z-10 bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20 shadow-lg transition-transform hover:scale-105 hover:bg-white/20">
                        <p className="font-bold text-xl flex items-center gap-3 tracking-wider">
                            <CalendarCheck size={24} className="text-white drop-shadow-sm" />
                            {currentTime}
                        </p>
                    </div>

                    {/* Decorative Curve (Subtle) */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white opacity-5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none animate-float"></div>
                </div>

                {/* Grid Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card, index) => <StatCard key={index} {...card} index={index} onClick={handleCardClick} isDarkMode={isDarkMode} />)}
                </div>
            </div>

            <TableModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle} type={modalType} data={modalData} />

            {/* --- Smart Query Chat Widget --- */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
                {/* Chat Window */}
                {showChat && (
                    <div className={`w-80 md:w-96 h-[500px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border animate-slide-in-right ${isDarkMode ? 'bg-[#1e293b] border-white/10' : 'bg-white border-slate-200'}`}>
                        {/* Header */}
                        <div className={`p-4 flex items-center justify-between border-b ${isDarkMode ? 'bg-[#151925] border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                                    <Sparkles size={16} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold">{t('smartAssistant')}</h3>
                                    <p className="text-[10px] opacity-60">{t('poweredBy')}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowChat(false)} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-black/20">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : isDarkMode ? 'bg-[#151925] border border-white/5 text-slate-200 rounded-tl-none' : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {chatLoading && (
                                <div className="flex justify-start">
                                    <div className={`p-3 rounded-2xl rounded-tl-none flex items-center gap-2 ${isDarkMode ? 'bg-[#151925]' : 'bg-white'}`}>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleChatSubmit} className={`p-3 border-t ${isDarkMode ? 'bg-[#151925] border-white/5' : 'bg-white border-slate-100'}`}>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    placeholder={t('askSchedule')}
                                    className={`w-full pl-4 pr-12 py-3 rounded-xl text-sm outline-none transition-all ${isDarkMode
                                        ? 'bg-black/20 border border-white/10 focus:border-blue-500/50 text-white placeholder:text-white/30'
                                        : 'bg-slate-100 border border-transparent focus:bg-white focus:border-blue-200 text-slate-800 placeholder:text-slate-400'
                                        }`}
                                />
                                <button
                                    type="submit"
                                    disabled={!chatMessage.trim() || chatLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Toggle Button */}
                <button
                    onClick={() => setShowChat(!showChat)}
                    className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${showChat
                        ? 'bg-red-500 text-white rotate-90'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        }`}
                >
                    {showChat ? <X size={24} /> : <MessageSquare size={24} />}
                </button>
            </div>

        </div>
    );
}