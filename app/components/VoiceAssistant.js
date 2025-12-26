'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, MessageSquare } from 'lucide-react';

export default function VoiceAssistant({ isActive, onToggle }) {
    const router = useRouter();
    const [isListening, setIsListening] = useState(false);
    const [lastTranscript, setLastTranscript] = useState('');
    const recognitionRef = useRef(null);

    const isActiveRef = useRef(isActive);

    // Sync ref with prop
    useEffect(() => {
        isActiveRef.current = isActive;
    }, [isActive]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true; // Keep listening
                recognition.interimResults = false;
                recognition.lang = 'th-TH'; // Default to Thai

                recognition.onstart = () => setIsListening(true);
                recognition.onend = () => {
                    // Auto-restart if it was supposed to be active
                    if (isActiveRef.current) {
                        try { recognition.start(); } catch (e) { /* ignore */ }
                    } else {
                        setIsListening(false);
                    }
                };

                recognition.onresult = (event) => {
                    const transcript = event.results[event.results.length - 1][0].transcript.trim();
                    setLastTranscript(transcript);
                    processCommand(transcript);
                };

                recognitionRef.current = recognition;
            }
        }

        // Cleanup on unmount
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    // Handle Active State
    useEffect(() => {
        if (!recognitionRef.current) return;

        if (isActive) {
            try { recognitionRef.current.start(); } catch (e) { }
            speak("ระบบสั่งงานด้วยเสียง พร้อมใช้งานครับ");
        } else {
            // Use abort() to immediately stop listening and release microphone
            try { recognitionRef.current.abort(); } catch (e) { }
            // User requested NOT to speak when deactivated
        }
    }, [isActive]);

    const speak = (text) => {
        if (!window.speechSynthesis) return;

        // Cancel previous speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'th-TH';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Try to find a Thai voice
        const voices = window.speechSynthesis.getVoices();
        const thVoice = voices.find(v => v.lang.includes('th')) || voices[0];
        if (thVoice) utterance.voice = thVoice;

        window.speechSynthesis.speak(utterance);
    };

    const processCommand = (text) => {
        console.log("Command received:", text);
        const cmd = text.toLowerCase();

        // Helper to dispatch custom event
        const dispatch = (action, detail = {}) => {
            window.dispatchEvent(new CustomEvent('voice-command', { detail: { action, ...detail } }));
        };

        // 1. Tab Navigation Commands
        if (cmd.includes('เพิ่มข้อมูล') || cmd.includes('add data')) {
            speak("เปิดหน้าเพิ่มข้อมูลครับ");
            dispatch('tab', { tab: 'edit' });
        }
        else if (cmd.includes('นำเข้า excel') || cmd.includes('import excel') || cmd.includes('นำเข้า')) {
            speak("เปิดหน้านำเข้า Excel ครับ");
            dispatch('tab', { tab: 'import' });
        }
        else if (cmd.includes('ดูข้อมูล') || cmd.includes('view data')) {
            speak("กลับสู่หน้ารายการข้อมูลครับ");
            dispatch('tab', { tab: 'view' });
        }

        // 2. Form Actions
        else if (cmd.includes('บันทึก') || cmd.includes('save')) {
            speak("กำลังบันทึกข้อมูลครับ");
            dispatch('save');
        }

        // 3. Data Entry (Typing)
        // Pattern: "พิมพ์ [Field Name] [Value]" 
        // Example: "พิมพ์ชื่อ สมชาย", "พิมพ์รหัส 1234"
        else if (cmd.startsWith('พิมพ์') || cmd.startsWith('type')) {
            const parts = cmd.replace('พิมพ์', '').replace('type', '').trim().split(' ');
            if (parts.length >= 2) {
                const fieldKeyword = parts[0];
                const value = parts.slice(1).join(' '); // Rejoin the rest as value
                speak(`กำลังพิมพ์ ${fieldKeyword} ${value} ครับ`);
                dispatch('input', { field: fieldKeyword, value });
            } else {
                // Try to be smarter: "Please type [value] in [field]" - simplistic fallback
                // logic omitted for simplicity, sticking to strict "Print X Y" for now
            }
        }

        // 4. Page Navigation (Existing)
        else if (cmd.includes('ตารางสอน') || cmd.includes('schedule')) {
            speak("กำลังเปิดหน้าจัดการตารางสอนครับ");
            router.push('/dashboard/schedule');
        }
        else if (cmd.includes('หน้าแรก') || cmd.includes('แดชบอร์ด') || cmd.includes('dashboard')) {
            speak("กลับสู่หน้าหลักครับ");
            router.push('/dashboard');
        }
        else if (cmd.includes('นักเรียน') || cmd.includes('student')) {
            speak("เปิดข้อมูลนักเรียนครับ");
            router.push('/dashboard/students');
        }
        else if (cmd.includes('ครู') || cmd.includes('อาจารย์') || cmd.includes('teacher')) {
            speak("เปิดข้อมูลอาจารย์ครับ");
            router.push('/dashboard/teachers');
        }
        else if (cmd.includes('ห้องเรียน') || cmd.includes('room')) {
            speak("เปิดข้อมูลห้องเรียนครับ");
            router.push('/dashboard/rooms');
        }
        else if (cmd.includes('รายงาน') || cmd.includes('report')) {
            speak("เปิดหน้ารายงานครับ");
            router.push('/dashboard/report');
        }

        // 5. Interaction Commands
        else if (cmd.includes('สวัสดี') || cmd.includes('hello')) {
            speak("สวัสดีครับ มีอะไรให้ช่วยไหมครับ");
        }
        else if (cmd.includes('ขอบคุณ')) {
            speak("ยินดีให้บริการครับ");
        }
        else if (cmd.includes('ชื่ออะไร')) {
            speak("ผมคือผู้ช่วย AI ของระบบ EduSched ครับ");
        }
    };

    // This component is mainly logical, but can render a status indicator if needed
    // We will render the Toggle in Header, so this just handles logic + feedback
    if (!isActive) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
            <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border border-white/20 
                ${isListening ? 'bg-red-600/90 text-white' : 'bg-slate-800/90 text-slate-300'}`}>

                {isListening ? (
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </div>
                ) : <MicOff size={16} />}

                <span className="font-medium text-sm whitespace-nowrap">
                    {lastTranscript ? `"${lastTranscript}"` : (isListening ? "กำลังฟัง..." : "Paused")}
                </span>
            </div>
        </div>
    );
}
