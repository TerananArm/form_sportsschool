// app/login/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import ConfirmModal from '../components/ConfirmModal';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Floating Particle Component
const FloatingParticle = ({ delay, duration, size, startX, startY, isDarkMode }) => (
  <div
    className={`absolute rounded-full transition-all duration-[2000ms] ${isDarkMode ? 'bg-blue-400/20' : 'bg-white/40'}`}
    style={{
      width: size,
      height: size,
      left: `${startX}%`,
      top: `${startY}%`,
      animation: `floatParticle ${duration}s ease-in-out ${delay}s infinite`,
    }}
  />
);

// Gradient Orb Component
const GradientOrb = ({ className, isDarkMode }) => (
  <div
    className={`absolute rounded-full blur-3xl transition-all duration-[1500ms] ease-in-out ${className} ${isDarkMode ? 'opacity-30' : 'opacity-40'
      }`}
  />
);

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);

  const { isDarkMode, toggleTheme } = useTheme();
  const { t, language, toggleLanguage } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);

  const languages = [
    { code: 'th', label: 'ภาษาไทย', flag: '🇹🇭' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ตกลง',
    type: 'success',
    cancelText: null
  });

  const router = useRouter();

  // Mount animation
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Generate particles with fixed positions (deterministic for React 19 strict mode)
  const particles = [
    { id: 0, delay: 0, duration: 12, size: 8, startX: 10, startY: 20 },
    { id: 1, delay: 1, duration: 15, size: 6, startX: 80, startY: 15 },
    { id: 2, delay: 2, duration: 10, size: 10, startX: 25, startY: 70 },
    { id: 3, delay: 0.5, duration: 14, size: 5, startX: 60, startY: 40 },
    { id: 4, delay: 3, duration: 11, size: 12, startX: 90, startY: 60 },
    { id: 5, delay: 1.5, duration: 13, size: 7, startX: 15, startY: 85 },
    { id: 6, delay: 2.5, duration: 16, size: 9, startX: 70, startY: 30 },
    { id: 7, delay: 0.8, duration: 12, size: 6, startX: 45, startY: 55 },
    { id: 8, delay: 1.2, duration: 14, size: 11, startX: 35, startY: 10 },
    { id: 9, delay: 2.8, duration: 10, size: 8, startX: 55, startY: 80 },
    { id: 10, delay: 0.3, duration: 15, size: 5, startX: 5, startY: 45 },
    { id: 11, delay: 1.8, duration: 11, size: 10, startX: 85, startY: 75 },
    { id: 12, delay: 3.2, duration: 13, size: 7, startX: 40, startY: 25 },
    { id: 13, delay: 0.6, duration: 16, size: 9, startX: 20, startY: 90 },
    { id: 14, delay: 2.2, duration: 12, size: 6, startX: 75, startY: 50 },
    { id: 15, delay: 1.4, duration: 14, size: 8, startX: 50, startY: 5 },
    { id: 16, delay: 2.6, duration: 10, size: 11, startX: 30, startY: 65 },
    { id: 17, delay: 0.9, duration: 15, size: 5, startX: 65, startY: 35 },
    { id: 18, delay: 1.6, duration: 11, size: 10, startX: 95, startY: 95 },
    { id: 19, delay: 3.5, duration: 13, size: 7, startX: 12, startY: 58 },
  ];

  // Smooth theme toggle with transition state
  const handleThemeToggle = () => {
    setIsThemeTransitioning(true);
    toggleTheme();
    setTimeout(() => setIsThemeTransitioning(false), 1500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (res?.ok && !res?.error) {
      setConfirmConfig({
        isOpen: true,
        title: t('loginSuccess'),
        message: t('loginWelcome'),
        type: 'success',
        confirmText: t('ok'),
        cancelText: null,
        onConfirm: () => router.push('/dashboard')
      });
      setTimeout(() => router.push('/dashboard'), 1500);
    } else {
      setConfirmConfig({
        isOpen: true,
        title: t('loginFailed'),
        message: t('loginError'),
        type: 'danger',
        confirmText: t('tryAgain'),
        cancelText: null
      });
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen w-full overflow-hidden transition-all duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${isDarkMode ? 'bg-[#030712]' : 'bg-gradient-to-br from-[#dbeafe] via-[#c7d2fe] to-[#fae8ff]'
      }`}>

      {/* ===== ANIMATED BACKGROUND ===== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        {/* Noise Texture Overlay */}
        <div className={`absolute inset-0 z-30 mix-blend-overlay transition-opacity duration-[1500ms] ${isDarkMode ? 'opacity-[0.08]' : 'opacity-[0.15]'
          } bg-[url('https://grainy-gradients.vercel.app/noise.svg')]`} />

        {/* Morphing Gradient Background */}
        <div className={`absolute -inset-[100%] z-0 blur-[120px] transition-all duration-[2000ms] ease-in-out ${isDarkMode
          ? 'opacity-50 bg-[conic-gradient(from_180deg_at_50%_50%,_#1e3a5f_0deg,_#0f172a_90deg,_#312e81_180deg,_#0f172a_270deg,_#1e3a5f_360deg)]'
          : 'opacity-60 bg-[conic-gradient(from_0deg_at_50%_50%,_#93c5fd_0deg,_#c4b5fd_90deg,_#f9a8d4_180deg,_#fcd34d_270deg,_#93c5fd_360deg)]'
          }`}
          style={{ animation: 'morphGradient 20s ease-in-out infinite' }}
        />

        {/* Gradient Orbs */}
        <GradientOrb
          isDarkMode={isDarkMode}
          className={`w-[600px] h-[600px] -top-[200px] -left-[200px] ${isDarkMode
            ? 'bg-gradient-to-br from-blue-600/40 to-violet-700/30'
            : 'bg-gradient-to-br from-pink-300/60 to-rose-400/50'
            }`}
          style={{ animation: 'pulseOrb1 8s ease-in-out infinite' }}
        />
        <GradientOrb
          isDarkMode={isDarkMode}
          className={`w-[500px] h-[500px] -bottom-[150px] -right-[150px] ${isDarkMode
            ? 'bg-gradient-to-tl from-purple-700/40 to-indigo-600/30'
            : 'bg-gradient-to-tl from-cyan-300/60 to-blue-400/50'
            }`}
          style={{ animation: 'pulseOrb2 10s ease-in-out infinite' }}
        />
        <GradientOrb
          isDarkMode={isDarkMode}
          className={`w-[400px] h-[400px] top-[40%] left-[60%] ${isDarkMode
            ? 'bg-gradient-to-r from-emerald-700/30 to-teal-600/20'
            : 'bg-gradient-to-r from-amber-200/50 to-orange-300/40'
            }`}
          style={{ animation: 'pulseOrb3 12s ease-in-out infinite' }}
        />

        {/* Floating Particles */}
        {particles.map((p) => (
          <FloatingParticle key={p.id} {...p} isDarkMode={isDarkMode} />
        ))}

        {/* Grid Pattern */}
        <div className={`absolute inset-0 transition-opacity duration-[1500ms] ${isDarkMode ? 'opacity-[0.03]' : 'opacity-[0.08]'
          }`}
          style={{
            backgroundImage: isDarkMode
              ? 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)'
              : 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        {/* Shimmer Effect */}
        <div
          className={`absolute inset-0 z-10 transition-opacity duration-[1500ms] ${isDarkMode ? 'opacity-30' : 'opacity-20'}`}
          style={{
            background: isDarkMode
              ? 'linear-gradient(135deg, transparent 0%, transparent 40%, rgba(99,102,241,0.1) 50%, transparent 60%, transparent 100%)'
              : 'linear-gradient(135deg, transparent 0%, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%, transparent 100%)',
            backgroundSize: '400% 400%',
            animation: 'shimmer 8s ease-in-out infinite',
          }}
        />
      </div>

      {/* ===== THEME TOGGLE BUTTON ===== */}
      <button
        onClick={handleThemeToggle}
        className={`absolute top-6 right-6 p-4 rounded-2xl shadow-2xl transition-all duration-500 z-50 
          hover:scale-110 active:scale-95 border-2 backdrop-blur-xl overflow-hidden group
          ${isDarkMode
            ? 'bg-slate-800/60 border-white/20 text-yellow-300 hover:bg-slate-700/70 hover:border-yellow-400/30 shadow-yellow-500/10'
            : 'bg-white/70 border-white/50 text-amber-500 hover:bg-white/90 hover:border-amber-400/50 shadow-orange-500/20'
          }
          ${isThemeTransitioning ? 'animate-pulse' : ''}
        `}
      >
        {/* Ripple effect on click */}
        <span className="absolute inset-0 rounded-2xl overflow-hidden">
          <span className={`absolute inset-0 transition-transform duration-700 scale-0 group-active:scale-100 rounded-2xl ${isDarkMode ? 'bg-yellow-400/20' : 'bg-amber-400/20'
            }`} />
        </span>

        {/* Icon with rotation animation */}
        <div className={`relative transition-transform duration-700 ${isThemeTransitioning ? 'rotate-[360deg]' : ''}`}>
          {isDarkMode ? (
            <svg className="w-6 h-6 drop-shadow-[0_0_12px_rgba(253,224,71,0.9)] transition-all duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)] transition-all duration-500 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </div>
      </button>

      {/* ===== LANGUAGE SELECTOR ===== */}
      <div className="absolute top-6 right-24 z-50">
        <button
          onClick={() => setIsLangOpen(!isLangOpen)}
          className={`p-4 rounded-2xl shadow-2xl transition-all duration-500 
            hover:scale-110 active:scale-95 border-2 backdrop-blur-xl overflow-hidden group flex items-center gap-2
            ${isDarkMode
              ? 'bg-slate-800/60 border-white/20 text-blue-300 hover:bg-slate-700/70 hover:border-blue-400/30 shadow-blue-500/10'
              : 'bg-white/70 border-white/50 text-blue-500 hover:bg-white/90 hover:border-blue-400/50 shadow-blue-500/20'
            }`}
        >
          <span className="text-xl">{currentLang.flag}</span>
        </button>

        {/* Dropdown */}
        {isLangOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
            <div className={`absolute top-full right-0 mt-2 rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[160px] border-2 backdrop-blur-xl
              ${isDarkMode
                ? 'bg-slate-900/90 border-white/10'
                : 'bg-white/90 border-white/50'
              }`}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { toggleLanguage(lang.code); setIsLangOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-all
                    ${language === lang.code
                      ? (isDarkMode ? 'bg-blue-600/30 text-blue-300 font-bold' : 'bg-blue-100 text-blue-600 font-bold')
                      : (isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-slate-700')
                    }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {language === lang.code && <span className="ml-auto">✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ===== MAIN LOGIN CARD ===== */}
      <div className="relative flex min-h-screen flex-col items-center justify-center p-4 z-20">
        <div
          className={`w-full max-w-[460px] rounded-[2.5rem] p-10 backdrop-blur-[60px] border-2 
            transition-all duration-[1000ms] ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isMounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}
            ${isDarkMode
              ? 'bg-slate-900/50 border-white/10 text-white shadow-[0_0_80px_-20px_rgba(99,102,241,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]'
              : 'bg-white/60 border-white/80 text-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.7)]'
            }
          `}
        >
          {/* Header Section with Animations */}
          <div className={`mb-10 flex flex-col items-center text-center transition-all duration-700 delay-100 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
            {/* Animated Logo */}
            <div
              className={`group relative mb-6 flex h-28 w-28 items-center justify-center rounded-[1.75rem] 
                shadow-2xl transition-all duration-500 hover:rotate-3 hover:scale-110 border-2 backdrop-blur-xl
                cursor-pointer
                ${isDarkMode
                  ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/20 shadow-indigo-500/20 hover:shadow-indigo-500/40'
                  : 'bg-gradient-to-br from-white/90 to-blue-50/90 border-white/60 shadow-blue-500/20 hover:shadow-blue-500/40'
                }
              `}
            >
              {/* Glow ring animation */}
              <div className={`absolute inset-0 rounded-[1.75rem] transition-opacity duration-500 ${isDarkMode ? 'bg-gradient-to-r from-blue-500/0 via-indigo-500/20 to-purple-500/0' : 'bg-gradient-to-r from-pink-500/0 via-rose-400/20 to-orange-500/0'
                } animate-pulse opacity-60 group-hover:opacity-100`} />

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D32F2F"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="relative z-10 drop-shadow-[0_5px_15px_rgba(211,47,47,0.5)] transition-transform duration-500 group-hover:scale-110"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>

            <h1 className={`text-2xl font-black tracking-tight transition-all duration-500 ${isDarkMode ? 'drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]' : 'drop-shadow-sm'
              }`}>
              {t('welcome')}
            </h1>
            <p className={`mt-3 text-sm font-medium transition-colors duration-700 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
              {t('loginSubtitle')}
            </p>
          </div>

          {/* Login Form with Staggered Animations */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Field */}
            <div className={`group space-y-2 transition-all duration-700 delay-200 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
              <label className={`ml-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${isDarkMode
                ? 'text-slate-400 group-focus-within:text-blue-400 group-focus-within:drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]'
                : 'text-slate-500 group-focus-within:text-blue-600'
                }`}>
                {t('usernameLogin')}
              </label>
              <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.02]">
                <input
                  type="text"
                  required
                  className={`block w-full rounded-2xl border-2 py-4 pl-5 pr-4 text-lg font-medium outline-none 
                    transition-all duration-500 backdrop-blur-xl
                    focus:ring-4 focus:ring-offset-0
                    ${isDarkMode
                      ? 'bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 focus:bg-slate-800/70'
                      : 'bg-white/50 border-white/60 text-slate-800 placeholder:text-slate-400 focus:border-blue-400/50 focus:ring-blue-400/20 focus:bg-white/80'
                    }
                  `}
                  placeholder={t('usernameLogin')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={`group space-y-2 transition-all duration-700 delay-300 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
              <label className={`ml-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${isDarkMode
                ? 'text-slate-400 group-focus-within:text-blue-400 group-focus-within:drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]'
                : 'text-slate-500 group-focus-within:text-blue-600'
                }`}>
                {t('passwordLogin')}
              </label>
              <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.02]">
                <input
                  type="password"
                  required
                  className={`block w-full rounded-2xl border-2 py-4 pl-5 pr-4 text-lg font-medium outline-none 
                    transition-all duration-500 backdrop-blur-xl
                    focus:ring-4 focus:ring-offset-0
                    ${isDarkMode
                      ? 'bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 focus:bg-slate-800/70'
                      : 'bg-white/50 border-white/60 text-slate-800 placeholder:text-slate-400 focus:border-blue-400/50 focus:ring-blue-400/20 focus:bg-white/80'
                    }
                  `}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className={`transition-all duration-700 delay-400 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative mt-6 w-full overflow-hidden rounded-2xl p-[2px] 
                  shadow-xl shadow-red-500/30 transition-all duration-500 
                  hover:scale-[1.03] hover:shadow-2xl hover:shadow-red-500/40 
                  active:scale-[0.98]
                  bg-gradient-to-r from-[#D32F2F] via-[#E53935] to-[#FF5252]
                  disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {/* Animated shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className={`relative flex h-full w-full items-center justify-center rounded-[14px] 
                  bg-gradient-to-br from-[#D32F2F] to-[#B71C1C] px-6 py-4 
                  transition-all duration-300 backdrop-blur-sm
                  ${isLoading ? '' : 'group-hover:from-[#E53935] group-hover:to-[#C62828]'}
                `}>
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-white font-bold">{t('loggingIn')}</span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-white flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
                      {t('loginButton')}
                      <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </div>
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className={`mt-10 text-center text-xs font-semibold tracking-wide transition-all duration-700 delay-500 ${isMounted ? 'opacity-60' : 'opacity-0'
            } ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('copyright')}
          </div>
        </div>
      </div>

      {/* Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />


    </div>
  );
}