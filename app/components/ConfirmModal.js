// app/components/ConfirmModal.js
'use client';
import { AlertTriangle, AlertCircle, Info, Trash2, Check, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSound } from '../context/SoundContext';

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, onCancel, title, message, confirmText, cancelText, type = 'danger' }) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { play } = useSound();
  const [mounted, setMounted] = useState(false);

  // Default texts using translation
  const finalConfirmText = confirmText || t('confirm');
  const finalCancelText = cancelText || t('cancel');
  const finalTitle = title || t('warning');

  useEffect(() => {
    setMounted(true);

    // 🔊 Play sound when modal opens based on type
    if (isOpen) {
      if (type === 'success') play('success');
      else if (type === 'danger' || type === 'delete') play('error');
      else play('pop');
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') {
        if (onConfirm) onConfirm();
        onClose();
      }
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => {
      setMounted(false);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm, type, play]);

  if (!isOpen || !mounted) return null;

  // Design: Gradient Icons & Buttons
  const styles = {
    success: {
      iconBg: 'bg-gradient-to-br from-emerald-400 to-green-600',
      shadow: 'shadow-[0_10px_20px_rgba(16,185,129,0.3)]',
      btn: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-emerald-500/30',
      icon: <Check size={48} strokeWidth={3} className="text-white drop-shadow-md" />,
      glow: 'bg-emerald-500'
    },
    delete: {
      iconBg: 'bg-gradient-to-br from-orange-400 to-red-500',
      shadow: 'shadow-[0_10px_20px_rgba(239,68,68,0.3)]',
      btn: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/30',
      icon: <Trash2 size={44} strokeWidth={2} className="text-white drop-shadow-md" />,
      glow: 'bg-red-500'
    },
    danger: {
      iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
      shadow: 'shadow-[0_10px_20px_rgba(244,63,94,0.3)]',
      btn: 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-rose-500/30',
      icon: <AlertCircle size={48} strokeWidth={2} className="text-white drop-shadow-md" />,
      glow: 'bg-rose-500'
    },
    warning: {
      iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
      shadow: 'shadow-[0_10px_20px_rgba(245,158,11,0.3)]',
      btn: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/30',
      icon: <AlertTriangle size={48} strokeWidth={2} className="text-white drop-shadow-md" />,
      glow: 'bg-amber-500'
    },
    info: {
      iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
      shadow: 'shadow-[0_10px_20px_rgba(59,130,246,0.3)]',
      btn: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/30',
      icon: <Info size={48} strokeWidth={2} className="text-white drop-shadow-md" />,
      glow: 'bg-blue-500'
    }
  };

  const currentStyle = styles[type] || styles.info;
  const isSuccess = type === 'success';

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop with Blur - uses will-change for instant blur rendering */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
        style={{ willChange: 'backdrop-filter' }}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative w-full max-w-md rounded-[32px] p-8 shadow-2xl transform transition-all scale-100 border ${isDarkMode ? 'bg-[#151925]/90 border-white/10' : 'bg-white/90 border-white/40'} backdrop-blur-xl`}>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-black/5 text-black/40'}`}
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon Glow Effect */}
          <div className={`relative mb-6 group`}>
            <div className={`absolute inset-0 ${currentStyle.glow} blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500`}></div>
            <div className={`relative w-24 h-24 rounded-full ${currentStyle.iconBg} flex items-center justify-center ${currentStyle.shadow} transform group-hover:scale-110 transition-transform duration-300 border-4 border-white/10`}>
              {currentStyle.icon}
            </div>
          </div>

          <h3 className={`text-2xl font-black tracking-tight mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            {finalTitle}
          </h3>

          <p className={`text-lg font-medium leading-relaxed mb-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
            {message}
          </p>

          <div className="flex gap-4 w-full">
            {finalCancelText && (
              <button
                onClick={onCancel || onClose}
                className={`flex-1 py-3.5 rounded-xl font-bold text-base transition-all active:scale-95 border ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'}`}
              >
                {finalCancelText}
              </button>
            )}
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className={`flex-1 py-3.5 rounded-xl font-bold text-base transition-all active:scale-95 shadow-lg hover:shadow-xl ${currentStyle.btn}`}
            >
              {finalConfirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}