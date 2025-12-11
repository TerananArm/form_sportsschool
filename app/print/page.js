// app/print/page.js
'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function PrintPage() {
    const [data, setData] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        const storedData = localStorage.getItem('printData');
        if (storedData) {
            setData(JSON.parse(storedData));
        }
    }, []);

    if (!data) return <div className="flex items-center justify-center h-screen bg-gray-100">Loading...</div>;

    const { scheduleData, filters, studentInfo, subjects } = data;

    // 1. Use Subjects from Data (Already filtered by Curriculum)
    const filteredSubjects = subjects || [];

    // 2. Split Subjects for Dual Column Layout
    const midIndex = Math.ceil(filteredSubjects.length / 2);
    const leftSubjects = filteredSubjects.slice(0, midIndex);
    const rightSubjects = filteredSubjects.slice(midIndex);

    // Pad right list if needed
    while (rightSubjects.length < leftSubjects.length) {
        rightSubjects.push(null);
    }

    // Totals
    const totalTheory = filteredSubjects.reduce((a, b) => a + (b?.theory_hours || 0), 0);
    const totalPractice = filteredSubjects.reduce((a, b) => a + (b?.practice_hours || 0), 0);
    const totalCredit = filteredSubjects.reduce((a, b) => a + (b?.credit || (b?.theory_hours || 0) + (b?.practice_hours || 0)), 0);

    // Helper to render slots
    const days = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์'];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const timeSlots = [
        "07:45-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
        "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00",
        "16:00-17:00", "17:00-18:00"
    ];

    const renderSlot = (day, period) => {
        const dayData = scheduleData[day];
        const cell = dayData ? dayData[period] : null;

        // Lunch Break (Period 5 - 12:00-13:00)
        if (period === 5) {
            if (day === 'วันจันทร์') {
                return (
                    <td key={period} rowSpan={5} className="vertical-cell text-center bg-white p-0 border-b-0">
                        <div className="vertical-text">พักกลางวัน</div>
                    </td>
                );
            }
            return null;
        }

        if (cell === 'skip') return null;

        if (cell && cell !== 'skip') {
            return (
                <td key={period} colSpan={cell.duration} className="text-center p-1 border border-black h-[50px] align-middle">
                    <div className="flex flex-col justify-center items-center leading-tight text-[10px] w-full h-full overflow-hidden">
                        <span className="font-bold">{cell.subject_code}</span>
                        <span>{cell.room_name || '-'}</span>
                        {cell.teacher_name && <span className="text-[9px] text-gray-600 truncate w-full px-0.5">{cell.teacher_name}</span>}
                    </div>
                </td>
            );
        }

        return <td key={period} className="border border-black h-[50px]"></td>;
    };

    return (
        <div className="flex h-screen bg-[#525659] font-sans overflow-hidden">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
                @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Outlined');
                
                body { margin: 0; padding: 0; font-family: 'Sarabun', sans-serif; background-color: #525659; }
                
                .paper-sheet {
                    background: white;
                    width: 297mm; /* A4 Landscape */
                    min-height: 210mm;
                    padding: 15mm;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    transform-origin: top center;
                    transition: transform 0.2s ease;
                }

                @media print {
                    @page { size: landscape; margin: 0; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    .paper-sheet { width: 100%; height: 100%; box-shadow: none; padding: 10mm; margin: 0; transform: none !important; }
                    header, aside, .no-print { display: none !important; }
                    .main-container { padding: 0 !important; background: white !important; overflow: visible !important; }
                }

                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid black; padding: 4px; }
                .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; margin: 0 auto; font-weight: bold; font-size: 12px; }
                
                /* Scrollbar for sidebar */
                aside::-webkit-scrollbar { width: 8px; }
                aside::-webkit-scrollbar-track { background: #323639; }
                aside::-webkit-scrollbar-thumb { background: #7e8182; border-radius: 4px; }
            `}</style>

            {/* Sidebar */}
            <aside className="w-[280px] bg-[#323639] border-r border-black flex flex-col items-center pt-6 overflow-y-auto hidden md:flex no-print shrink-0">
                <div className="cursor-pointer mb-6 group" onClick={() => setZoom(1)}>
                    <div className={`w-[160px] h-[110px] bg-white border-[3px] shadow-lg p-1 flex flex-col gap-0.5 transition-all group-hover:border-[#8ab4f8] ${zoom === 1 ? 'border-[#8ab4f8]' : 'border-transparent'} relative overflow-hidden`}>
                        {/* Mini Preview Header */}
                        <div className="h-4 w-full border-b border-[#ccc] bg-white flex items-center justify-center">
                            <div className="text-[4px] text-black font-bold whitespace-nowrap">วิทยาลัยเทคนิคสุพรรณบุรี</div>
                        </div>
                        {/* Mini Content */}
                        <div className="h-full bg-white flex flex-col items-center pt-1 gap-0.5 opacity-50">
                            <div className="w-[90%] h-1 bg-black/20"></div>
                            <div className="w-[90%] h-1 bg-black/20"></div>
                            <div className="w-[90%] h-8 border border-black/10 mt-1 grid grid-cols-10 grid-rows-5 gap-[1px]">
                                {[...Array(50)].map((_, i) => <div key={i} className="bg-black/5"></div>)}
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Toolbar */}
                <header className="h-14 bg-[#323639] text-[#f1f1f1] flex items-center justify-between px-4 shadow-md z-50 shrink-0 no-print">
                    <div className="flex items-center gap-4">
                        <button onClick={() => window.close()} className="p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors">
                            <span className="material-icons-outlined text-[20px]">arrow_back</span>
                        </button>
                        <span className="text-sm font-medium">{studentInfo?.classLevel || 'ตารางสอน'} - {studentInfo?.department || 'แผนก'}</span>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2 bg-[#202124] rounded-full px-2 py-1">
                        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="p-1.5 hover:bg-white/10 rounded-full"><span className="material-icons-outlined text-[18px]">remove</span></button>
                        <span className="w-12 text-center text-xs font-medium">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => z + 0.1)} className="p-1.5 hover:bg-white/10 rounded-full"><span className="material-icons-outlined text-[18px]">add</span></button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button onClick={() => setRotation(r => r + 90)} className="p-2 hover:bg-white/10 rounded-full" title="Rotate"><span className="material-icons-outlined text-[20px]">rotate_right</span></button>
                        <button onClick={() => window.print()} className="p-2 hover:bg-white/10 rounded-full" title="Save as PDF (Print)"><span className="material-icons-outlined text-[20px]">file_download</span></button>
                        <button onClick={() => window.print()} className="p-2 hover:bg-white/10 rounded-full text-blue-300" title="Print"><span className="material-icons-outlined text-[20px]">print</span></button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="main-container flex-1 overflow-auto flex justify-center p-8 bg-[#525659] relative">
                    <div
                        className="paper-sheet flex flex-col"
                        style={{
                            transform: `scale(${zoom}) rotate(${rotation}deg)`,
                            marginBottom: rotation % 180 !== 0 ? '200px' : '0' // Add spacing when rotated
                        }}
                    >
                        {/* Header Section */}
                        <div className="flex border border-black mb-6">
                            {/* Left: Info */}
                            <div className="w-[35%] p-4 border-r border-black flex flex-col justify-between relative">
                                <div className="text-center mb-4">
                                    <h1 className="text-xl font-bold text-black mt-8">วิทยาลัยเทคนิคสุพรรณบุรี</h1>
                                </div>

                                <div className="text-sm space-y-1 pl-2">
                                    <div className="flex"><span className="font-bold w-24">ภาคเรียนที่</span> <span>{filters.term}</span></div>
                                    <div className="flex"><span className="font-bold w-24">ระดับชั้น</span> <span>{studentInfo?.classLevel || '-'}</span></div>
                                    <div className="flex"><span className="font-bold w-24">แผนก/ครู</span> <span>{studentInfo?.teacherName || studentInfo?.department || '-'}</span></div>
                                </div>
                            </div>

                            {/* Right: Subject List (Dual Column) */}
                            <div className="w-[65%]">
                                <table className="w-full h-full border-none">
                                    <thead>
                                        <tr className="text-center text-[11px]">
                                            <th className="w-[15%]">รหัสวิชา</th>
                                            <th className="w-[25%]">ชื่อรายวิชา</th>
                                            <th className="w-[3%]">ท.</th>
                                            <th className="w-[3%]">ป.</th>
                                            <th className="w-[3%]">น.</th>

                                            <th className="w-[15%]">รหัสวิชา</th>
                                            <th className="w-[25%]">ชื่อรายวิชา</th>
                                            <th className="w-[3%]">ท.</th>
                                            <th className="w-[3%]">ป.</th>
                                            <th className="w-[3%]">น.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leftSubjects.map((sub, i) => {
                                            const rightSub = rightSubjects[i];
                                            return (
                                                <tr key={i} className="text-[11px]">
                                                    {/* Left Column */}
                                                    <td className="text-center">{sub.code}</td>
                                                    <td>{sub.name}</td>
                                                    <td className="text-center">{sub.theory_hours}</td>
                                                    <td className="text-center">{sub.practice_hours}</td>
                                                    <td className="text-center">{sub.credit}</td>

                                                    {/* Right Column */}
                                                    <td className="text-center">{rightSub?.code || ''}</td>
                                                    <td>{rightSub?.name || ''}</td>
                                                    <td className="text-center">{rightSub ? rightSub.theory_hours : ''}</td>
                                                    <td className="text-center">{rightSub ? rightSub.practice_hours : ''}</td>
                                                    <td className="text-center">{rightSub ? rightSub.credit : ''}</td>
                                                </tr>
                                            );
                                        })}
                                        {/* Totals Row */}
                                        <tr className="font-bold text-[11px]">
                                            <td colSpan="2" className="text-right pr-2 border-r-0"></td>
                                            <td colSpan="3" className="border-l-0"></td>

                                            <td colSpan="2" className="text-right pr-2">รวม</td>
                                            <td className="text-center">{totalTheory}</td>
                                            <td className="text-center">{totalPractice}</td>
                                            <td className="text-center">{totalCredit}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Schedule Table */}
                        <table className="w-full border border-black">
                            <thead>
                                <tr className="text-[10px]">
                                    <th className="w-[50px]">วัน</th>
                                    <th className="whitespace-nowrap px-1">07:45 - 08:00</th>
                                    {timeSlots.slice(1).map((t, i) => <th key={i} className="whitespace-nowrap px-1">{t}</th>)}
                                </tr>
                                <tr className="text-[11px]">
                                    <th>คาบ</th>
                                    <th></th>
                                    <th>1</th>
                                    <th>2</th>
                                    <th>3</th>
                                    <th>4</th>
                                    <th></th>
                                    <th>5</th>
                                    <th>6</th>
                                    <th>7</th>
                                    <th>8</th>
                                    <th>9</th>
                                </tr>
                            </thead>
                            <tbody>
                                {days.map(day => (
                                    <tr key={day} className="h-[45px]">
                                        <td className="text-center font-bold text-[12px]">{day === 'วันพฤหัสบดี' ? 'วันพฤหัสฯ' : day}</td>

                                        {day === 'วันจันทร์' ? (
                                            <td key="flag" rowSpan={5} className="vertical-cell text-center bg-white p-0">
                                                <div className="vertical-text">กิจกรรมหน้าเสาธง</div>
                                            </td>
                                        ) : null}

                                        {periods.slice(0, 4).map(period => renderSlot(day, period))}

                                        {periods.slice(4).map(period => renderSlot(day, period))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
}
