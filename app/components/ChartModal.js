// app/components/ChartModal.js
'use client';
import { createPortal } from 'react-dom';
import { X, BarChart3, Activity, CalendarCheck, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ChartModal({ isOpen, onClose, type, data, title }) {
    const { isDarkMode } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    const modalBg = isDarkMode
        ? 'bg-[#151925]/95 border-white/10'
        : 'bg-white/95 border-slate-200';

    const textColor = isDarkMode ? 'text-white' : 'text-slate-800';
    const thaiDays = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์'];
    const displayDays = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
    const dayColors = ['bg-blue-500', 'bg-yellow-500', 'bg-pink-500', 'bg-orange-500', 'bg-green-500'];

    // Render schedule chart (by day)
    const ScheduleChart = () => {
        const schedules = data || [];
        const dayStats = {};

        // Group by day_of_week (using Thai day names)
        schedules.forEach(item => {
            const day = item.day_of_week;
            if (!dayStats[day]) dayStats[day] = { count: 0, subjects: [] };
            dayStats[day].count++;
            dayStats[day].subjects.push(item.subject);
        });

        const maxCount = Math.max(...Object.values(dayStats).map(d => d.count), 1);

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-6">
                    <CalendarCheck className="text-blue-500" size={24} />
                    <h3 className={`text-xl font-bold ${textColor}`}>ตารางสอนแยกตามวัน</h3>
                </div>

                {schedules.length === 0 ? (
                    <p className={`text-center py-8 opacity-60 ${textColor}`}>ไม่มีข้อมูลตารางสอน</p>
                ) : (
                    <div className="space-y-3">
                        {thaiDays.map((day, index) => (
                            <div key={day} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`font-bold ${textColor}`}>{displayDays[index]}</span>
                                    <span className="text-blue-500 font-bold">{dayStats[day]?.count || 0} คาบ</span>
                                </div>
                                <div className={`h-6 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                                    <div
                                        className={`h-full rounded-full ${dayColors[index]} transition-all duration-500`}
                                        style={{ width: `${((dayStats[day]?.count || 0) / maxCount) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        <div className={`mt-4 p-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-blue-50'}`}>
                            <p className={`text-center font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                รวมทั้งหมด {schedules.length} คาบ
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render hours chart (top teachers)
    const HoursChart = () => {
        const teachers = data || [];
        const maxHours = Math.max(...teachers.map(t => parseFloat(t.total_hours) || 0), 1);

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-6">
                    <Clock className="text-pink-500" size={24} />
                    <h3 className={`text-xl font-bold ${textColor}`}>ชั่วโมงสอนแต่ละครู</h3>
                </div>

                {teachers.length === 0 ? (
                    <p className={`text-center py-8 opacity-60 ${textColor}`}>ไม่มีข้อมูลชั่วโมงสอน</p>
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {teachers.slice(0, 10).map((teacher, i) => {
                            const hours = parseFloat(teacher.total_hours) || 0;
                            const percentage = (hours / maxHours) * 100;
                            return (
                                <div key={i} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`font-bold ${textColor}`}>{teacher.name}</span>
                                        <span className="text-pink-500 font-bold">{hours} ชม.</span>
                                    </div>
                                    <div className={`h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                        <div className={`mt-4 p-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-pink-50'}`}>
                            <p className={`text-center font-bold ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>
                                รวมทั้งหมด {teachers.reduce((sum, t) => sum + (parseFloat(t.total_hours) || 0), 0)} ชั่วโมง
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render room utilization chart
    const RoomUtilizationChart = () => {
        const rooms = data || [];

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="text-cyan-500" size={24} />
                    <h3 className={`text-xl font-bold ${textColor}`}>อัตราการใช้งานห้องเรียน</h3>
                </div>

                {rooms.length === 0 ? (
                    <p className={`text-center py-8 opacity-60 ${textColor}`}>ไม่มีข้อมูลห้องเรียน</p>
                ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {rooms.map((room, i) => (
                            <div key={i} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`font-bold ${textColor}`}>{room.room || room.name}</span>
                                    <span className="text-cyan-500 font-bold">{room.utilization_percent || 0}%</span>
                                </div>
                                <div className={`h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                                        style={{ width: `${room.utilization_percent || 0}%` }}
                                    ></div>
                                </div>
                                <div className={`flex justify-between text-xs mt-1 opacity-60 ${textColor}`}>
                                    <span>{room.type} | ความจุ {room.capacity}</span>
                                    <span>{room.used_periods || 0} คาบ</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Render teaching load chart
    const TeachingLoadChart = () => {
        const teachers = data || [];
        const maxHours = 20;

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="text-violet-500" size={24} />
                    <h3 className={`text-xl font-bold ${textColor}`}>ภาระงานสอนของครู</h3>
                </div>

                {teachers.length === 0 ? (
                    <p className={`text-center py-8 opacity-60 ${textColor}`}>ไม่มีข้อมูลครู</p>
                ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {teachers.map((teacher, i) => {
                            const actualHours = teacher.actual_hours || 0;
                            const maxTeacherHours = teacher.max_hours || maxHours;
                            const percentage = Math.min((actualHours / maxTeacherHours) * 100, 100);
                            const isOverload = actualHours > maxTeacherHours;

                            return (
                                <div key={i} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`font-bold ${textColor}`}>{teacher.teacher || teacher.name}</span>
                                        <span className={`font-bold ${isOverload ? 'text-red-500' : 'text-violet-500'}`}>
                                            {actualHours} / {maxTeacherHours} ชม.
                                        </span>
                                    </div>
                                    <div className={`h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${isOverload ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-violet-500 to-purple-500'}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className={`flex justify-between text-xs mt-1 opacity-60 ${textColor}`}>
                                        <span>{teacher.dept || 'ไม่ระบุแผนก'}</span>
                                        <span>{Math.round(percentage)}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className={`relative w-[90%] max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl border overflow-hidden animate-scale-in ${modalBg}`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                    <h2 className={`text-2xl font-bold ${textColor}`}>{title}</h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                    >
                        <X size={24} className={textColor} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {type === 'schedule' && <ScheduleChart />}
                    {type === 'hours' && <HoursChart />}
                    {type === 'room_utilization' && <RoomUtilizationChart />}
                    {type === 'teaching_load' && <TeachingLoadChart />}
                </div>
            </div>
        </div>,
        document.body
    );
}

