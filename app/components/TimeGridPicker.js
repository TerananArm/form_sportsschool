// app/components/TimeGridPicker.js
'use client';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const DAYS = [
    { id: 1, name: 'จันทร์' },
    { id: 2, name: 'อังคาร' },
    { id: 3, name: 'พุธ' },
    { id: 4, name: 'พฤหัสบดี' },
    { id: 5, name: 'ศุกร์' }
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function TimeGridPicker({ value, onChange }) {
    const { isDarkMode } = useTheme();
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        if (value) {
            if (typeof value === 'string') {
                try { setSelected(JSON.parse(value)); } catch { setSelected([]); }
            } else if (Array.isArray(value)) {
                setSelected(value);
            }
        }
    }, [value]);

    const isSelected = (day, period) => {
        const daySlot = selected.find(s => s.day === day);
        return daySlot?.periods?.includes(period);
    };

    const toggleSlot = (day, period) => {
        if (period === 5) return;

        let newSelected = [...selected];
        const dayIndex = newSelected.findIndex(s => s.day === day);

        if (dayIndex === -1) {
            newSelected.push({ day, periods: [period] });
        } else {
            const periods = newSelected[dayIndex].periods;
            if (periods.includes(period)) {
                newSelected[dayIndex].periods = periods.filter(p => p !== period);
                if (newSelected[dayIndex].periods.length === 0) {
                    newSelected.splice(dayIndex, 1);
                }
            } else {
                newSelected[dayIndex].periods = [...periods, period].sort((a, b) => a - b);
            }
        }

        setSelected(newSelected);
        onChange?.(newSelected);
    };

    const toggleDay = (day) => {
        const availablePeriods = PERIODS.filter(p => p !== 5);
        const daySlot = selected.find(s => s.day === day);
        let newSelected;

        if (daySlot && daySlot.periods.length === availablePeriods.length) {
            newSelected = selected.filter(s => s.day !== day);
        } else {
            newSelected = selected.filter(s => s.day !== day);
            newSelected.push({ day, periods: availablePeriods });
        }

        setSelected(newSelected);
        onChange?.(newSelected);
    };

    const togglePeriodRow = (period) => {
        if (period === 5) return;

        const allDays = DAYS.map(d => d.id);
        const allSelected = allDays.every(day => isSelected(day, period));

        let newSelected = [...selected];

        if (allSelected) {
            newSelected = newSelected.map(s => ({
                ...s,
                periods: s.periods.filter(p => p !== period)
            })).filter(s => s.periods.length > 0);
        } else {
            for (const day of allDays) {
                const dayIndex = newSelected.findIndex(s => s.day === day);
                if (dayIndex === -1) {
                    newSelected.push({ day, periods: [period] });
                } else if (!newSelected[dayIndex].periods.includes(period)) {
                    newSelected[dayIndex].periods = [...newSelected[dayIndex].periods, period].sort((a, b) => a - b);
                }
            }
        }

        setSelected(newSelected);
        onChange?.(newSelected);
    };

    // Glass theme styles
    const containerClass = isDarkMode
        ? 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20'
        : 'bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-300/30';

    const dayHeaderClass = isDarkMode
        ? 'text-red-400 hover:bg-white/5'
        : 'text-red-600 hover:bg-red-50/50';

    const periodLabelClass = isDarkMode
        ? 'bg-white/5 text-white/70 hover:bg-white/10'
        : 'bg-white/50 text-slate-600 hover:bg-white/70';

    const cellClass = (isActive, isBreak) => {
        if (isBreak) {
            return isDarkMode
                ? 'bg-transparent text-white/30 cursor-default'
                : 'bg-transparent text-slate-400 cursor-default';
        }
        if (isActive) {
            return 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25 scale-[1.02]';
        }
        return isDarkMode
            ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10 hover:border-red-500/30'
            : 'bg-white/60 text-slate-600 hover:bg-white/80 hover:text-red-600 border border-white/50 hover:border-red-300';
    };

    return (
        <div className={`rounded-2xl p-5 ${containerClass}`}>
            {/* Grid */}
            <div className="grid grid-cols-6 gap-2">
                {/* Header Row - Days */}
                <div className="h-10"></div>
                {DAYS.map(day => (
                    <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`h-10 rounded-xl font-bold text-sm transition-all duration-200 ${dayHeaderClass}`}
                    >
                        {day.name}
                    </button>
                ))}

                {/* Period Rows */}
                {PERIODS.map(period => (
                    <>
                        {/* Period Label */}
                        <button
                            key={`label-${period}`}
                            type="button"
                            onClick={() => togglePeriodRow(period)}
                            disabled={period === 5}
                            className={`h-11 rounded-xl font-semibold text-sm transition-all duration-200 ${period === 5 ? 'cursor-default opacity-50' : ''
                                } ${periodLabelClass}`}
                        >
                            {period}
                        </button>

                        {/* Day Cells */}
                        {DAYS.map(day => (
                            <button
                                key={`${day.id}-${period}`}
                                type="button"
                                onClick={() => toggleSlot(day.id, period)}
                                disabled={period === 5}
                                className={`h-11 rounded-xl font-medium text-sm transition-all duration-200 ${cellClass(isSelected(day.id, period), period === 5)
                                    } ${period !== 5 ? 'hover:scale-[1.02] active:scale-95' : ''}`}
                            >
                                {period === 5 ? 'พัก' : period}
                            </button>
                        ))}
                    </>
                ))}
            </div>

            {/* Summary */}
            {selected.length > 0 && (
                <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-white/30'}`}>
                    <div className="flex flex-wrap gap-2">
                        {selected.map(s => (
                            <span
                                key={s.day}
                                className={`px-3 py-1 rounded-full text-xs font-bold ${isDarkMode
                                        ? 'bg-red-500/20 text-red-300'
                                        : 'bg-red-100 text-red-600'
                                    }`}
                            >
                                {DAYS.find(d => d.id === s.day)?.name}: คาบ {s.periods.join(', ')}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
