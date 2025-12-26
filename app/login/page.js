'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { User, Lock, ArrowRight, Sun, Moon, Shield, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (res?.ok && !res?.error) {
      Swal.fire({
        title: 'เข้าสู่ระบบสำเร็จ',
        text: 'กำลังเข้าสู่ระบบจัดการ...',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        router.push('/dashboard');
      });
    } else {
      Swal.fire({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'ลองอีกครั้ง'
      });
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen relative flex items-center justify-center overflow-hidden font-prompt transition-colors duration-500 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>

      {/* Premium Background */}
      <div className="absolute inset-0 z-0">
        {/* Base Gradient */}
        <div className={`absolute inset-0 transition-all duration-700 ${isDarkMode
            ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
            : 'bg-gradient-to-br from-red-900 via-red-800 to-orange-900'
          }`} />

        {/* Animated Grid Pattern */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${isDarkMode ? 'opacity-[0.03]' : 'opacity-[0.08]'}`}
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}>
        </div>

        {/* Floating Orbs */}
        <div className={`absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse ${isDarkMode ? 'bg-blue-600/20' : 'bg-yellow-400/20'}`} />
        <div className={`absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse ${isDarkMode ? 'bg-purple-600/15' : 'bg-red-500/20'}`} />
        <div className={`absolute top-[50%] right-[10%] w-[300px] h-[300px] rounded-full blur-[100px] ${isDarkMode ? 'bg-cyan-500/10' : 'bg-orange-400/15'}`} />

        {/* Diagonal Lines Decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-0 right-0 w-[800px] h-[2px] ${isDarkMode ? 'bg-gradient-to-l from-cyan-500/30 to-transparent' : 'bg-gradient-to-l from-yellow-400/40 to-transparent'} transform rotate-45 translate-x-[200px] translate-y-[100px]`} />
          <div className={`absolute bottom-0 left-0 w-[600px] h-[2px] ${isDarkMode ? 'bg-gradient-to-r from-purple-500/30 to-transparent' : 'bg-gradient-to-r from-red-300/40 to-transparent'} transform -rotate-45 -translate-x-[100px] translate-y-[-200px]`} />
        </div>
      </div>

      {/* Theme Toggle - Top Right Corner */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-2xl backdrop-blur-md transition-all duration-300 shadow-lg hover:scale-105 ${isDarkMode
              ? 'bg-slate-800/80 text-yellow-400 hover:bg-slate-700/80 border border-slate-700'
              : 'bg-white/20 text-white hover:bg-white/30 border border-white/20'
            }`}
        >
          {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
        </button>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-4">
        <div className={`relative backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${isDarkMode
            ? 'bg-slate-900/70 border border-slate-700/50'
            : 'bg-white/90 border border-white/50'
          }`}>

          {/* Top Gradient Bar */}
          <div className={`absolute top-0 left-0 w-full h-1.5 ${isDarkMode
              ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500'
              : 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500'
            }`} />

          {/* Decorative Corner Accents */}
          <div className={`absolute top-0 right-0 w-32 h-32 ${isDarkMode ? 'bg-cyan-500/5' : 'bg-yellow-500/10'} rounded-bl-full`} />
          <div className={`absolute bottom-0 left-0 w-24 h-24 ${isDarkMode ? 'bg-purple-500/5' : 'bg-red-500/10'} rounded-tr-full`} />

          <div className="relative p-8 md:p-10">
            {/* Logo & Header */}
            <div className="flex flex-col items-center text-center mb-8">
              {/* Logo with Glow Effect */}
              <div className="relative mb-5">
                <div className={`absolute inset-0 rounded-full blur-xl ${isDarkMode ? 'bg-cyan-500/30' : 'bg-yellow-500/30'} scale-110`} />
                <div className="relative w-28 h-28 drop-shadow-2xl">
                  <Image
                    src="/images/logo.png"
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Title with Gradient */}
              <h1 className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-slate-800'
                }`}>
                มหาวิทยาลัยการกีฬาแห่งชาติ
              </h1>
              <p className={`text-sm font-light mt-1.5 tracking-wide transition-colors duration-300 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                National Sports University
              </p>

              {/* Admin Badge */}
              <div className={`mt-5 px-4 py-1.5 text-xs font-semibold rounded-full flex items-center gap-2 transition-all duration-300 ${isDarkMode
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                <Shield size={14} />
                <span>สำหรับเจ้าหน้าที่ (Admin Only)</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className={`text-sm font-semibold ml-1 flex items-center gap-2 transition-colors duration-300 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                  <User size={14} />
                  ชื่อผู้ใช้ (Username)
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`block w-full rounded-xl px-4 py-3.5 shadow-sm ring-1 ring-inset transition-all outline-none text-base ${isDarkMode
                        ? 'bg-slate-800/50 text-white ring-slate-700 placeholder:text-slate-500 focus:bg-slate-800 focus:ring-cyan-500'
                        : 'bg-slate-50/80 text-slate-800 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:ring-red-500'
                      }`}
                    placeholder="กรอกชื่อผู้ใช้งาน"
                  />
                  <div className={`absolute inset-0 rounded-xl transition-opacity pointer-events-none ${isDarkMode ? 'bg-gradient-to-r from-cyan-500/5 to-purple-500/5' : 'bg-gradient-to-r from-red-500/5 to-orange-500/5'
                    } opacity-0 group-focus-within:opacity-100`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-semibold ml-1 flex items-center gap-2 transition-colors duration-300 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                  <Lock size={14} />
                  รหัสผ่าน (Password)
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full rounded-xl px-4 py-3.5 shadow-sm ring-1 ring-inset transition-all outline-none text-base ${isDarkMode
                        ? 'bg-slate-800/50 text-white ring-slate-700 placeholder:text-slate-500 focus:bg-slate-800 focus:ring-cyan-500'
                        : 'bg-slate-50/80 text-slate-800 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:ring-red-500'
                      }`}
                    placeholder="กรอกรหัสผ่าน"
                  />
                  <div className={`absolute inset-0 rounded-xl transition-opacity pointer-events-none ${isDarkMode ? 'bg-gradient-to-r from-cyan-500/5 to-purple-500/5' : 'bg-gradient-to-r from-red-500/5 to-orange-500/5'
                    } opacity-0 group-focus-within:opacity-100`} />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full rounded-xl py-4 font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 group mt-4 ${isDarkMode
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white hover:shadow-cyan-500/25 hover:shadow-xl'
                    : 'bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-orange-600 text-white hover:shadow-red-500/25 hover:shadow-xl'
                  } active:scale-[0.98]`}
              >
                {isLoading ? (
                  <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200/10">
              <div className="flex items-center justify-center gap-2">
                <Sparkles size={12} className={isDarkMode ? 'text-cyan-500' : 'text-red-500'} />
                <p className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  © 2026 ระบบรับสมัครนักศึกษาออนไลน์
                </p>
                <Sparkles size={12} className={isDarkMode ? 'text-cyan-500' : 'text-red-500'} />
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Floating Text Below Card */}
        <p className={`text-center text-xs mt-6 transition-colors duration-300 ${isDarkMode ? 'text-slate-600' : 'text-white/60'}`}>
          Secure Login Portal • มหาวิทยาลัยการกีฬาแห่งชาติ
        </p>
      </div>
    </div>
  );
}