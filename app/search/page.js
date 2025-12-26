'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, RefreshCw, Printer, User, ArrowLeft, FileText, Ban, CheckCircle, HelpCircle, Moon, Sun } from 'lucide-react';
import { printApplicationForm } from '../../lib/printUtils';
import { useTheme } from '../context/ThemeContext';

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Theme Hook
    const { isDarkMode, toggleTheme } = useTheme();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setHasSearched(true);
        try {
            const res = await fetch(`/api/applicants/search?query=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data.success) {
                setSearchResults(data.data);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error("Search error:", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handlePrint = (applicant) => {
        printApplicationForm(applicant);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-500 selection:bg-red-500 selection:text-white font-sans">

            {/* Premium Smooth Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#0B0F19] dark:to-[#020617]"></div>
                <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-red-50/50 via-transparent to-transparent dark:from-red-900/10 dark:via-transparent dark:to-transparent opacity-60"></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col min-h-screen">

                {/* Header Navigation */}
                <div className="flex items-center justify-between mb-16 animate-fade-in-down">
                    <Link
                        href="/"
                        className="group flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 hover:border-red-500/50 dark:hover:border-red-500/50 hover:shadow-lg transition-all duration-300"
                    >
                        <ArrowLeft size={18} className="text-slate-400 group-hover:text-red-500 group-hover:-translate-x-1 transition-all" />
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">ย้อนกลับ</span>
                    </Link>

                    <button
                        onClick={toggleTheme}
                        className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md hover:scale-105 transition-all text-slate-500 dark:text-yellow-400 overflow-hidden group"
                        title="สลับโหมดสี"
                    >
                        <div className="relative z-10">
                            {isDarkMode ? <Sun size={20} className="animate-spin-slow" /> : <Moon size={20} className="group-hover:-rotate-12 transition-transform" />}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                </div>

                {/* Hero Content */}
                <div className="flex flex-col items-center justify-center text-center space-y-8 mb-16 animate-fade-in">
                    <div className="space-y-4 max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            ระบบตรวจสอบสถานะออนไลน์
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                            ติดตามผล<br className="md:hidden" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-gradient-x">การสมัครสอบ</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
                            ตรวจสอบรายชื่อผู้สมัคร สถานะการชำระเงิน และประกาศผลการคัดเลือก<br className="hidden md:block" />ได้สะดวกรวดเร็ว เพียงกรอกข้อมูลของท่าน
                        </p>
                    </div>

                    {/* Search Bar - Magnificent Style */}
                    <div className="w-full max-w-2xl mx-auto relative group z-20">
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative flex items-center bg-white dark:bg-[#0F1623] rounded-[1.8rem] shadow-2xl shadow-slate-200/50 dark:shadow-none p-2 border border-slate-100 dark:border-slate-800 transition-all">
                            <div className="flex-1 flex items-center pl-6">
                                <Search className="text-slate-400 group-hover:text-red-500 transition-colors" size={24} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                    placeholder="พิมพ์ชื่อ-นามสกุล หรือเลขที่ใบสมัคร..."
                                    className="w-full py-4 px-4 bg-transparent text-lg font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none"
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={isSearching || !searchQuery.trim()}
                                className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-[1.4rem] font-bold text-base shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                            >
                                {isSearching ? (
                                    <>
                                        <RefreshCw size={20} className="animate-spin" />
                                        <span>กำลังค้นหา...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>ค้นหาข้อมูล</span>
                                        <Search size={18} strokeWidth={2.5} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="flex-1 w-full max-w-5xl mx-auto">
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-t-red-600 rounded-full animate-spin"></div>
                            </div>
                            <p className="mt-8 text-slate-500 dark:text-slate-400 font-medium">กำลังค้นหาข้อมูลในระบบ...</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="animate-fade-in-up space-y-8">
                            <div className="flex items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">ผลการค้นหา</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">พบข้อมูลทั้งหมด <span className="text-red-600 dark:text-red-400 font-bold">{searchResults.length}</span> รายการ</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {searchResults.map((applicant, idx) => (
                                    <div
                                        key={applicant.id}
                                        className="group relative bg-white dark:bg-[#0F1623] rounded-[2rem] p-1 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:shadow-red-900/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden"
                                        style={{ animationDelay: `${idx * 150}ms` }}
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        <div className="flex flex-col md:flex-row p-6 md:p-8 gap-8 items-start relative z-10">
                                            {/* Photo */}
                                            <div className="relative shrink-0 mx-auto md:mx-0">
                                                <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden ring-4 ring-slate-50 dark:ring-slate-800/50 shadow-lg group-hover:scale-105 transition-transform duration-500 bg-slate-100 dark:bg-slate-800">
                                                    {applicant.photoPath ? (
                                                        <img src={applicant.photoPath} alt={applicant.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                            <User size={48} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-max px-4 py-1.5 rounded-full text-xs font-bold shadow-lg border-2 border-white dark:border-[#0F1623] flex items-center gap-1.5
                                                    ${applicant.status === 'ผ่านการคัดเลือก' ? 'bg-green-500 text-white' :
                                                        applicant.status === 'ไม่ผ่าน' ? 'bg-red-500 text-white' :
                                                            applicant.status === 'สละสิทธิ์' ? 'bg-orange-500 text-white' :
                                                                'bg-blue-500 text-white'}`}
                                                >
                                                    {applicant.status === 'ผ่านการคัดเลือก' ? <CheckCircle size={12} strokeWidth={3} /> :
                                                        applicant.status === 'ไม่ผ่าน' ? <Ban size={12} strokeWidth={3} /> :
                                                            <HelpCircle size={12} strokeWidth={3} />}
                                                    <span>{applicant.status || 'รอสัมภาษณ์'}</span>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 w-full text-center md:text-left space-y-5">
                                                <div>
                                                    <div className="inline-flex items-center gap-2 mb-2 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-mono font-bold tracking-wider">
                                                        APP ID: <span className="text-slate-800 dark:text-slate-200">{applicant.applicationNumber}</span>
                                                    </div>
                                                    <h3 className="text-2xl md:text-4xl font-bold text-slate-800 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                                        {applicant.name}
                                                    </h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-2xl flex items-center gap-4 border border-slate-100 dark:border-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-800/40 transition-colors">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase">โรงเรียนเดิม</p>
                                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{applicant.schoolName || '-'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-2xl flex items-center gap-4 border border-slate-100 dark:border-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-800/40 transition-colors">
                                                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                                            <User size={20} />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase">ประเภทกีฬา</p>
                                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{applicant.sportType || '-'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action */}
                                            <div className="flex flex-col justify-center items-center md:items-end w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                                                <button
                                                    onClick={() => handlePrint(applicant)}
                                                    className="group/btn relative overflow-hidden rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-base px-8 py-4 shadow-xl hover:scale-[1.02] active:scale-95 transition-all w-full md:w-auto min-w-[160px]"
                                                >
                                                    <div className="absolute inset-0 bg-red-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                                    <div className="relative flex items-center justify-center gap-2 group-hover/btn:text-white transition-colors">
                                                        <Printer size={20} />
                                                        <span>พิมพ์ใบสมัคร</span>
                                                    </div>
                                                </button>
                                                <p className="text-[10px] text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    คลิกเพื่อดาวน์โหลด PDF
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : hasSearched ? (
                        <div className="bg-white dark:bg-[#0F1623] rounded-[2.5rem] p-12 text-center border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none animate-fade-in-up">
                            <div className="w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search size={40} className="text-red-500 opacity-50" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">ไม่พบข้อมูลใบสมัคร</h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                ไม่พบข้อมูลที่ตรงกับคำค้นหา "{searchQuery}" <br />
                                กรุณาตรวจสอบความถูกต้องแล้วลองใหม่อีกครั้ง
                            </p>
                            <button
                                onClick={() => { setSearchQuery(''); document.querySelector('input').focus(); }}
                                className="mt-8 px-6 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                            >
                                ล้างคำค้นหา
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30 select-none pointer-events-none">
                            <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800/50 rounded-3xl rotate-12 flex items-center justify-center mb-8 grayscale">
                                <FileText size={48} className="text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-400 dark:text-slate-600">พื้นที่แสดงผลการค้นหา</h3>
                            <p className="text-slate-400 dark:text-slate-600">กรอกข้อมูลด้านบนเพื่อเริ่มตรวจสอบสถานะ</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-auto pt-16 pb-8 text-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mb-8"></div>
                    <p className="text-slate-400 dark:text-slate-600 text-sm font-medium">
                        © 2024 สถาบันการพละศึกษา วิทยาเขตชลบุรี - ระบบรับสมัครนักเรียนนักศึกษาออนไลน์
                    </p>
                </div>
            </div>
        </div>
    );
}
