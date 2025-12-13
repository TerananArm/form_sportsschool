'use client';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import {
    BookOpen, Calendar, Users, GraduationCap, Building,
    DoorOpen, Layers, FileText, Settings, HelpCircle,
    ChevronDown, ChevronRight, Search, Sparkles, Printer,
    Upload, Download, Brain, MousePointer, Clock
} from 'lucide-react';

const manualSections = [
    {
        id: 'dashboard',
        icon: Building,
        title: 'แดชบอร์ด',
        titleEn: 'Dashboard',
        content: [
            { q: 'แดชบอร์ดแสดงอะไรบ้าง?', a: 'แดชบอร์ดแสดงสถิติรวมของระบบ เช่น จำนวนนักศึกษา, ครู, วิชา, ห้องเรียน และตารางสอน' },
            { q: 'ถามคำถาม AI ได้อย่างไร?', a: 'พิมพ์คำถามภาษาไทยในช่องค้นหา เช่น "มีนักศึกษากี่คน?", "ครูสอนวิชาอะไรบ้าง?"' },
        ]
    },
    {
        id: 'schedule',
        icon: Calendar,
        title: 'ตารางสอน',
        titleEn: 'Schedule',
        content: [
            { q: 'จัดตารางอัตโนมัติอย่างไร?', a: 'เลือกแผนก → เลือกระดับชั้น → กดปุ่ม "จัดตารางอัตโนมัติ" AI จะจัดตารางให้โดยเช้าเต็มก่อน แล้วค่อยใส่บ่าย' },
            { q: 'เพิ่มคาบเรียนเองได้ไหม?', a: 'ได้ครับ กดปุ่ม "+" หรือ "เพิ่มคาบ" แล้วเลือกวิชา, ครู, ห้อง และเวลา' },
            { q: 'ลากย้ายคาบเรียนได้ไหม?', a: 'ได้ครับ คลิกค้างที่คาบเรียนแล้วลากไปวางตำแหน่งใหม่' },
            { q: 'พิมพ์ตารางอย่างไร?', a: 'กดปุ่ม "พิมพ์" จะเปิดหน้าต่างใหม่ สามารถหมุนแนวนอน และบันทึกเป็น PDF ได้' },
        ]
    },
    {
        id: 'curriculum',
        icon: FileText,
        title: 'หลักสูตร',
        titleEn: 'Curriculum',
        content: [
            { q: 'กำหนดหลักสูตรอย่างไร?', a: 'เลือกระดับชั้น → เลือกแผนก → ติ๊กเลือกวิชาที่ต้องเรียน → กดบันทึก' },
            { q: 'AI แนะนำวิชาคืออะไร?', a: 'กดปุ่ม "AI แนะนำ" (ไอคอนไม้กายสิทธิ์) AI จะวิเคราะห์และแนะนำวิชาที่เหมาะสมให้อัตโนมัติ' },
        ]
    },
    {
        id: 'students',
        icon: GraduationCap,
        title: 'นักศึกษา',
        titleEn: 'Students',
        content: [
            { q: 'เพิ่มนักศึกษาอย่างไร?', a: 'ไปที่เมนู "นักศึกษา" → กดปุ่ม "เพิ่ม" → กรอกข้อมูล → กดบันทึก' },
            { q: 'นำเข้าจาก Excel ได้ไหม?', a: 'ได้ครับ กดปุ่ม "Template" เพื่อดาวน์โหลดไฟล์ตัวอย่าง → กรอกข้อมูล → กดปุ่ม "Import" เพื่อนำเข้า' },
            { q: 'ส่งออก Excel ได้ไหม?', a: 'ได้ครับ เลือกข้อมูลที่ต้องการ → กดปุ่ม "Export" จะดาวน์โหลดไฟล์ .xlsx' },
        ]
    },
    {
        id: 'teachers',
        icon: Users,
        title: 'ครูผู้สอน',
        titleEn: 'Teachers',
        content: [
            { q: 'เพิ่มครูอย่างไร?', a: 'ไปที่เมนู "ครูผู้สอน" → กดปุ่ม "เพิ่ม" → กรอกชื่อ, อีเมล, เบอร์โทร → กดบันทึก' },
            { q: 'กำหนดชั่วโมงสอนสูงสุดได้ไหม?', a: 'ได้ครับ ระบุในช่อง "ชั่วโมงสอนสูงสุดต่อสัปดาห์" AI จะไม่จัดตารางเกินนี้' },
        ]
    },
    {
        id: 'subjects',
        icon: BookOpen,
        title: 'รายวิชา',
        titleEn: 'Subjects',
        content: [
            { q: 'เพิ่มวิชาใหม่อย่างไร?', a: 'ไปที่เมนู "รายวิชา" → กดปุ่ม "เพิ่ม" → กรอกรหัสวิชา, ชื่อวิชา, หน่วยกิต → กดบันทึก' },
            { q: 'ทฤษฎี/ปฏิบัติ คืออะไร?', a: 'ทฤษฎี = ชั่วโมงสอนในห้องเรียนปกติ, ปฏิบัติ = ชั่วโมงสอนในห้อง Lab หรือ Workshop' },
        ]
    },
    {
        id: 'rooms',
        icon: DoorOpen,
        title: 'ห้องเรียน',
        titleEn: 'Rooms',
        content: [
            { q: 'ประเภทห้องมีอะไรบ้าง?', a: 'Classroom = ห้องเรียนปกติ, Lab = ห้องคอมพิวเตอร์, Workshop = ห้องปฏิบัติการ' },
            { q: 'ความจุห้องมีผลอย่างไร?', a: 'AI จะจัดตารางโดยพิจารณาจำนวนนักศึกษาให้ไม่เกินความจุห้อง' },
        ]
    },
    {
        id: 'levels',
        icon: Layers,
        title: 'ระดับชั้น',
        titleEn: 'Class Levels',
        content: [
            { q: 'ตั้งชื่อระดับชั้นอย่างไร?', a: 'แนะนำ: ปวช.1/1, ปวช.2/1, ปวส.1/1 เพื่อให้ AI เข้าใจและจัดตารางได้ถูกต้อง' },
            { q: 'ต้องเลือกแผนกด้วยไหม?', a: 'ใช่ครับ ต้องเลือกแผนกที่ระดับชั้นนั้นสังกัดด้วย' },
        ]
    },
];

const tips = [
    { icon: Sparkles, title: 'AI ฉลาด', desc: 'พิมพ์คำถามภาษาไทยได้เลย AI เข้าใจบริบท' },
    { icon: MousePointer, title: 'ลากวาง', desc: 'ลากคาบเรียนไปวางตำแหน่งใหม่ได้เลย' },
    { icon: Clock, title: 'เช้าก่อน', desc: 'AI จัดตารางโดยเติมเช้าให้เต็มก่อนบ่าย' },
    { icon: Printer, title: 'พิมพ์ได้', desc: 'กดปุ่มพิมพ์เพื่อบันทึกเป็น PDF' },
];

export default function HelpPage() {
    const { isDarkMode } = useTheme();
    const { language, t } = useLanguage();
    const [openSection, setOpenSection] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSections = manualSections.filter(section => {
        const searchLower = searchTerm.toLowerCase();
        return section.title.toLowerCase().includes(searchLower) ||
            section.content.some(item =>
                item.q.toLowerCase().includes(searchLower) ||
                item.a.toLowerCase().includes(searchLower)
            );
    });

    const cardClass = `rounded-3xl p-6 transition-all duration-300 border backdrop-blur-xl ${isDarkMode
            ? 'bg-slate-800/60 border-white/10'
            : 'bg-white/80 border-white/40 shadow-lg'
        }`;

    return (
        <div className="max-w-5xl mx-auto px-4 pb-20 animate-fade-in">
            {/* Header */}
            <div className="text-center mb-10">
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full mb-6 ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                    }`}>
                    <HelpCircle className="text-blue-500" size={24} />
                    <span className={`font-bold text-lg ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {language === 'th' ? 'คู่มือการใช้งาน' : 'User Manual'}
                    </span>
                </div>
                <h1 className={`text-4xl font-black mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    EduSched AI
                </h1>
                <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {language === 'th' ? 'ระบบบริหารจัดการตารางเรียนอัจฉริยะ' : 'Smart Class Scheduling System'}
                </p>
            </div>

            {/* Quick Tips */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {tips.map((tip, i) => (
                    <div key={i} className={`${cardClass} text-center hover:scale-105 transition-transform`}>
                        <tip.icon className={`mx-auto mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} size={28} />
                        <h3 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{tip.title}</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{tip.desc}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className={`${cardClass} mb-8`}>
                <div className="relative">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} size={20} />
                    <input
                        type="text"
                        placeholder={language === 'th' ? 'ค้นหาคำถาม...' : 'Search questions...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 rounded-2xl text-lg font-medium transition-all ${isDarkMode
                                ? 'bg-slate-700/50 text-white placeholder:text-slate-500 focus:bg-slate-700'
                                : 'bg-slate-100 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:shadow-lg'
                            } outline-none`}
                    />
                </div>
            </div>

            {/* FAQ Sections */}
            <div className="space-y-4">
                {filteredSections.map((section) => {
                    const isOpen = openSection === section.id;
                    const Icon = section.icon;

                    return (
                        <div key={section.id} className={`${cardClass} overflow-hidden`}>
                            <button
                                onClick={() => setOpenSection(isOpen ? null : section.id)}
                                className="w-full flex items-center justify-between p-2"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                                        }`}>
                                        <Icon className="text-blue-500" size={24} />
                                    </div>
                                    <div className="text-left">
                                        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                            {language === 'th' ? section.title : section.titleEn}
                                        </h2>
                                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {section.content.length} {language === 'th' ? 'คำถาม' : 'questions'}
                                        </p>
                                    </div>
                                </div>
                                {isOpen ? (
                                    <ChevronDown className={isDarkMode ? 'text-slate-400' : 'text-slate-500'} size={24} />
                                ) : (
                                    <ChevronRight className={isDarkMode ? 'text-slate-400' : 'text-slate-500'} size={24} />
                                )}
                            </button>

                            {isOpen && (
                                <div className="mt-4 space-y-4 animate-fade-in">
                                    {section.content.map((item, i) => (
                                        <div key={i} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'
                                            }`}>
                                            <p className={`font-bold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                Q: {item.q}
                                            </p>
                                            <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                A: {item.a}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Contact */}
            <div className={`${cardClass} mt-10 text-center`}>
                <Brain className={`mx-auto mb-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} size={40} />
                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    {language === 'th' ? 'ยังมีคำถาม?' : 'Still have questions?'}
                </h3>
                <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {language === 'th'
                        ? 'ลองถาม AI ในแดชบอร์ด หรือติดต่อผู้ดูแลระบบ'
                        : 'Try asking AI on Dashboard or contact admin'}
                </p>
            </div>
        </div>
    );
}
