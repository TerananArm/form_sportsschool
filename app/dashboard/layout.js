'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
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

         {/* Background Effects */}
         <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className={`absolute inset-0 transition-colors duration-1000 ease-linear ${isDarkMode ? 'bg-[#0D1117]' : 'bg-[#F5F5F7]'}`}></div>
            <GradientOrb isDarkMode={isDarkMode} className={`w-[500px] h-[500px] -top-[150px] -left-[150px] ${isDarkMode ? 'bg-gradient-to-br from-blue-600/30 to-violet-700/20' : 'bg-gradient-to-br from-red-200/40 to-rose-300/30'}`} />
            {particles.map((p) => <FloatingParticle key={p.id} {...p} isDarkMode={isDarkMode} />)}
         </div>

         {/* Sidebar */}
         <div className="relative z-50">
            <Sidebar />
         </div>

         {/* Main Content Area */}
         <div className={`flex flex-1 flex-col h-full overflow-hidden transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) relative z-10 ml-0 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-[280px]'}`}>
            <Header />
            <main id="main-content" className="flex-1 overflow-y-auto p-2 md:px-6 md:py-4 scroll-smooth custom-scrollbar relative z-10">
               {children}
            </main>
         </div>
      </div>
   );
}

export default function DashboardLayout({ children }) {
   return (
      <DashboardContent>{children}</DashboardContent>
   );
}