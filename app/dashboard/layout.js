// app/dashboard/layout.js
'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import GlobalChatWidget from '../components/GlobalChatWidget';
import { useTheme } from '../context/ThemeContext';

// Floating Particle Component (same as login but subtler)
const FloatingParticle = ({ delay, duration, size, startX, startY, isDarkMode }) => (
   <div
      className={`absolute rounded-full transition-all duration-[2000ms] ${isDarkMode ? 'bg-blue-400/30' : 'bg-white/50'}`}
      style={{
         width: size,
         height: size,
         left: `${startX}%`,
         top: `${startY}%`,
         animation: `floatParticle ${duration}s ease-in-out ${delay}s infinite`,
      }}
   />
);

// Gradient Orb Component (matching login style)
const GradientOrb = ({ className, isDarkMode }) => (
   <div
      className={`absolute rounded-full blur-3xl transition-all duration-[1500ms] ease-in-out ${className} ${isDarkMode ? 'opacity-30' : 'opacity-40'}`}
   />
);

function DashboardContent({ children }) {
   const { isSidebarCollapsed, isDarkMode } = useTheme();
   const { data: session, status } = useSession();
   const router = useRouter();

   // Client-side auth protection (fallback for middleware)
   useEffect(() => {
      if (status === 'unauthenticated') {
         router.replace('/login');
      }
   }, [status, router]);

   // Particles configuration (fewer than login for subtlety)
   const particles = [
      { id: 0, delay: 0, duration: 15, size: 6, startX: 15, startY: 25 },
      { id: 1, delay: 2, duration: 18, size: 5, startX: 75, startY: 20 },
      { id: 2, delay: 1, duration: 12, size: 8, startX: 30, startY: 65 },
      { id: 3, delay: 3, duration: 16, size: 4, startX: 55, startY: 45 },
      { id: 4, delay: 1.5, duration: 14, size: 7, startX: 85, startY: 55 },
      { id: 5, delay: 2.5, duration: 17, size: 5, startX: 20, startY: 80 },
      { id: 6, delay: 0.5, duration: 13, size: 6, startX: 65, startY: 35 },
      { id: 7, delay: 3.5, duration: 15, size: 4, startX: 45, startY: 70 },
   ];

   // Show loading while checking session
   if (status === 'loading') {
      return (
         <div className={`flex h-screen w-full items-center justify-center ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f0f4f8]'}`}>
            <div className="flex flex-col items-center gap-4">
               <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>กำลังตรวจสอบการเข้าสู่ระบบ...</p>
            </div>
         </div>
      );
   }

   // Don't render content if not authenticated
   if (status === 'unauthenticated') {
      return null;
   }

   return (
      <div className={`flex h-screen w-full overflow-hidden transition-colors duration-700 ease-in-out ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f0f4f8]'}`}>

         {/* ================= ANIMATED BACKGROUND (Login-style but Subtle) ================= */}
         <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">

            {/* Base Background */}
            <div className={`absolute inset-0 transition-colors duration-1000 ease-linear
                ${isDarkMode ? 'bg-[#0D1117]' : 'bg-[#F5F5F7]'}`}>
            </div>

            {/* Morphing Gradient Background */}
            <div className={`absolute -inset-[100%] z-0 blur-[120px] transition-all duration-[2000ms] ease-in-out ${isDarkMode
               ? 'opacity-50 bg-[conic-gradient(from_180deg_at_50%_50%,_#1e3a5f_0deg,_#0f172a_90deg,_#312e81_180deg,_#0f172a_270deg,_#1e3a5f_360deg)]'
               : 'opacity-60 bg-[conic-gradient(from_0deg_at_50%_50%,_#fecaca_0deg,_#bfdbfe_90deg,_#ddd6fe_180deg,_#fef3c7_270deg,_#fecaca_360deg)]'
               }`}
               style={{ animation: 'morphGradient 20s ease-in-out infinite' }}
            />

            {/* Gradient Orbs (subtler than login) */}
            <GradientOrb
               isDarkMode={isDarkMode}
               className={`w-[500px] h-[500px] -top-[150px] -left-[150px] ${isDarkMode
                  ? 'bg-gradient-to-br from-blue-600/30 to-violet-700/20'
                  : 'bg-gradient-to-br from-red-200/40 to-rose-300/30'
                  }`}
            />
            <GradientOrb
               isDarkMode={isDarkMode}
               className={`w-[400px] h-[400px] -bottom-[100px] -right-[100px] ${isDarkMode
                  ? 'bg-gradient-to-tl from-purple-700/30 to-indigo-600/20'
                  : 'bg-gradient-to-tl from-blue-200/40 to-cyan-300/30'
                  }`}
            />
            <GradientOrb
               isDarkMode={isDarkMode}
               className={`w-[350px] h-[350px] top-[50%] right-[20%] ${isDarkMode
                  ? 'bg-gradient-to-r from-emerald-700/20 to-teal-600/15'
                  : 'bg-gradient-to-r from-amber-100/30 to-orange-200/25'
                  }`}
            />

            {/* Floating Particles */}
            {particles.map((p) => (
               <FloatingParticle key={p.id} {...p} isDarkMode={isDarkMode} />
            ))}

            {/* Grid Pattern */}
            <div className={`absolute inset-0 opacity-[0.03]`}
               style={{
                  backgroundImage: isDarkMode
                     ? 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)'
                     : 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
                  backgroundSize: '32px 32px'
               }}
            />

            {/* Shimmer Effect */}
            <div
               className={`absolute inset-0 z-10 transition-opacity duration-[1500ms] ${isDarkMode ? 'opacity-10' : 'opacity-8'}`}
               style={{
                  background: isDarkMode
                     ? 'linear-gradient(135deg, transparent 0%, transparent 40%, rgba(99,102,241,0.05) 50%, transparent 60%, transparent 100%)'
                     : 'linear-gradient(135deg, transparent 0%, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%, transparent 100%)',
                  backgroundSize: '400% 400%',
                  animation: 'shimmer 10s ease-in-out infinite',
               }}
            />

            {/* Noise Texture (like login) */}
            <div className={`absolute inset-0 z-30 mix-blend-overlay transition-opacity duration-[1500ms] ${isDarkMode ? 'opacity-[0.05]' : 'opacity-[0.08]'} bg-[url('https://grainy-gradients.vercel.app/noise.svg')]`} />
         </div>

         {/* Sidebar */}
         <div className="relative z-50">
            <Sidebar />
         </div>

         {/* Main Content Area */}
         <div
            className={`flex flex-1 flex-col h-full overflow-hidden transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) relative z-10 ml-0 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-[280px]'}`}
         >
            <Header />
            <main className="flex-1 overflow-y-auto p-2 md:px-6 md:py-4 scroll-smooth custom-scrollbar relative z-10">
               {children}
            </main>
         </div>

         {/* Global Chat Widget - Appears on all dashboard pages */}
         <GlobalChatWidget />
      </div>
   );
}

export default function DashboardLayout({ children }) {
   return (
      <DashboardContent>{children}</DashboardContent>
   );
}