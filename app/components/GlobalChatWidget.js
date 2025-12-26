// app/components/GlobalChatWidget.js
'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function GlobalChatWidget() {
    const [showChat, setShowChat] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    const { isDarkMode } = useTheme();
    const { t } = useLanguage();
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, chatLoading]);

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatMessage.trim() || chatLoading) return;

        const userMsg = { role: 'user', text: chatMessage };
        setChatHistory(prev => [...prev, userMsg]);
        setChatMessage('');
        setChatLoading(true);

        try {
            const res = await fetch('/api/smart-query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: chatMessage }),
            });
            const data = await res.json();
            setChatHistory(prev => [...prev, { role: 'assistant', text: data.answer || data.error || 'ไม่สามารถตอบคำถามได้' }]);
        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'assistant', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
            {/* Chat Window */}
            {showChat && (
                <div className={`w-80 md:w-96 h-[500px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border animate-slide-in-right ${isDarkMode ? 'bg-[#1e293b] border-white/10' : 'bg-white border-slate-200'}`}>
                    {/* Header */}
                    <div className={`p-4 flex items-center justify-between border-b ${isDarkMode ? 'bg-[#151925] border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold">{t('smartAssistant')}</h3>
                                <p className="text-[10px] opacity-60">{t('poweredBy')}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowChat(false)} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-black/20">
                        {chatHistory.length === 0 && (
                            <div className={`text-center py-6 px-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <Sparkles size={32} className="mx-auto mb-3 opacity-50 text-blue-500" />
                                <p className="text-sm font-bold mb-2">สวัสดีครับ! ให้ผมช่วยอะไรดี?</p>
                                <div className="text-xs text-left space-y-2 bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                                    <p className="font-semibold opacity-70">ตัวอย่างคำสั่ง:</p>
                                    <p>• "วิธีเพิ่มนักเรียนทำยังไง"</p>
                                    <p>• "จัดตารางสอนอัตโนมัติ"</p>
                                    <p>• "มีนักเรียนทั้งหมดกี่คน"</p>
                                    <p>• "ครูคนไหนสอนเยอะสุด"</p>
                                    <p>• "พิมพ์ตารางสอนยังไง"</p>
                                </div>
                            </div>
                        )}
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : isDarkMode ? 'bg-[#151925] border border-white/5 text-slate-200 rounded-tl-none' : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-sm'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className={`p-3 rounded-2xl rounded-tl-none flex items-center gap-2 ${isDarkMode ? 'bg-[#151925]' : 'bg-white'}`}>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '75ms' }}></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleChatSubmit} className={`p-3 border-t ${isDarkMode ? 'bg-[#151925] border-white/5' : 'bg-white border-slate-100'}`}>
                        <div className="relative">
                            <input
                                type="text"
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                placeholder={t('askSchedule')}
                                className={`w-full pl-4 pr-12 py-3 rounded-xl text-sm outline-none transition-all ${isDarkMode
                                    ? 'bg-black/20 border border-white/10 focus:border-blue-500/50 text-white placeholder:text-white/30'
                                    : 'bg-slate-100 border border-transparent focus:bg-white focus:border-blue-200 text-slate-800 placeholder:text-slate-400'
                                    }`}
                            />
                            <button
                                type="submit"
                                disabled={!chatMessage.trim() || chatLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setShowChat(!showChat)}
                className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${showChat
                    ? 'bg-red-500 text-white rotate-90'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                    }`}
            >
                {showChat ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </div>
    );
}
