// app/components/TeacherAvailabilityModal.js
'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Save, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Swal from 'sweetalert2';

const DAYS = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function TeacherAvailabilityModal({ isOpen, onClose, teacher, onSave }) {
    const { isDarkMode } = useTheme();
    const [unavailable, setUnavailable] = useState({});
    const [mounted, setMounted] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (teacher?.unavailableTimes) {
            try {
                const parsed = typeof teacher.unavailableTimes === 'string'
                    ? JSON.parse(teacher.unavailableTimes)
                    : teacher.unavailableTimes;
                setUnavailable(parsed || {});
            } catch {
                setUnavailable({});
            }
        } else {
            setUnavailable({});
        }
    }, [teacher]);

    const toggleSlot = (day, period) => {
        setUnavailable(prev => {
            const key = `${day}-${period}`;
            const newState = { ...prev };
            if (newState[key]) {
                delete newState[key];
            } else {
                newState[key] = true;
            }
            return newState;
        });
    };

    const isUnavailable = (day, period) => {
        return unavailable[`${day}-${period}`] === true;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/dashboard/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'teachers',
                    id: teacher.id,
                    data: { unavailableTimes: JSON.stringify(unavailable) }
                })
            });

            if (res.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'บันทึกสำเร็จ',
                    text: 'บันทึกเวลาไม่สะดวกแล้ว',
                    timer: 1500,
                    showConfirmButton: false,
                    background: isDarkMode ? '#1e293b' : '#fff',
                    color: isDarkMode ? '#fff' : '#000'
                });
                onSave && onSave();
                onClose();
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message,
                background: isDarkMode ? '#1e293b' : '#fff',
                color: isDarkMode ? '#fff' : '#000'
            });
        } finally {
            setSaving(false);
        }
    };

    const countUnavailable = () => Object.keys(unavailable).length;

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-3xl shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
                }`}>
                {/* Header */}
                <div className={`sticky top-0 z-10 p-6 border-b ${isDarkMode ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-200'
                    } backdrop-blur-sm`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                    เวลาไม่สะดวกสอน
                                </h2>
                                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {teacher?.name || 'ครู'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Instructions */}
                    <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${isDarkMode ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-200'
                        }`}>
                        <AlertCircle className="text-orange-500 mt-0.5" size={20} />
                        <div>
                            <p className={`font-medium ${isDarkMode ? 'text-orange-400' : 'text-orange-700'}`}>
                                คลิกเลือกช่วงเวลาที่ครูไม่สะดวกสอน
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-orange-300/70' : 'text-orange-600'}`}>
                                ช่องสีแดง = ไม่สะดวก / ช่องสีเขียว = สะดวก
                            </p>
                        </div>
                    </div>

                    {/* Time Grid */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className={`p-3 text-left font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                        วัน/คาบ
                                    </th>
                                    {PERIODS.map(period => (
                                        <th key={period} className={`p-2 text-center font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                            {period}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {DAYS.map((day, dayIdx) => (
                                    <tr key={day} className={dayIdx % 2 === 0 ? (isDarkMode ? 'bg-white/5' : 'bg-slate-50') : ''}>
                                        <td className={`p-3 font-medium ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
                                            {day.replace('วัน', '')}
                                        </td>
                                        {PERIODS.map(period => (
                                            <td key={period} className="p-1 text-center">
                                                <button
                                                    onClick={() => toggleSlot(day, period)}
                                                    className={`w-10 h-10 rounded-lg transition-all duration-200 font-bold text-sm ${isUnavailable(day, period)
                                                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                                                            : isDarkMode
                                                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/40'
                                                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                                                        }`}
                                                >
                                                    {isUnavailable(day, period) ? '✕' : '✓'}
                                                </button>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className={`mt-6 p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                        <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            เลือกไว้ <span className="font-bold text-red-500">{countUnavailable()}</span> ช่วงเวลาที่ไม่สะดวก
                            (จากทั้งหมด {DAYS.length * PERIODS.length} ช่วง)
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className={`sticky bottom-0 p-6 border-t flex justify-end gap-3 ${isDarkMode ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-200'
                    } backdrop-blur-sm`}>
                    <button
                        onClick={onClose}
                        className={`px-6 py-3 rounded-xl font-medium transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                กำลังบันทึก...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                บันทึก
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
