'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function DatePicker({ value, onChange, placeholder = "Select Date" }) {
    const { t, language } = useLanguage();
    const { isDarkMode } = useTheme();

    // Parse initial value YYYY-MM-DD
    const parseDate = (dateString) => {
        if (!dateString) return { day: '', month: '', year: '' };
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return { day: '', month: '', year: '' };
        return {
            day: date.getDate(),
            month: date.getMonth(), // 0-11
            year: date.getFullYear()
        };
    };

    const [selectedDay, setSelectedDay] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');

    useEffect(() => {
        const { day, month, year } = parseDate(value);
        setSelectedDay(day);
        setSelectedMonth(month);
        setSelectedYear(year);
    }, [value]);

    // Generate Years (1950 - Current + 5)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1950 + 6 }, (_, i) => currentYear + 5 - i);

    // Generate Months (Localized)
    const getMonthName = (monthIndex) => {
        const date = new Date(2000, monthIndex, 1);
        const locale = language === 'th' ? 'th-TH' :
            language === 'zh' ? 'zh-CN' :
                language === 'ja' ? 'ja-JP' :
                    language === 'ko' ? 'ko-KR' : 'en-US';
        return date.toLocaleDateString(locale, { month: 'long' });
    };

    const months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: getMonthName(i) }));

    // Generate Days (Dynamic based on Month/Year)
    const getDaysInMonth = (month, year) => {
        if (month === '' || year === '') return 31;
        return new Date(year, parseInt(month) + 1, 0).getDate();
    };

    const days = Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1);

    const handleChange = (type, val) => {
        let d = type === 'day' ? val : selectedDay;
        let m = type === 'month' ? val : selectedMonth;
        let y = type === 'year' ? val : selectedYear;

        // Adjust day if exceeds new month's max days
        const maxDays = getDaysInMonth(m, y);
        if (d > maxDays) d = maxDays;

        if (type === 'day') setSelectedDay(val);
        if (type === 'month') setSelectedMonth(val);
        if (type === 'year') setSelectedYear(val);

        if (d !== '' && m !== '' && y !== '') {
            // Format YYYY-MM-DD
            // Remember m is 0-indexed, so we need +1 for the string format
            const date = new Date(y, m, d);
            // Adjust for timezone offset to ensure YYYY-MM-DD matches local expectation if needed,
            // but for simple strings, manual formatting is safer to avoid timezone shifts.
            const mm = String(parseInt(m) + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            onChange(`${y}-${mm}-${dd}`);
        } else {
            onChange('');
        }
    };

    const selectClass = `appearance-none w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all cursor-pointer border ${isDarkMode
        ? 'bg-black/20 focus:bg-black/40 text-white border-white/10 focus:border-white/30'
        : 'bg-slate-50 focus:bg-white border-slate-200 focus:border-blue-500 focus:shadow-sm text-slate-900'
        }`;

    return (
        <div className="flex gap-2 w-full">
            {/* Day */}
            <div className="relative flex-1">
                <select
                    value={selectedDay}
                    onChange={(e) => handleChange('day', e.target.value)}
                    className={selectClass}
                    required
                >
                    <option value="">{t('dateDay') || 'Day'}</option>
                    {days.map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
            </div>

            {/* Month */}
            <div className="relative flex-[2]">
                <select
                    value={selectedMonth}
                    onChange={(e) => handleChange('month', e.target.value)}
                    className={selectClass}
                    required
                >
                    <option value="">{t('dateMonth') || 'Month'}</option>
                    {months.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
            </div>

            {/* Year */}
            <div className="relative flex-[1.5]">
                <select
                    value={selectedYear}
                    onChange={(e) => handleChange('year', e.target.value)}
                    className={selectClass}
                    required
                >
                    <option value="">{t('dateYear') || 'Year'}</option>
                    {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
