'use client';
import { useState } from 'react';
import {
  LayoutDashboard, Database, Menu, GraduationCap, ChevronDown,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { useSession, signOut } from 'next-auth/react';

export default function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar, isDarkMode } = useTheme();
  const { data: session } = useSession();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'เพิ่ม/ดูข้อมูล', icon: Database, path: '/dashboard/applicants' },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden ${isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
        onClick={() => toggleSidebar()}
      />

      <aside
        className={`fixed top-0 left-0 z-50 h-screen transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl border-r transform-gpu backdrop-blur-[50px] backdrop-saturate-150
          md:translate-x-0
          ${isSidebarCollapsed ? '-translate-x-full md:w-20' : 'translate-x-0 w-[280px]'}
          ${isDarkMode
            ? 'bg-slate-800/40 border-white/10 text-gray-200'
            : 'bg-slate-200/50 border-white/40 text-slate-800'
          }
        `}
      >
        {/* Header Logo */}
        <div className={`flex h-20 items-center justify-between px-4 transition-colors duration-500
         ${isDarkMode ? 'border-b border-white/5' : 'border-b border-white/20'}
      `}>
          <div className={`flex items-center gap-3 overflow-hidden whitespace-nowrap transition-all duration-500 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <div className="p-2 bg-red-600 rounded-lg shadow-lg shadow-red-500/30 shrink-0">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-wide drop-shadow-sm">System Admin</h1>
            </div>
          </div>

          <button
            onClick={() => { toggleSidebar(); }}
            className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${isSidebarCollapsed ? 'mx-auto' : ''}`}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Menu List */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar h-[calc(100vh-160px)]">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;

            return (
              <div key={item.path}>
                <Link
                  href={item.path}
                  className={`group flex items-center transition-all duration-300 relative overflow-hidden rounded-xl mb-1
                    ${isSidebarCollapsed ? 'justify-center py-4' : 'px-4 py-3'}
                    ${isActive
                      ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/30'
                      : 'hover:bg-white/20 hover:text-red-600'
                    }
                  `}
                >
                  <item.icon size={20} className={`shrink-0 transition-colors duration-300 ${isActive ? 'text-white' : ''}`} />
                  <span className={`ml-4 text-sm font-medium whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                    {item.name}
                  </span>
                </Link>
              </div>
            );
          })}
        </nav>


      </aside>
    </>
  );
}