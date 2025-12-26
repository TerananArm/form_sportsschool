'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, LogOut, User, Sun, Moon, Camera, Calendar, Menu, Edit3, Key, X, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSession, signOut } from 'next-auth/react';
import Swal from 'sweetalert2';

const ProfileAvatar = ({ imageUrl, userName, size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-lg",
    lg: "h-24 w-24 text-4xl",
  };

  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative rounded-full overflow-hidden bg-gradient-to-tr from-red-500 to-orange-500 border-2 border-white/20 flex items-center justify-center shadow-md ${sizeClasses[size]} ${className}`}>
      {imageUrl && !imgError ? (
        <img
          src={imageUrl}
          alt="Profile"
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-white font-bold leading-none">{userName?.[0] || 'A'}</span>
      )}
    </div>
  );
};

const DropdownPortal = ({ children }) => {
  if (typeof window === 'undefined') return null;
  return createPortal(children, document.body);
};


export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState('menu'); // menu, edit, password
  const [userData, setUserData] = useState({ name: 'Admin', image: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Edit States
  const [editName, setEditName] = useState('');
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);
  const router = useRouter();
  const { isDarkMode, toggleTheme, toggleSidebar } = useTheme();
  const { language, t } = useLanguage();

  const { data: session, update: updateSession } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (session?.user?.name) {
        setUserData({
          name: session.user.name,
          image: session.user.image || ''
        });
        setEditName(session.user.name);
      }

      try {
        const res = await fetch('/api/user', { cache: 'no-store' });
        if (res.ok) {
          const user = await res.json();
          setUserData(prev => ({
            name: user.name || session?.user?.name || 'Admin',
            image: user.image || prev.image || ''
          }));
          setEditName(user.name || session?.user?.name || 'Admin');
        }
      } catch (error) { console.error(error); }
    };
    fetchUser();
  }, [session]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-GB', { day: '2-digit', month: 'long' });
      const timeStr = now.toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
      setCurrentTime(`${dateStr} | ${timeStr} ${language === 'th' ? 'น.' : ''}`);
    };
    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, [language]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url } = await uploadRes.json();

      const updateRes = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url }),
      });

      if (!updateRes.ok) throw new Error('Update failed');
      setUserData(prev => ({ ...prev, image: url }));
      await updateSession();

    } catch (error) {
      Swal.fire('Error', 'ไม่สามารถอัปโหลดรูปภาพได้', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName })
      });

      if (res.ok) {
        setUserData(prev => ({ ...prev, name: editName }));
        await updateSession();
        setViewMode('menu');
        Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1500, showConfirmButton: false });
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      Swal.fire('Error', 'บันทึกข้อมูลไม่สำเร็จ', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      return Swal.fire('Error', 'รหัสผ่านใหม่ไม่ตรงกัน', 'error');
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: passwordData.current,
          newPassword: passwordData.new
        })
      });

      const json = await res.json();

      if (res.ok) {
        setPasswordData({ current: '', new: '', confirm: '' });
        setViewMode('menu');
        Swal.fire({ icon: 'success', title: 'เปลี่ยนรหัสผ่านสำเร็จ', timer: 1500, showConfirmButton: false });
      } else {
        throw new Error(json.error || 'Update failed');
      }
    } catch (err) {
      Swal.fire('Error', err.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ', 'error');
    } finally {
      setIsSaving(false);
    }
  };



  // Dropdown Background Style
  const dropdownBg = isDarkMode
    ? 'bg-[#151925]/95 border border-white/10 shadow-[0_0_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-[50px] backdrop-saturate-150'
    : 'bg-white/95 border border-white/40 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.2)] backdrop-blur-[50px] backdrop-saturate-150';

  return (
    <header
      className={`sticky top-0 z-40 flex h-20 items-center justify-between px-8 shadow-sm transition-all duration-500 backdrop-blur-[50px] backdrop-saturate-150 border-b
        ${isDarkMode
          ? 'bg-slate-800/40 border-white/10 text-white'
          : 'bg-slate-200/50 border-white/40 text-slate-800'
        }`}
    >
      {/* Left Section: Mobile Menu & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className={`md:hidden p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-700'}`}
        >
          <Menu size={24} />
        </button>

        <h2 className="text-xl font-bold tracking-wide flex items-center gap-2 drop-shadow-sm">
          <span className={`w-1.5 h-6 rounded-full inline-block ${isDarkMode ? 'bg-white/40' : 'bg-red-500'}`}></span>
          {t('dashboard')}
        </h2>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { toggleTheme(); }}
          className={`p-2 rounded-lg transition-all border backdrop-blur-md shadow-sm
              ${isDarkMode
              ? 'bg-white/5 text-yellow-400 hover:bg-white/10 border-white/10'
              : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
            }`}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDarkMode ? 180 : 0, scale: isDarkMode ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            {isDarkMode ? <Sun size={20} className="drop-shadow-[0_0_8px_rgba(253,224,71,0.5)] text-yellow-400" /> : <Moon size={20} />}
          </motion.div>
        </button>

        <div className={`h-8 w-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}></div>

        {/* Profile Section */}
        <div className="relative">
          <button
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setViewMode('menu'); // Reset to menu on toggle
            }}
            className={`flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full transition-all border
                ${isDarkMode ? 'hover:bg-white/5 border-transparent hover:border-white/10' : 'hover:bg-white/20 border-transparent hover:border-white/40'}
            `}
          >
            <ProfileAvatar imageUrl={userData.image} userName={userData.name} />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none">{userData.name}</p>
              <p className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('adminRole')}</p>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <DropdownPortal>
              {/* BACKDROP: Using top-20 to keep header visible/accessible */}
              <div
                className="fixed inset-0 top-20 z-[999] bg-black/10 backdrop-blur-[1px] transition-all duration-300"
                onClick={() => setIsDropdownOpen(false)}
              ></div>

              <div className={`fixed top-24 right-8 w-80 rounded-[2.5rem] animate-fade-in z-[1000] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border ${dropdownBg}`}>

                {/* Header with Date */}
                <div className={`relative h-28 flex items-center justify-center overflow-hidden backdrop-blur-md transition-all duration-300
                    ${isDarkMode ? 'bg-gradient-to-r from-red-900/40 to-pink-900/40' : 'bg-gradient-to-r from-red-100/60 to-pink-100/60'}`}>

                  {viewMode !== 'menu' && (
                    <button
                      onClick={() => setViewMode('menu')}
                      className="absolute left-6 top-6 p-2 rounded-full bg-white/20 hover:bg-white/40 text-slate-700 dark:text-white transition-all z-10"
                    >
                      <ChevronDown className="rotate-90" size={18} />
                    </button>
                  )}

                  <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

                  {viewMode === 'menu' && (
                    <div className={`text-sm font-bold flex items-center gap-2 opacity-80 ${isDarkMode ? 'text-white' : 'text-red-800'}`}>
                      <Calendar size={16} /> {currentTime}
                    </div>
                  )}
                  {viewMode === 'edit' && <span className="font-bold text-lg dark:text-white text-slate-800">แก้ไขข้อมูลส่วนตัว</span>}
                  {viewMode === 'password' && <span className="font-bold text-lg dark:text-white text-slate-800">เปลี่ยนรหัสผ่าน</span>}

                </div>

                <div className="relative px-6 pb-6 -mt-10 flex flex-col items-center">

                  {/* Avatar (Only show in Menu or Edit mode) */}
                  {(viewMode === 'menu' || viewMode === 'edit') && (
                    <div className="relative group cursor-pointer" onClick={() => viewMode === 'edit' && fileInputRef.current?.click()}>
                      <div className={`p-1.5 rounded-full ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
                        <ProfileAvatar imageUrl={userData.image} userName={userData.name} size="lg" className="transition-transform group-hover:scale-105" />
                      </div>
                      {viewMode === 'edit' && (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 rounded-full transition-all m-1.5 backdrop-blur-[2px] pointer-events-none">
                            <Camera className="text-white opacity-70 group-hover:opacity-100 transition-opacity drop-shadow-md" size={24} />
                          </div>
                          {isUploading && <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full m-1.5"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                        </>
                      )}
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                  {/* MENU VIEW */}
                  {viewMode === 'menu' && (
                    <div className="w-full space-y-2 mt-4">
                      <div className="text-center mb-4">
                        <h3 className="font-bold text-lg dark:text-white text-slate-800">{userData.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">ผู้ดูแลระบบ</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setViewMode('edit')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                          <Edit3 size={20} className="text-blue-500" />
                          <span className="text-xs font-medium dark:text-slate-300">แก้ไขข้อมูล</span>
                        </button>
                        <button onClick={() => setViewMode('password')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                          <Key size={20} className="text-orange-500" />
                          <span className="text-xs font-medium dark:text-slate-300">เปลี่ยนรหัส</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 my-2"></div>

                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl transition-all duration-300 group
                            ${isDarkMode
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                            : 'bg-red-50 hover:bg-red-100 text-red-600'
                          }`}
                      >
                        <LogOut size={18} />
                        <span className="font-bold text-sm">{t('logout')}</span>
                      </button>
                    </div>
                  )}

                  {/* EDIT PROFILE VIEW */}
                  {viewMode === 'edit' && (
                    <div className="w-full space-y-4 mt-6">
                      <div>
                        <label className="text-xs font-bold text-slate-500 ml-3 mb-1 block">ชื่อ - นามสกุล</label>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 text-sm"
                        />
                      </div>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                      >
                        {isSaving ? 'Saving...' : <><Save size={18} /> บันทึกข้อมูล</>}
                      </button>
                    </div>
                  )}

                  {/* CHANGE PASSWORD VIEW */}
                  {viewMode === 'password' && (
                    <div className="w-full space-y-3 mt-12">
                      <div>
                        <input
                          type="password"
                          placeholder="รหัสผ่านปัจจุบัน"
                          value={passwordData.current}
                          onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-orange-500 text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          placeholder="รหัสผ่านใหม่"
                          value={passwordData.new}
                          onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-orange-500 text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          placeholder="ยืนยันรหัสผ่านใหม่"
                          value={passwordData.confirm}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-orange-500 text-sm"
                        />
                      </div>
                      <button
                        onClick={handleChangePassword}
                        disabled={isSaving}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 mt-2"
                      >
                        {isSaving ? 'Saving...' : <><Save size={18} /> เปลี่ยนรหัสผ่าน</>}
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </DropdownPortal>
          )}
        </div>
      </div>
    </header>
  );
}