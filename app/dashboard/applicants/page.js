'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import { Search, Trash2, FileSpreadsheet, RefreshCw, User, Plus, Eye, Upload, Edit, X, Filter, Check, Printer, ChevronDown } from 'lucide-react';
import ApplicantForm from '../../components/ApplicantForm';
import { printApplicationForm } from '../../../lib/printUtils';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function ApplicantsPage() {
    const [activeTab, setActiveTab] = useState('view');
    const { data, error, mutate, isLoading } = useSWR('/api/applicants', fetcher);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sportFilter, setSportFilter] = useState('all');
    const [editingApplicant, setEditingApplicant] = useState(null);
    const [viewingApplicant, setViewingApplicant] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const router = useRouter();

    const applicants = data?.data || [];

    // Get unique sport types for filter
    const sportTypes = [...new Set(applicants.map(a => a.sportType).filter(Boolean))];

    // Apply filters
    const filteredApplicants = applicants.filter(app => {
        const matchesSearch = app.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.applicationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.schoolName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        const matchesSport = sportFilter === 'all' || app.sportType === sportFilter;
        return matchesSearch && matchesStatus && matchesSport;
    });

    // Pagination
    const totalPages = Math.ceil(filteredApplicants.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedApplicants = filteredApplicants.slice(startIndex, startIndex + itemsPerPage);

    // Reset to page 1 when filters change
    const handleFilterChange = (setter) => (value) => {
        setter(value);
        setCurrentPage(1);
    };

    // Checkbox Handlers
    const toggleSelectAll = () => {
        if (selectedIds.length === filteredApplicants.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredApplicants.map(a => a.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Bulk Delete
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const result = await Swal.fire({
            title: `ลบข้อมูล ${selectedIds.length} รายการ?`,
            text: "คุณจะไม่สามารถกู้คืนข้อมูลเหล่านี้ได้!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบทั้งหมด',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch('/api/applicants', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: selectedIds })
                });
                const json = await res.json();
                if (json.success) {
                    setSelectedIds([]);
                    mutate();
                    Swal.fire('ลบสำเร็จ!', `ลบข้อมูล ${selectedIds.length} รายการแล้ว`, 'success');
                } else {
                    Swal.fire('เกิดข้อผิดพลาด!', json.message, 'error');
                }
            } catch (err) {
                Swal.fire('เกิดข้อผิดพลาด!', 'เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้ง', 'error');
            }
        }
    };

    // Single Delete
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/applicants?id=${id}`, { method: 'DELETE' });
                const json = await res.json();
                if (json.success) {
                    mutate();
                    Swal.fire('ลบสำเร็จ!', 'ข้อมูลถูกลบเรียบร้อยแล้ว.', 'success');
                }
            } catch (err) {
                Swal.fire('เกิดข้อผิดพลาด!', 'เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้ง', 'error');
            }
        }
    };

    // Edit Submit
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = Object.fromEntries(formData.entries());
        updates.id = editingApplicant.id;

        try {
            const res = await fetch('/api/applicants', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const json = await res.json();
            if (json.success) {
                setEditingApplicant(null);
                mutate();
                Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1500, showConfirmButton: false });
            } else {
                throw new Error(json.message);
            }
        } catch (err) {
            Swal.fire('เกิดข้อผิดพลาด', err.message || 'บันทึกไม่สำเร็จ', 'error');
        }
    };

    // Export Excel
    const handleExport = () => {
        const data = filteredApplicants.map(app => ({
            "ใบสมัครเลขที่": app.applicationNumber || '',
            "เลขที่ใบสมัครสอบ": app.examApplicationNumber || '',
            "โรงเรียนที่ประสงค์เข้าศึกษา": app.targetSchool || '',
            "รหัสโรงเรียน": app.schoolCode || '',
            "ชื่อ-นามสกุล": app.name || '',
            "เพศ": app.gender === 'male' ? 'ชาย' : (app.gender === 'female' ? 'หญิง' : app.gender || ''),
            "อายุ": app.age || '',
            "วันเกิด": app.birthdate ? new Date(app.birthdate).toLocaleDateString('th-TH') : '',
            "ส่วนสูง (ซม.)": app.height || '',
            "น้ำหนัก (กก.)": app.weight || '',
            "เชื้อชาติ": app.race || '',
            "สัญชาติ": app.nationality || '',
            "ศาสนา": app.religion || '',

            // ข้อมูลที่อยู่
            "ที่อยู่": app.address || '',
            "หมู่": app.village || '',
            "ถนน": app.road || '',
            "ตำบล/แขวง": app.subDistrict || '',
            "อำเภอ/เขต": app.district || '',
            "จังหวัด": app.province || '',
            "รหัสไปรษณีย์": app.postalCode || '',
            "เบอร์โทรศัพท์": app.phone || '',

            // ข้อมูลการศึกษาปัจจุบัน
            "ระดับชั้นปัจจุบัน": app.currentEducation || '',
            "ปีการศึกษา": app.educationYear || '',
            "โรงเรียนเดิม": app.schoolName || '',
            "ตำบล (โรงเรียนเดิม)": app.schoolSubDistrict || '',
            "อำเภอ (โรงเรียนเดิม)": app.schoolDistrict || '',
            "จังหวัด (โรงเรียนเดิม)": app.schoolProvince || '',
            "รหัสไปรษณีย์ (โรงเรียนเดิม)": app.schoolPostalCode || '',

            // ข้อมูลบิดา
            "ชื่อบิดา": app.fatherName || '',
            "อาชีพบิดา": app.fatherOccupation || '',
            "เชื้อชาติบิดา": app.fatherRace || '',
            "สัญชาติบิดา": app.fatherNationality || '',
            "ศาสนาบิดา": app.fatherReligion || '',
            "บิดาเป็นนักกีฬา": app.fatherIsAthlete ? 'ใช่' : 'ไม่ใช่',
            "ระดับนักกีฬา (บิดา)": app.fatherAthleteLevel || '',
            "ชนิดกีฬา (บิดา)": app.fatherSport || '',
            "ส่วนสูงบิดา": app.fatherHeight || '',
            "น้ำหนักบิดา": app.fatherWeight || '',

            // ข้อมูลมารดา
            "ชื่อมารดา": app.motherName || '',
            "อาชีพมารดา": app.motherOccupation || '',
            "เชื้อชาติมารดา": app.motherRace || '',
            "สัญชาติมารดา": app.motherNationality || '',
            "ศาสนามารดา": app.motherReligion || '',
            "มารดาเป็นนักกีฬา": app.motherIsAthlete ? 'ใช่' : 'ไม่ใช่',
            "ระดับนักกีฬา (มารดา)": app.motherAthleteLevel || '',
            "ชนิดกีฬา (มารดา)": app.motherSport || '',
            "ส่วนสูงมารดา": app.motherHeight || '',
            "น้ำหนักมารดา": app.motherWeight || '',

            // ข้อมูลการสมัคร
            "ชนิดกีฬาที่สมัคร": app.sportType || '',
            "รหัสกีฬา": app.sportCode || '',
            "ระดับชั้นที่สมัคร": app.appliedLevel || '',
            "สถานะ": app.status || 'รอสัมภาษณ์',
            "วันที่สมัคร": new Date(app.createdAt).toLocaleDateString('th-TH'),

            // เอกสาร
            "ใบรับรองผลการเรียน": app.hasEducationCert ? 'มี' : 'ไม่มี',
            "สำเนาทะเบียนบ้าน": app.hasHouseReg ? 'มี' : 'ไม่มี',
            "สำเนาบัตรประชาชน": app.hasIdCard ? 'มี' : 'ไม่มี',
            "ใบรับรองความสามารถทางกีฬา": app.hasAthleteCert ? 'มี' : 'ไม่มี',
            "หลักฐานการเปลี่ยนชื่อ-สกุล": app.hasNameChangeCert ? 'มี' : 'ไม่มี',
            "เอกสารอื่นๆ": app.hasOtherDocs ? 'มี' : 'ไม่มี',
            "รายละเอียดเอกสารอื่นๆ": app.otherDocsDesc || ''
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Applicants");
        XLSX.writeFile(wb, `applicants_full_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Status update inline
    const handleStatusChange = async (id, newStatus) => {
        try {
            await fetch('/api/applicants', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });
            mutate();
            Swal.fire({ icon: 'success', title: 'อัปเดตสถานะแล้ว', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
        } catch (err) {
            Swal.fire('เกิดข้อผิดพลาด', 'อัปเดตสถานะไม่สำเร็จ', 'error');
        }
    };

    // Print Application Receipt - Using official form template
    const handlePrint = (app) => {
        printApplicationForm(app);
    };

    return (
        <div className="animate-fade-in pb-20">
            {/* Unified Glass Container */}
            <div className="glass-card-premium dark:bg-slate-900/80 dark:backdrop-blur-xl rounded-[2.5rem] p-8 min-h-[800px] border border-white/40 dark:border-slate-800/60 shadow-2xl relative overflow-hidden">

                {/* Header Section inside Card */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 border-b border-slate-100/50 dark:border-slate-800/50 pb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-slate-100 dark:border-slate-800 shadow-sm group dark:text-slate-400 dark:hover:text-white">
                            <span className="text-xl group-hover:-translate-x-1 transition-transform block">←</span>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                {activeTab === 'add' && editingApplicant ? `แก้ไขข้อมูล: ${editingApplicant.name}` :
                                    activeTab === 'add' ? 'เพิ่มผู้สมัครใหม่' : 'ผู้สมัคร'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                {activeTab === 'add' ? 'กรอกข้อมูลรายละเอียดผู้สมัครด้านล่าง' : 'จัดการข้อมูลและตรวจสอบสถานะผู้สมัครในระบบ'}
                            </p>
                        </div>
                    </div>

                    {/* Actions & Filters (Only show in view tab or if bulk selecting) */}
                    <div className="flex items-center gap-3">
                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-3 px-4 py-2 bg-red-50 text-red-600 rounded-2xl animate-fade-in border border-red-100">
                                <span className="text-sm font-bold">เลือก {selectedIds.length} รายการ</span>
                                <button
                                    onClick={handleBulkDelete}
                                    className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                                    title="ลบที่เลือก"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        )}

                        {/* Tab Switcher */}
                        <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                            <button
                                onClick={() => setActiveTab('view')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                                    ${activeTab === 'view'
                                        ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-lg shadow-slate-200/50 dark:shadow-none'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                                    }`}
                            >
                                <Eye size={18} />
                                ดูข้อมูล
                            </button>
                            <button
                                onClick={() => { setActiveTab('add'); setEditingApplicant(null); }}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                                    ${activeTab === 'add'
                                        ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-lg shadow-slate-200/50 dark:shadow-none'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                                    }`}
                            >
                                {editingApplicant ? <Edit size={18} /> : <Plus size={18} />}
                                {editingApplicant ? 'แก้ไข' : 'เพิ่มข้อมูล'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div>
                    {/* VIEW TAB */}
                    {activeTab === 'view' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Search & Filters */}
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาชื่อ, เลขใบสมัคร, โรงเรียน..."
                                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50/50 border border-slate-200/50 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/30 transition-all dark:bg-slate-800/50 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-200/50 outline-none text-sm font-medium cursor-pointer hover:bg-white transition-colors dark:bg-slate-800/50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                                    >
                                        <option value="all">สถานะทั้งหมด</option>
                                        <option value="รอสัมภาษณ์">รอสัมภาษณ์</option>
                                        <option value="ผ่านการคัดเลือก">ผ่านการคัดเลือก</option>
                                        <option value="ไม่ผ่าน">ไม่ผ่าน</option>
                                        <option value="สละสิทธิ์">สละสิทธิ์</option>
                                    </select>
                                    <select
                                        value={sportFilter}
                                        onChange={(e) => setSportFilter(e.target.value)}
                                        className="px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-200/50 outline-none text-sm font-medium cursor-pointer hover:bg-white transition-colors dark:bg-slate-800/50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                                    >
                                        <option value="all">ประเภทกีฬาทั้งหมด</option>
                                        {sportTypes.map(sport => (
                                            <option key={sport} value={sport}>{sport}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleExport}
                                        className="px-6 py-3 bg-green-500 text-white rounded-2xl font-bold shadow-lg shadow-green-500/20 hover:bg-green-600 hover:scale-105 transition-all flex items-center gap-2"
                                    >
                                        <FileSpreadsheet size={18} />
                                        ส่งออก Excel
                                    </button>
                                </div>
                            </div>

                            {/* Mobile Card View - shown on small screens */}
                            <div className="lg:hidden space-y-4">
                                {isLoading ? (
                                    <div className="p-12 text-center text-slate-400">กำลังโหลดข้อมูล...</div>
                                ) : filteredApplicants.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400">ไม่พบข้อมูลผู้สมัคร</div>
                                ) : (
                                    paginatedApplicants.map((app, index) => (
                                        <div
                                            key={app.id}
                                            className={`bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all ${selectedIds.includes(app.id) ? 'ring-2 ring-red-500' : ''}`}
                                        >
                                            {/* Card Header */}
                                            <div className="flex items-start gap-3 mb-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(app.id)}
                                                    onChange={() => toggleSelect(app.id)}
                                                    className="w-5 h-5 mt-1 rounded-lg border-slate-300 text-red-500 focus:ring-red-500"
                                                />
                                                {app.photoPath ? (
                                                    <img src={app.photoPath} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-white dark:border-slate-700 shadow-md" />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                                                        {app.name?.[0]}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-slate-800 dark:text-white text-lg truncate">{app.name}</h3>
                                                    <div className="text-xs text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block mt-1 border border-slate-200 dark:border-slate-700">
                                                        {app.applicationNumber}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-400 font-medium">#{startIndex + index + 1}</span>
                                            </div>

                                            {/* Card Body */}
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">ชนิดกีฬา</div>
                                                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{app.sportType || '-'}</div>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">สถานะ</div>
                                                    <div className="relative">
                                                        <select
                                                            value={app.status || 'รอสัมภาษณ์'}
                                                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                                            className={`w-full px-4 py-1.5 pr-8 rounded-xl text-xs font-bold cursor-pointer outline-none border-none appearance-none transition-all
                                                                ${app.status === 'ผ่านการคัดเลือก' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                                                                    app.status === 'ไม่ผ่าน' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' :
                                                                        app.status === 'สละสิทธิ์' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' :
                                                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                                                                }`}
                                                        >
                                                            <option value="รอสัมภาษณ์">รอสัมภาษณ์</option>
                                                            <option value="ผ่านการคัดเลือก">ผ่านการคัดเลือก</option>
                                                            <option value="ไม่ผ่าน">ไม่ผ่าน</option>
                                                            <option value="สละสิทธิ์">สละสิทธิ์</option>
                                                        </select>
                                                        <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none 
                                                            ${app.status === 'ผ่านการคัดเลือก' ? 'text-green-700 dark:text-green-400' :
                                                                app.status === 'ไม่ผ่าน' ? 'text-red-700 dark:text-red-400' :
                                                                    app.status === 'สละสิทธิ์' ? 'text-orange-700 dark:text-orange-400' :
                                                                        'text-blue-700 dark:text-blue-400'
                                                            }`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Actions */}
                                            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                                <button
                                                    onClick={() => handlePrint(app)}
                                                    className="flex-1 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-100 dark:hover:bg-green-900/40 transition-all"
                                                >
                                                    <Printer size={16} /> พิมพ์
                                                </button>
                                                <button
                                                    onClick={() => { setEditingApplicant(app); setActiveTab('add'); }}
                                                    className="flex-1 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                                                >
                                                    <Edit size={16} /> แก้ไข
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(app.id)}
                                                    className="py-2.5 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Desktop Table View - hidden on small screens */}
                            <div className="hidden lg:block overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/80 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="px-6 py-5 text-center w-16">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.length === filteredApplicants.length && filteredApplicants.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="w-5 h-5 rounded-lg border-slate-300 text-red-500 focus:ring-red-500 cursor-pointer"
                                                />
                                            </th>
                                            <th className="px-6 py-5 text-slate-600 dark:text-slate-400 font-bold text-sm">ลำดับ</th>
                                            <th className="px-6 py-5 text-slate-600 dark:text-slate-400 font-bold text-sm">ผู้สมัคร</th>
                                            <th className="px-6 py-5 text-slate-600 dark:text-slate-400 font-bold text-sm">ตำแหน่งที่สมัคร</th>
                                            <th className="px-6 py-5 text-slate-600 dark:text-slate-400 font-bold text-sm">สถานะ</th>
                                            <th className="px-6 py-5 text-slate-600 dark:text-slate-400 font-bold text-sm text-right">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {isLoading ? (
                                            <tr><td colSpan="6" className="p-12 text-center text-slate-400">กำลังโหลดข้อมูล...</td></tr>
                                        ) : filteredApplicants.length === 0 ? (
                                            <tr><td colSpan="6" className="p-12 text-center text-slate-400">ไม่พบข้อมูลผู้สมัคร</td></tr>
                                        ) : (
                                            paginatedApplicants.map((app, index) => (
                                                <tr key={app.id} className={`group hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-colors ${selectedIds.includes(app.id) ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                                                    <td className="px-6 py-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(app.id)}
                                                            onChange={() => toggleSelect(app.id)}
                                                            className="w-5 h-5 rounded-lg border-slate-300 text-red-500 focus:ring-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity checked:opacity-100"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-400 font-medium">{startIndex + index + 1}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            {app.photoPath ? (
                                                                <img src={app.photoPath} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-sm" />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-lg shadow-inner">
                                                                    {app.name?.[0]}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-bold text-slate-700 dark:text-slate-200">{app.name}</div>
                                                                <div className="text-xs text-slate-400 mt-0.5 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md inline-block border border-slate-200 dark:border-slate-700">
                                                                    {app.applicationNumber}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-semibold border border-blue-100 dark:border-blue-800/50">
                                                            {app.sportType || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="relative w-fit">
                                                            <select
                                                                value={app.status || 'รอสัมภาษณ์'}
                                                                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                                                className={`px-4 py-1.5 pr-8 rounded-xl text-xs font-bold cursor-pointer outline-none border-none appearance-none transition-all shadow-sm hover:shadow-md
                                                                    ${app.status === 'ผ่านการคัดเลือก' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                        app.status === 'ไม่ผ่าน' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                            app.status === 'สละสิทธิ์' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                                    }`}
                                                            >
                                                                <option value="รอสัมภาษณ์">รอสัมภาษณ์</option>
                                                                <option value="ผ่านการคัดเลือก">ผ่านการคัดเลือก</option>
                                                                <option value="ไม่ผ่าน">ไม่ผ่าน</option>
                                                                <option value="สละสิทธิ์">สละสิทธิ์</option>
                                                            </select>
                                                            <ChevronDown size={14} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none 
                                                                ${app.status === 'ผ่านการคัดเลือก' ? 'text-green-700 dark:text-green-400' :
                                                                    app.status === 'ไม่ผ่าน' ? 'text-red-700 dark:text-red-400' :
                                                                        app.status === 'สละสิทธิ์' ? 'text-orange-700 dark:text-orange-400' :
                                                                            'text-blue-700 dark:text-blue-400'
                                                                }`}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handlePrint(app)}
                                                                className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-xl transition-all shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-700"
                                                                title="พิมพ์ใบสมัคร"
                                                            >
                                                                <Printer size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => { setEditingApplicant(app); setActiveTab('add'); }}
                                                                className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-700"
                                                                title="แก้ไข"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(app.id)}
                                                                className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-700"
                                                                title="ลบ"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {filteredApplicants.length > 0 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                        <span>แสดง</span>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-medium cursor-pointer"
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                        <span>รายการ</span>
                                        <span className="hidden sm:inline text-slate-400">|</span>
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                                            {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredApplicants.length)} จาก {filteredApplicants.length} รายการ
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            ««
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
                                        >
                                            ก่อนหน้า
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === pageNum
                                                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                            : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
                                        >
                                            ถัดไป
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            »»
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ADD/EDIT TAB content */}
                    {activeTab === 'add' && (
                        <div className="animate-fade-in">
                            <ApplicantForm
                                editData={editingApplicant}
                                onSuccess={() => {
                                    setActiveTab('view');
                                    setEditingApplicant(null);
                                    mutate();
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
