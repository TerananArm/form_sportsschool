// app/dashboard/[menu]/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react'; // Import useSession
import { Save, RotateCcw, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext'; // ✅ Import useLanguage
import ConfirmModal from '../../components/ConfirmModal';
import DatePicker from '../../components/DatePicker';
import TimeGridPicker from '../../components/TimeGridPicker';

export default function DynamicPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const slug = params.menu;
    const editId = searchParams.get('id');
    const { isDarkMode } = useTheme();
    const { t, language } = useLanguage();
    const { data: session } = useSession(); // Get session
    const role = session?.user?.role;

    // Redirect if Student or Teacher tries to access Admin Forms
    useEffect(() => {
        if (role === 'student' || role === 'teacher') {
            // Students/Teachers should never see this generic add/edit form page.
            // They only access /dashboard/schedule.
            router.replace('/dashboard/schedule');
        }
    }, [role, router]);

    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [deptOptions, setDeptOptions] = useState([]);
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false, title: '', message: '', type: 'success', confirmText: t('confirm'), cancelText: null, onConfirm: null
    });

    // Fetch Data (ดึงข้อมูลแผนก และข้อมูลเก่ากรณีแก้ไข)
    useEffect(() => {
        const fetchData = async () => {
            try {
                // ดึงรายชื่อแผนกสำหรับ Dropdown
                if (['students', 'teachers', 'subjects'].includes(slug)) {
                    const resDept = await fetch('/api/dashboard/data?type=departments');
                    if (resDept.ok) {
                        const depts = await resDept.json();
                        setDeptOptions([t('selectDept'), ...depts.map(d => d.name)]);
                    }
                }

                // ดึงข้อมูลเก่ามาใส่ฟอร์ม (กรณี Edit)
                if (editId) {
                    const resData = await fetch(`/api/dashboard/data?type=${slug}&id=${editId}`);
                    if (resData.ok) {
                        const oldData = await resData.json();
                        // แปลงวันที่ให้เป็น format yyyy-mm-dd สำหรับ input type="date"
                        if (oldData.birthdate) oldData.birthdate = oldData.birthdate.split('T')[0];
                        setFormData(oldData);
                    }
                }
            } catch (error) { console.error(error); }
        };
        fetchData();
    }, [slug, editId, language]); // ✅ Add language to dependency array

    const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

    // ฟังก์ชันบันทึกข้อมูล
    const handleSave = async (e, force = false) => {
        if (e) e.preventDefault();
        if (!force) setIsLoading(true);

        try {
            const url = editId ? '/api/dashboard/update' : '/api/dashboard/add';
            const method = editId ? 'PUT' : 'POST';
            const payload = { type: slug, data: formData, id: editId, force };

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (res.ok) {
                setConfirmConfig({
                    isOpen: true,
                    title: editId ? t('updateSuccess') : t('saveSuccess'),
                    message: null,
                    confirmText: t('confirm'),
                    type: 'success',
                    cancelText: null,
                    onConfirm: () => {
                        if (!editId) {
                            // ถ้าเป็นการเพิ่มใหม่ ให้ล้างฟอร์ม
                            const form = document.querySelector('form');
                            if (form) form.reset();
                            setFormData({});
                        } else {
                            // ถ้าเป็นการแก้ไข ให้ย้อนกลับ
                            router.back();
                        }
                    }
                });
                setIsLoading(false);
            }
            else if (res.status === 409) {
                // กรณีข้อมูลซ้ำ
                setIsLoading(false);
                setConfirmConfig({
                    isOpen: true,
                    title: t('duplicateFound'),
                    message: `${result.message}\n${t('duplicateConfirm')}`,
                    confirmText: t('overwrite'),
                    cancelText: t('cancel'),
                    type: 'warning',
                    onConfirm: () => handleSave(null, true) // เรียกซ้ำแบบ force=true
                });
            }
            else {
                // กรณี Error อื่นๆ
                setConfirmConfig({
                    isOpen: true,
                    title: t('error'),
                    message: result.message || t('error'),
                    confirmText: t('confirm'),
                    cancelText: null,
                    type: 'danger'
                });
                setIsLoading(false);
            }
        } catch (error) {
            setConfirmConfig({
                isOpen: true,
                title: t('error'),
                message: t('connectionError'),
                confirmText: t('confirm'),
                cancelText: null,
                type: 'danger'
            });
            setIsLoading(false);
        }
    };

    const handleClear = async () => {
        const result = await Swal.fire({
            title: t('confirmClear'),
            text: t('confirmClearMessage') || 'คุณต้องการล้างข้อมูลในฟอร์มใช่หรือไม่?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3b82f6',
            confirmButtonText: t('adminRole') === 'ผู้ดูแลระบบ' ? 'ล้างข้อมูล' : 'Clear',
            cancelButtonText: t('cancel'),
            background: isDarkMode ? '#1e293b' : '#fff',
            color: isDarkMode ? '#fff' : '#000'
        });

        if (result.isConfirmed) {
            setFormData({});
            // Reset file inputs if any
            const form = document.querySelector('form');
            if (form) form.reset();
        }
    };

    // Config ของแต่ละเมนู (ฟังก์ชันครบ)
    const config = {
        'students': {
            title: t('addStudentTitle'),
            desc: t('addStudentDesc'),
            fields: [
                { name: 'id', label: t('studentId'), placeholder: t('studentIdPlaceholder'), type: 'text' },
                { name: 'name', label: t('name'), placeholder: t('namePlaceholder'), type: 'text' },
                { name: 'birthdate', label: t('birthdate'), type: 'date' },
                { name: 'department', label: t('deptName'), type: 'select', options: deptOptions },
                { name: 'level', label: t('classLevel'), type: 'select', options: [t('selectLevel'), 'ปวช. 1/1', 'ปวช. 1/2', 'ปวช. 2/1', 'ปวช. 3/1', 'ปวส. 1/1', 'ปวส. 2/1'] },
                { name: 'password', label: t('password'), placeholder: t('passwordPlaceholder'), type: 'password' },
            ]
        },
        'teachers': {
            title: t('addTeacherTitle'),
            desc: t('addTeacherDesc'),
            fields: [
                { name: 'id', label: t('teacherId'), placeholder: t('teacherIdPlaceholder'), type: 'text' },
                { name: 'name', label: t('name'), placeholder: t('namePlaceholder'), type: 'text' },
                { name: 'birthdate', label: t('birthdate'), type: 'date' },
                { name: 'department', label: t('deptName'), type: 'select', options: deptOptions },
                { name: 'room', label: t('teacherRoom'), type: 'text', placeholder: t('teacherRoomPlaceholder') },
                { name: 'password', label: t('password'), placeholder: t('passwordPlaceholder'), type: 'password' },
                { name: 'max_hours', label: t('maxHoursLabel'), defaultValue: '20', type: 'number' },
                { name: 'unavailable_times', label: 'เวลาไม่สะดวกสอน', type: 'timegrid' },
            ],
        },
        'subjects': {
            title: t('addSubjectTitle'),
            desc: t('addSubjectDesc'),
            fields: [
                { name: 'code', label: t('subjectCode'), placeholder: t('subjectCodePlaceholder'), type: 'text' },
                { name: 'name', label: t('subjectName'), placeholder: t('subjectNamePlaceholder'), type: 'text' },
                { name: 'department', label: t('deptName'), type: 'select', options: deptOptions },
                { name: 'credit', label: t('credit'), placeholder: '3', type: 'number' },
                { name: 'theory', label: t('theoryHours'), placeholder: '0', type: 'number', half: true },
                { name: 'practice', label: t('practiceHours'), placeholder: '0', type: 'number', half: true },
            ]
        },
        'rooms': {
            title: t('addRoomTitle'),
            desc: t('addRoomDesc'),
            fields: [
                { name: 'name', label: t('roomName'), placeholder: t('roomNamePlaceholder'), type: 'text' },
                { name: 'type', label: t('roomType'), type: 'select', options: ['lecture', 'lab'] },
                { name: 'capacity', label: t('roomCapacity'), defaultValue: '40', type: 'number' },
            ]
        },
        'departments': {
            title: t('addDeptTitle'),
            desc: t('addDeptDesc'),
            fields: [{ name: 'name', label: t('deptName'), placeholder: t('deptNamePlaceholder'), type: 'text' }]
        },
        'users': {
            title: t('addUserTitle'),
            desc: t('addUserDesc'),
            fields: [
                { name: 'username', label: t('usernameLabel'), placeholder: t('usernamePlaceholder'), type: 'text' },
                { name: 'name', label: t('name'), placeholder: t('namePlaceholder'), type: 'text' },
                { name: 'password', label: t('password'), placeholder: t('passwordPlaceholder'), type: 'password' },
            ]
        },
        'schedule': { type: 'custom_schedule', title: t('scheduleTitle') },
        'curriculum': { type: 'custom_curriculum', title: t('curriculum') },
    }[slug];

    if (!config) return <div className="p-10 text-center opacity-60">{t('menuNotFound')}</div>;
    if (config.type?.startsWith('custom')) return <div className="p-10 text-center opacity-60">{t('pageNotActive')}</div>;

    // ✅ Form Style: Gray Blur
    const cardClass = `rounded-[40px] shadow-2xl p-10 transition-all duration-300 border backdrop-blur-3xl backdrop-saturate-150 ${isDarkMode ? 'bg-slate-800/60 border-white/10 shadow-black/50' : 'bg-slate-200/70 border-white/40 shadow-slate-300'}`;

    const inputClass = `w-full h-14 px-6 rounded-2xl border-2 outline-none transition-all placeholder-gray-400 font-medium backdrop-blur-md ${isDarkMode
        ? 'bg-slate-900/50 border-white/10 text-white focus:border-red-500 focus:bg-slate-900/70'
        : 'bg-white/40 border-white/40 text-slate-800 focus:border-red-500 focus:bg-white/80'
        }`;

    return (
        <div className="pb-20 max-w-5xl mx-auto animate-fade-in flex items-center justify-center min-h-[calc(100vh-120px)]">
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                cancelText={confirmConfig.cancelText}
                type={confirmConfig.type}
                onConfirm={confirmConfig.onConfirm}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
            />

            {/* ตัวการ์ดฟอร์ม: รวม Header เข้าไปข้างในแล้ว */}
            <div className={`w-full ${cardClass}`}>

                {/* ✅ ส่วน Header ย้ายเข้ามาใน Card */}
                <div className={`flex items-center gap-5 mb-10 pb-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
                    <button onClick={() => router.back()} className={`p-3.5 rounded-full transition-all border backdrop-blur-md shadow-sm ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-white/40 hover:bg-white/60 border-white/40 text-slate-700'}`}>
                        <ArrowLeft size={28} />
                    </button>
                    <div>
                        <h1 className={`text-4xl font-black tracking-tight drop-shadow-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{editId ? t('editData') : config.title}</h1>
                        <p className={`mt-1 text-lg font-medium ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>{config.desc}</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {config.fields.map((field, idx) => (
                            <div key={idx} className={`space-y-2.5 ${field.half ? 'col-span-1' : 'col-span-2'}`}>
                                <label className={`block text-sm font-bold uppercase tracking-wider opacity-80 pl-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                    {field.label}
                                </label>
                                {field.type === 'select' ? (
                                    <div className="relative">
                                        <select name={field.name} onChange={handleChange} className={inputClass} value={formData[field.name] || ''}>
                                            {field.options?.map((opt, i) => <option key={i} value={opt} className="text-black">{opt}</option>)}
                                        </select>
                                    </div>
                                ) : field.type === 'timegrid' ? (
                                    <TimeGridPicker
                                        value={formData[field.name]}
                                        onChange={(value) => handleChange({ target: { name: field.name, value } })}
                                    />
                                ) : (
                                    <div key={language} className="relative"> {/* ✅ Force re-render of container */}
                                        {field.type === 'date' || field.name === 'birthdate' ? (
                                            <DatePicker
                                                value={formData[field.name]}
                                                onChange={(date) => handleChange({ target: { name: field.name, value: date } })}
                                            />
                                        ) : (
                                            <input
                                                lang={
                                                    language === 'th' ? 'th-TH' :
                                                        language === 'en' ? 'en-GB' : // en-GB for dd/mm/yyyy
                                                            language === 'zh' ? 'zh-CN' : // yyyy/mm/dd
                                                                language === 'ja' ? 'ja-JP' : // yyyy/mm/dd
                                                                    language === 'ko' ? 'ko-KR' : // yyyy/mm/dd
                                                                        'en-GB'
                                                }
                                                type={field.type}
                                                name={field.name}
                                                placeholder={field.placeholder}
                                                value={formData[field.name] || ''}
                                                onChange={handleChange}
                                                className={inputClass}
                                                disabled={editId && (field.name === 'id' || field.name === 'code' || field.name === 'username')}
                                                required={field.name !== 'password' && field.name !== 'birthdate' && field.name !== 'room' && field.name !== 'unavailable_times'}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className={`pt-8 flex gap-4 border-t mt-4 ${isDarkMode ? 'border-white/10' : 'border-white/20'}`}>
                        <button type="submit" disabled={isLoading} className="flex-1 py-4 text-white font-bold text-lg rounded-2xl shadow-xl transition-all transform active:scale-[0.98] hover:shadow-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500">
                            {isLoading ? t('saving') : <span className="flex items-center justify-center gap-2"><Save size={22} /> {t('saveData')}</span>}
                        </button>
                        {!editId && <button type="button" onClick={handleClear} className={`px-8 py-4 font-bold text-lg rounded-2xl border transition-all active:scale-[0.98] flex items-center gap-2 backdrop-blur-md ${isDarkMode ? 'bg-slate-700 border-white/10 hover:bg-slate-600 text-white' : 'bg-white/40 border-white/40 hover:bg-white/60 text-slate-700'}`}><RotateCcw size={22} /> {t('clearForm')}</button>}
                    </div>
                </form>
            </div >
        </div >
    );
}