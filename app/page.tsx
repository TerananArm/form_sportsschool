"use client";

import React from "react";
import Image from "next/image";
import ApplicantForm from "./components/ApplicantForm";
import { useTheme } from "./context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function RegistrationPage() {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 relative overflow-hidden font-prompt selection:bg-red-500 selection:text-white transition-colors duration-500">
      {/* Premium Smooth Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#0B0F19] dark:to-[#020617]"></div>
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-red-50/50 via-transparent to-transparent dark:from-red-900/10 dark:via-transparent dark:to-transparent opacity-60"></div>
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-all duration-300 backdrop-blur-md shadow-lg ${isDarkMode ? 'bg-slate-800/50 text-yellow-400 hover:bg-slate-700' : 'bg-white/20 text-white hover:bg-white/30 border border-white/20'}`}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Background Decor (Subtle & Professional) */}

      {/* Background Decor (Subtle & Professional) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-red-500/10 to-orange-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 blur-[100px]" />
      </div>

      <div className="w-full bg-gradient-to-b from-red-800 to-red-700 dark:from-red-900 dark:to-red-950 py-8 px-4 rounded-b-[2.5rem] shadow-xl mb-8 overflow-hidden relative transition-colors duration-500">
        {/* Abstract Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none mix-blend-overlay">
          <div className="absolute inset-0 bg-[url('/images/logo.png')] bg-repeat opacity-5 grayscale" style={{ backgroundSize: '150px' }}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center animate-fade-in max-w-4xl mx-auto space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
            <div className="w-20 h-20 md:w-24 md:h-24 relative mx-auto bg-white dark:bg-slate-800 rounded-full p-1 flex items-center justify-center shadow-xl ring-4 ring-white/20 transform group-hover:scale-105 transition-all duration-500">
              <div className="w-full h-full relative rounded-full overflow-hidden border-4 border-double border-red-100 dark:border-red-900/50">
                <Image src="/images/logo.png" alt="University Logo" fill className="object-contain p-1" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-bold text-white tracking-wide drop-shadow-lg leading-tight">
              มหาวิทยาลัยการกีฬาแห่งชาติ
            </h1>
            <p className="text-red-100 text-base md:text-lg font-light">
              National Sports University
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg hover:bg-white/20 transition-all cursor-default mt-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border-2 border-green-200"></span>
            </span>
            <p className="text-sm text-white font-medium tracking-wide">
              เปิดรับสมัครนักศึกษาใหม่ ประจำปีการศึกษา 2569
            </p>
          </div>
        </div>
      </div>

      <div className="w-full px-4 pb-12 relative z-10 -mt-8">
        {/* Form Component */}
        <div className="animate-fade-up">
          <ApplicantForm onSuccess={() => window.scrollTo(0, 0)} editData={null} />
        </div>

        {/* Footer info */}
        <div className="text-center text-slate-500 dark:text-slate-400 text-sm pb-8 mt-12 font-light">
          <p>© 2026 มหาวิทยาลัยการกีฬาแห่งชาติ. All rights reserved.</p>
          <p className="mt-1 opacity-70">ระบบรับสมัครนักศึกษาออนไลน์</p>
        </div>
      </div>
    </div>
  );
}
