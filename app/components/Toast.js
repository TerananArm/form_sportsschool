'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X, AlertTriangle, Info } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message && !isVisible) return null;

  const styles = {
    success: { border: 'border-l-4 border-emerald-500', icon: <CheckCircle2 className="text-emerald-500" size={24} />, title: 'สำเร็จ' },
    error: { border: 'border-l-4 border-red-500', icon: <XCircle className="text-red-500" size={24} />, title: 'ข้อผิดพลาด' },
    warning: { border: 'border-l-4 border-amber-500', icon: <AlertTriangle className="text-amber-500" size={24} />, title: 'แจ้งเตือน' },
    info: { border: 'border-l-4 border-blue-500', icon: <Info className="text-blue-500" size={24} />, title: 'ข้อมูล' }
  };
  const currentStyle = styles[type] || styles.success;

  return (
    // แก้ไขตำแหน่งตรงนี้: เปลี่ยน top-6 เป็น top-24 (ให้ต่ำลงมา)
    <div className={`fixed top-24 right-6 z-[300] flex w-80 flex-col overflow-hidden rounded-xl bg-white/95 dark:bg-[#1e293b]/95 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md ${currentStyle.border} transition-all duration-500 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
      <div className="flex items-start gap-3 p-4">
        <div className="mt-0.5 shrink-0">{currentStyle.icon}</div>
        <div className="flex-1">
          <h3 className="font-bold text-sm dark:text-white text-gray-900">{currentStyle.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{message}</p>
        </div>
        <button onClick={() => setIsVisible(false)} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={18} /></button>
      </div>
      {/* Progress Bar */}
      <div className="h-1 w-full bg-gray-100 dark:bg-gray-700">
          <div className={`h-full origin-left animate-[shrink_3s_linear_forwards] ${type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} />
      </div>
    </div>
  );
}