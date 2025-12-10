'use client';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Check } from 'lucide-react';

export default function LanguageSelector({ isSidebarCollapsed }) {
    const { language, toggleLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const languages = [
        { code: 'th', label: 'ภาษาไทย', flag: '🇹🇭' },
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'zh', label: '中文', flag: '🇨🇳' },
        { code: 'ja', label: '日本語', flag: '🇯🇵' },
        { code: 'ko', label: '한국어', flag: '🇰🇷' },
    ];

    const currentLang = languages.find(l => l.code === language) || languages[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (code) => {
        // Find how many times we need to toggle to reach the target language
        // This is a temporary workaround since toggleLanguage cycles through.
        // Ideally, toggleLanguage should accept a specific language code.
        // For now, we will update LanguageContext to accept a specific code.
        toggleLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
                <Globe size={16} />
                {!isSidebarCollapsed && (
                    <div className="flex items-center justify-between flex-1">
                        <span className="text-xs font-bold uppercase">{currentLang.label}</span>
                        <span className="text-xs opacity-50 ml-2">▼</span>
                    </div>
                )}
            </button>

            {isOpen && (
                <div className={`absolute bottom-full mb-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 min-w-[150px] ${isSidebarCollapsed ? 'left-full ml-2 bottom-0' : 'left-0 w-full'}`}>
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleSelect(lang.code)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between gap-2 ${language === lang.code ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold' : 'text-gray-700 dark:text-gray-200'}`}
                        >
                            <span className="flex items-center gap-2">
                                <span>{lang.flag}</span>
                                <span>{lang.label}</span>
                            </span>
                            {language === lang.code && <Check size={14} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
