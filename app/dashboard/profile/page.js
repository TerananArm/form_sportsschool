// app/dashboard/profile/page.js
'use client';
import { useState, useEffect } from 'react';
import { Camera, Save, ArrowLeft, Loader2, User, Key, UserCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext'; // ✅ Import useLanguage
import { useRouter } from 'next/navigation';
import ConfirmModal from '../../components/ConfirmModal';

export default function ProfilePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isImageProcessing, setIsImageProcessing] = useState(false);

    const [userName, setUserName] = useState('');
    const [userImage, setUserImage] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const [password, setPassword] = useState('');

    const { isDarkMode } = useTheme();
    const { t } = useLanguage(); // ✅ Use hook
    const router = useRouter();

    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false, title: '', message: '', type: 'success', confirmText: t('confirm')
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/user', { cache: 'no-store' });
                if (res.ok) {
                    const user = await res.json();
                    setUserName(user.name || 'Admin User');
                    setUserImage(user.image || '');
                }
            } catch (error) { console.error(error); }
        };
        fetchUser();
    }, []);

    const [selectedFile, setSelectedFile] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        const MAX_FILE_SIZE = 2 * 1024 * 1024; // Increased to 2MB

        if (file && file.type.startsWith('image/')) {
            if (file.size > MAX_FILE_SIZE) {
                setConfirmConfig({
                    isOpen: true,
                    title: t('fileTooLarge'),
                    message: t('fileSizeError'), // Ensure this translation exists or use fallback
                    type: 'warning',
                    confirmText: t('confirm')
                });
                return;
            }

            setSelectedFile(file);
            setIsImageProcessing(true);
            const reader = new FileReader();

            reader.onload = (event) => {
                // Just use the file reader for preview, but we will upload the file object
                setPreviewImage(event.target.result);
                setIsImageProcessing(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isLoading || isImageProcessing) return;

        setIsLoading(true);

        try {
            let imageUrl = userImage;

            // 1. Upload Image (if selected)
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    imageUrl = uploadData.url;
                } else {
                    throw new Error('Image upload failed');
                }
            }

            // 2. Update User Profile
            const res = await fetch('/api/user', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: userName,
                    image: imageUrl,
                    password: password
                }),
            });

            if (res.ok) {
                setConfirmConfig({
                    isOpen: true,
                    title: t('saveProfileSuccess'),
                    message: t('profileUpdated'),
                    type: 'success',
                    confirmText: t('confirm'),
                    onConfirm: () => {
                        setUserImage(imageUrl);
                        setPreviewImage(null);
                        setSelectedFile(null);
                        setPassword('');
                        router.refresh();
                        // Force reload to update header image instantly
                        window.location.reload();
                    }
                });
            } else {
                const errorData = await res.json();
                setConfirmConfig({
                    isOpen: true,
                    title: t('saveProfileFailed'),
                    message: errorData.message || t('saveProfileError'),
                    type: 'danger',
                    confirmText: t('confirm')
                });
            }
        } catch (error) {
            console.error(error);
            setConfirmConfig({ isOpen: true, title: t('error'), message: t('connectionError'), type: 'danger', confirmText: t('confirm') });
        } finally {
            setIsLoading(false);
        }
    };

    // Styles
    const cardClass = `w-full max-w-3xl rounded-[40px] p-8 md:p-12 transition-all duration-300 border backdrop-blur-3xl backdrop-saturate-150 shadow-2xl relative overflow-hidden group ${isDarkMode ? 'bg-slate-800/60 border-white/10 shadow-black/50' : 'bg-slate-200/70 border-white/40 shadow-slate-300'}`;

    const inputClass = `w-full h-14 px-6 rounded-2xl border-2 outline-none transition-all placeholder-gray-400 font-medium backdrop-blur-md ${isDarkMode
        ? 'bg-slate-900/50 border-white/10 text-white focus:border-red-500 focus:bg-slate-900/70'
        : 'bg-white/50 border-white/40 text-slate-800 focus:border-red-500 focus:bg-white/80'
        }`;

    // ✅ FIX: ใช้ labelTextClass ที่กำหนดสีตาม Theme
    const labelTextClass = isDarkMode ? 'text-white' : 'text-slate-800';


    return (
        <div className="pb-20 w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-center animate-fade-in px-4">
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                confirmText={confirmConfig.confirmText}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
            />

            {/* Card Container */}
            <div className={`${cardClass} animate-slide-up delay-100`}>
                {/* Texture Overlay */}
                <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none"></div>

                {/* Header (ใน Card) */}
                <div className={`flex items-center gap-6 mb-10 pb-6 border-b relative z-10 ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
                    <button onClick={() => router.back()} className={`p-4 rounded-full transition-all border backdrop-blur-md shadow-sm active:scale-95 group ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-white/40 hover:bg-white/60 border-white/40 text-slate-700'}`}>
                        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className={`text-4xl font-black tracking-tight drop-shadow-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t('profileTitle')}</h1>
                        <p className={`mt-1 text-lg font-medium ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>{t('profileDesc')}</p>
                    </div>
                </div>

                {/* Profile Image Section */}
                <div className="flex flex-col items-center mb-12">
                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('file-upload').click()}>
                        <div className={`w-40 h-40 rounded-full border-[4px] border-dashed flex items-center justify-center p-1.5 transition-all duration-300 ${isDarkMode ? 'border-red-900/50 group-hover:border-red-500' : 'border-red-300/60 group-hover:border-red-500'}`}>
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center overflow-hidden relative shadow-xl ring-4 ring-transparent group-hover:ring-red-500/20 transition-all">
                                {!(previewImage || userImage) && <User size={80} className="text-white/40" />}
                                {(previewImage || userImage) && (
                                    <img
                                        src={previewImage || userImage}
                                        alt="Profile"
                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        onError={(e) => { e.target.src = ''; setUserImage(''); setPreviewImage(null); }}
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 backdrop-blur-[2px]">
                                    <Camera className="w-8 h-8 text-white mb-2 drop-shadow-md" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/20 px-2 py-1 rounded-full border border-white/20">{t('changePhoto')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <input type="file" id="file-upload" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />

                    <div className="text-center mt-6">
                        <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{userName}</h2>
                    </div>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSave} className="space-y-8 px-2 relative z-10">
                    <div className="group">
                        {/* ✅ FIX: ใช้ labelTextClass */}
                        <label className={`${labelTextClass} block text-sm font-bold uppercase tracking-wider opacity-80 pl-1 mb-2`}><div className="flex items-center gap-2"><User size={16} /> {t('usernameLabel')}</div></label>
                        <input type="text" defaultValue="admin" disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
                    </div>

                    <div className="group">
                        {/* ✅ FIX: ใช้ labelTextClass */}
                        <label className={`${labelTextClass} block text-sm font-bold uppercase tracking-wider opacity-80 pl-1 mb-2`}><div className="flex items-center gap-2"><UserCircle size={16} /> {t('name')}</div></label>
                        <input type="text" value={userName || ''} onChange={(e) => setUserName(e.target.value)} className={inputClass} placeholder={t('namePlaceholder')} />
                    </div>

                    <div className="group">
                        {/* ✅ FIX: ใช้ labelTextClass */}
                        <label className={`${labelTextClass} block text-sm font-bold uppercase tracking-wider opacity-80 pl-1 mb-2`}><div className="flex items-center gap-2"><Key size={16} /> {t('newPassword')}</div></label>
                        <input type="password" value={password || ''} onChange={(e) => setPassword(e.target.value)} placeholder={t('passwordPlaceholder')} className={inputClass} />
                    </div>

                    <div className={`pt-10 mt-6 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-200/60'}`}>
                        <button type="submit" disabled={isLoading || isImageProcessing} className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-lg py-4 px-6 shadow-xl shadow-red-500/20 transform transition-all active:scale-[0.98] hover:shadow-2xl flex items-center justify-center gap-3">
                            {isLoading || isImageProcessing ? (<><Loader2 size={24} className="animate-spin" /> {t('processing')}</>) : (<><Save size={24} /> {t('saveChanges')}</>)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}