'use client';
import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";
import {
    User, Activity, MapPin, Award, FileText, Upload, Save, Calendar, Smartphone, RefreshCw, Search, Printer, X, Eye
} from "lucide-react";
import { printApplicationForm } from "../../lib/printUtils";

// Reusable Input Component for consistency
const FormInput = ({ label, type = "text", name, required = false, placeholder, className = "", ...props }) => (
    <div className={`space-y-1.5 ${className}`}>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <input
                type={type}
                name={name}
                required={required}
                placeholder={placeholder}
                className="block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/80 px-4 py-2.5 text-slate-800 dark:text-white shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6 transition-all duration-200 ease-in-out hover:bg-slate-50 dark:hover:bg-slate-800"
                {...props}
            />
        </div>
    </div>
);

const SectionHeader = ({ icon: Icon, title, color = "red" }) => {
    const colors = {
        red: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        green: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
        orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
        purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
        pink: "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    };

    return (
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center shadow-sm`}>
                <Icon size={24} strokeWidth={2} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-light mt-0.5">กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง</p>
            </div>
        </div>
    );
};

export default function ApplicantForm({ onSuccess, editData }) {
    const formRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    const [gender, setGender] = useState("");
    const [educationLevel, setEducationLevel] = useState("");
    const [selectedFiles, setSelectedFiles] = useState({});

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFiles(prev => ({
                ...prev,
                [fieldName]: file
            }));
        }
    };

    const handleRemoveFile = (fieldName) => {
        setSelectedFiles(prev => {
            const newFiles = { ...prev };
            delete newFiles[fieldName];
            return newFiles;
        });

        // Reset the file input
        const input = document.querySelector(`input[name="${fieldName}"]`);
        if (input) input.value = '';
    };

    // Pre-fill form when editData is provided
    useEffect(() => {
        if (editData) {
            // Small delay to ensure form is rendered
            const timer = setTimeout(() => {
                if (!formRef.current) return;

                const form = formRef.current;
                const setVal = (name, val) => {
                    if (form.elements[name] && val !== undefined && val !== null) {
                        form.elements[name].value = val;
                    }
                };

                const setCheck = (name, checked) => {
                    if (form.elements[name]) form.elements[name].checked = !!checked;
                };

                // Header fields
                setVal('examApplicationNumber', editData.applicationNumber);
                setVal('targetSchool', editData.targetSchool);
                setVal('schoolCode', editData.schoolCode);

                // Personal
                setVal('name', editData.name);
                setGender(editData.gender || '');
                setVal('age', editData.age);
                setVal('birthdate', editData.birthdate ? editData.birthdate.split('T')[0] : '');
                setVal('race', editData.race);
                setVal('nationality', editData.nationality);
                setVal('religion', editData.religion);
                setVal('height', editData.height);
                setVal('weight', editData.weight);

                // Father
                setVal('fatherName', editData.fatherName);
                setVal('fatherOccupation', editData.fatherOccupation);
                setVal('fatherRace', editData.fatherRace);
                setVal('fatherNationality', editData.fatherNationality);
                setVal('fatherReligion', editData.fatherReligion);
                setVal('fatherAthleteLevel', editData.fatherAthleteLevel);
                setVal('fatherSport', editData.fatherSport);
                setVal('fatherHeight', editData.fatherHeight);

                // Mother
                setVal('motherName', editData.motherName);
                setVal('motherOccupation', editData.motherOccupation);
                setVal('motherRace', editData.motherRace);
                setVal('motherNationality', editData.motherNationality);
                setVal('motherReligion', editData.motherReligion);
                setVal('motherAthleteLevel', editData.motherAthleteLevel);
                setVal('motherSport', editData.motherSport);
                setVal('motherHeight', editData.motherHeight);

                // Address
                setVal('address', editData.address);
                setVal('village', editData.village);
                setVal('road', editData.road);
                setVal('subDistrict', editData.subDistrict);
                setVal('district', editData.district);
                setVal('province', editData.province);
                setVal('postalCode', editData.postalCode);
                setVal('phone', editData.phone);

                // Education - map DB field names to form field names
                setEducationLevel(editData.currentEducation || '');
                setVal('currentYear', editData.educationYear || editData.currentYear);
                setVal('schoolName', editData.schoolName);
                setVal('schoolSubDistrict', editData.schoolSubDistrict);
                setVal('schoolDistrict', editData.schoolDistrict);
                setVal('schoolProvince', editData.schoolProvince);
                setVal('schoolPostalCode', editData.schoolPostalCode);

                // Application
                setVal('appliedLevel', editData.appliedLevel);
                setVal('sportType', editData.sportType);
                setVal('sportCode', editData.sportCode);

                // Documents
                setCheck('hasEducationCert', editData.hasEducationCert);
                setVal('educationCertCount', editData.educationCertCount);
                setCheck('hasHouseReg', editData.hasHouseReg);
                setVal('houseRegCount', editData.houseRegCount);
                setCheck('hasIdCard', editData.hasIdCard);
                setVal('idCardCount', editData.idCardCount);
                setCheck('hasBirthCert', editData.hasAthleteCert);
                setVal('birthCertCount', editData.athleteCertCount);
                setCheck('hasNameChangeCert', editData.hasNameChangeCert);
                setVal('nameChangeCertCount', editData.nameChangeCertCount);
                setCheck('hasOtherDoc', editData.hasOtherDocs);
                setVal('otherDocDetail', editData.otherDocsDesc);
                setVal('otherDocCount', editData.otherDocsCount);

                // Photo
                if (editData.photoPath) {
                    setPreviewImage(editData.photoPath);
                }

                console.log('Form pre-filled with editData:', editData);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [editData]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewImage(null);
        }
    };

    const fillSampleData = () => {
        const form = formRef.current;
        if (!form) return;

        // Helper to set value safely
        const setVal = (name, val) => {
            if (form.elements[name]) form.elements[name].value = val;
        };

        const setCheck = (name, checked) => {
            if (form.elements[name]) form.elements[name].checked = checked;
        };

        // Random data pools
        const firstNames = ['รักษ์', 'สมชาย', 'สมหญิง', 'ปิยะ', 'วรรณา', 'กิตติ', 'สุดา', 'พงศ์', 'นภา', 'ธนา'];
        const lastNames = ['เรียนดี', 'ใจดี', 'มานะ', 'รักเรียน', 'กีฬาเก่ง', 'วิริยะ', 'อุตสาหะ', 'สุขใจ'];
        const sports = ['ฟุตบอล', 'บาสเกตบอล', 'วอลเลย์บอล', 'แบดมินตัน', 'ว่ายน้ำ', 'มวยไทย', 'เทควันโด', 'กรีฑา'];
        const occupations = ['รับจ้าง', 'ค้าขาย', 'รับราชการ', 'เกษตรกร', 'ธุรกิจส่วนตัว', 'พนักงานบริษัท'];
        const provinces = ['ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'ฉะเชิงเทรา', 'สระแก้ว', 'ปราจีนบุรี'];

        // Random helpers
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const randNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const randGender = Math.random() > 0.5 ? 'male' : 'female';
        const prefix = randGender === 'male' ? 'เด็กชาย' : 'เด็กหญิง';

        const firstName = pick(firstNames);
        const lastName = pick(lastNames);
        const age = randNum(12, 18);
        const birthYear = 2024 - age;
        const birthMonth = String(randNum(1, 12)).padStart(2, '0');
        const birthDay = String(randNum(1, 28)).padStart(2, '0');
        const province = pick(provinces);
        const sport = pick(sports);

        // Header
        setVal('examApplicationNumber', `67-${String(randNum(1, 9999)).padStart(4, '0')}`);
        setVal('targetSchool', `โรงเรียนกีฬาจังหวัด${province}`);
        setVal('schoolCode', `SB${randNum(100, 999)}`);

        // Personal
        setVal('name', `${prefix}${firstName} ${lastName}`);
        setGender(randGender);
        setVal('age', String(age));
        setVal('birthdate', `${birthYear}-${birthMonth}-${birthDay}`);
        setVal('race', 'ไทย');
        setVal('nationality', 'ไทย');
        setVal('religion', 'พุทธ');
        setVal('height', String(randNum(150, 185)));
        setVal('weight', String(randNum(40, 75)));

        // Father
        setVal('fatherName', `นาย${pick(firstNames)} ${lastName}`);
        setVal('fatherOccupation', pick(occupations));
        setVal('fatherRace', 'ไทย');
        setVal('fatherNationality', 'ไทย');
        setVal('fatherReligion', 'พุทธ');
        setVal('fatherAthleteLevel', Math.random() > 0.5 ? 'ระดับจังหวัด' : '');
        setVal('fatherSport', Math.random() > 0.5 ? pick(sports) : '');
        setVal('fatherHeight', String(randNum(165, 185)));

        // Mother
        setVal('motherName', `นาง${pick(firstNames)} ${lastName}`);
        setVal('motherOccupation', pick(occupations));
        setVal('motherRace', 'ไทย');
        setVal('motherNationality', 'ไทย');
        setVal('motherReligion', 'พุทธ');
        setVal('motherAthleteLevel', '');
        setVal('motherSport', '');
        setVal('motherHeight', String(randNum(155, 170)));

        // Address
        setVal('address', `${randNum(1, 999)}/${randNum(1, 99)}`);
        setVal('village', String(randNum(1, 15)));
        setVal('road', ['สุขุมวิท', 'พหลโยธิน', 'รามคำแหง', 'ลาดพร้าว', 'พัทยา'][randNum(0, 4)]);
        setVal('subDistrict', 'แสนสุข');
        setVal('district', `เมือง${province}`);
        setVal('province', province);
        setVal('postalCode', String(randNum(20000, 29999)));
        setVal('phone', `08${randNum(10000000, 99999999)}`);

        // Education
        setEducationLevel(age < 15 ? 'primary' : 'secondary');
        setVal('currentYear', String(randNum(1, 6)));
        setVal('schoolName', `โรงเรียนบ้านสวน${pick(lastNames)}`);
        setVal('schoolSubDistrict', 'บ้านสวน');
        setVal('schoolDistrict', 'เมือง');
        setVal('schoolProvince', province);
        setVal('schoolPostalCode', String(randNum(20000, 29999)));

        // Application
        setVal('appliedLevel', age < 15 ? 'ประถมศึกษาปีที่ 6' : 'มัธยมศึกษาปีที่ 4');
        setVal('sportType', sport);
        setVal('sportCode', `SP${randNum(10, 99)}`);

        // Documents
        setCheck('hasEducationCert', true);
        setVal('educationCertCount', '1');
        setCheck('hasHouseReg', true);
        setVal('houseRegCount', '1');
        setCheck('hasIdCard', true);
        setVal('idCardCount', '1');

        Swal.fire({
            icon: 'info',
            title: 'กรอกข้อมูลตัวอย่างแล้ว',
            text: `สร้างข้อมูล: ${prefix}${firstName} ${lastName} (${sport})`,
            timer: 1500,
            showConfirmButton: false
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData(e.target);
            formData.append('gender', gender);
            formData.append('currentEducation', educationLevel);

            let url = "/api/registration";
            let method = "POST";

            // If editing, use PUT to update
            if (editData && editData.id) {
                url = "/api/applicants/update";
                method = "POST"; // Use POST for FormData, the API will handle the update
                formData.append('id', editData.id);
            }

            const response = await fetch(url, {
                method: method,
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                Swal.fire({
                    title: "บันทึกข้อมูลสำเร็จ",
                    html: `<div class="text-sm text-slate-600 mt-2">เลขที่ใบสมัครของคุณคือ</div><div class="text-3xl font-bold text-red-600 mt-2">${result.data.applicationNumber}</div>`,
                    icon: "success",
                    confirmButtonText: "ตกลง",
                    confirmButtonColor: "#dc2626", // red-600
                }).then(() => {
                    formRef.current.reset();
                    setPreviewImage(null);
                    setGender("");
                    setEducationLevel("");
                    if (onSuccess) onSuccess();
                });
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการลงทะเบียน:", error);
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: error.message || "ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
                icon: "error",
                confirmButtonColor: "#dc2626",
            });
        } finally {
            setIsSubmitting(false);
        }
    };



    const handlePrint = (applicant) => {
        printApplicationForm(applicant);
    };

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8 animate-fade-in no-scrollbar pb-12 relative">

            {/* Top Action Bar */}
            <div className="flex justify-end mb-4">
                <Link
                    href="/search"
                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all text-slate-700 dark:text-slate-200 font-medium group"
                >
                    <Search size={18} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                    <span>ค้นหา / พิมพ์ใบสมัคร</span>
                </Link>
            </div>

            {/* Header / School Selection */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 md:p-8 relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-12 lg:col-span-9 space-y-4 order-2 lg:order-1">
                        <div className="flex justify-end md:justify-start">
                            <FormInput label="เลขที่สมัครสอบ" name="examApplicationNumber" placeholder="XX-XXXX" className="w-full md:w-64" />
                        </div>
                        <div className="flex flex-col md:flex-row gap-4">
                            <FormInput label="เพื่อเข้าศึกษาในโรงเรียนกีฬาวัด" name="targetSchool" placeholder="ระบุชื่อจังหวัดของโรงเรียนกีฬา" className="flex-grow" />
                            <FormInput label="รหัส" name="schoolCode" placeholder="ระบุรหัส" className="w-full md:w-32" />
                        </div>
                    </div>
                    <div className="md:col-span-12 lg:col-span-3 flex justify-center lg:justify-end order-1 lg:order-2">
                        <div className="relative group cursor-pointer w-32 h-40 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800 hover:border-red-400 transition-all">
                            <input type="file" name="photo" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                            {previewImage ? (
                                <Image src={previewImage} alt="Preview" fill className="object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-1">
                                    <Upload size={20} />
                                    <span className="text-[10px]">รูปถ่าย 1 นิ้ว</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Applicant Info */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                <SectionHeader icon={User} title="ข้อมูลผู้สมัคร" color="red" />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-4">
                    <div className="md:col-span-6 lg:col-span-4">
                        <FormInput label="ชื่อผู้สมัคร (ชื่อ-นามสกุล)" name="name" required />
                    </div>
                    <div className="md:col-span-6 lg:col-span-4">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">เพศ</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setGender("male")}
                                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${gender === 'male' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                ชาย
                            </button>
                            <button
                                type="button"
                                onClick={() => setGender("female")}
                                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${gender === 'female' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                หญิง
                            </button>
                        </div>
                    </div>
                    <div className="md:col-span-2 lg:col-span-2">
                        <FormInput label="อายุ" name="age" type="number" />
                    </div>
                    <div className="md:col-span-4 lg:col-span-4">
                        <FormInput label="วันเกิด" name="birthdate" type="date" />
                    </div>
                    <div className="md:col-span-4 lg:col-span-3">
                        <FormInput label="เชื้อชาติ" name="race" />
                    </div>
                    <div className="md:col-span-4 lg:col-span-3">
                        <FormInput label="สัญชาติ" name="nationality" />
                    </div>
                    <div className="md:col-span-4 lg:col-span-3">
                        <FormInput label="ศาสนา" name="religion" />
                    </div>
                    <div className="md:col-span-6 lg:col-span-2">
                        <FormInput label="ส่วนสูง (ซม.)" name="height" type="number" />
                    </div>
                    <div className="md:col-span-6 lg:col-span-2">
                        <FormInput label="น้ำหนัก (กก.)" name="weight" type="number" />
                    </div>
                </div>
            </div>

            {/* Father Info */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                <SectionHeader icon={Activity} title="ข้อมูลบิดา" color="blue" />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-4">
                    <div className="md:col-span-6 lg:col-span-4">
                        <FormInput label="บิดาชื่อ - สกุล" name="fatherName" />
                    </div>
                    <div className="md:col-span-6 lg:col-span-4">
                        <FormInput label="อาชีพ" name="fatherOccupation" />
                    </div>
                    <div className="md:col-span-4 lg:col-span-3">
                        <FormInput label="เชื้อชาติ" name="fatherRace" />
                    </div>
                    <div className="md:col-span-4 lg:col-span-3">
                        <FormInput label="สัญชาติ" name="fatherNationality" />
                    </div>
                    <div className="md:col-span-4 lg:col-span-3">
                        <FormInput label="ศาสนา" name="fatherReligion" />
                    </div>
                    <div className="md:col-span-12 border-t border-slate-100 dark:border-slate-800 pt-3 mt-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">ประวัติทางกีฬา</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormInput label="เคยเป็นนักกีฬาระดับ" name="fatherAthleteLevel" placeholder="เช่น จังหวัด/เขต (ถ้ามี)" />
                            <FormInput label="ชนิดกีฬา" name="fatherSport" placeholder="ระบุชนิดกีฬา" />
                            <FormInput label="ส่วนสูง (ซม.)" name="fatherHeight" type="number" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mother Info */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                <SectionHeader icon={Activity} title="ข้อมูลมารดา" color="pink" />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-4">
                    <div className="md:col-span-6 lg:col-span-4">
                        <FormInput label="มารดาชื่อ - สกุล" name="motherName" />
                    </div>
                    <div className="md:col-span-6 lg:col-span-4">
                        <FormInput label="อาชีพ" name="motherOccupation" />
                    </div>
                    <div className="md:col-span-4 lg:col-span-3">
                        <FormInput label="เชื้อชาติ" name="motherRace" />
                    </div>
                    <div className="md:col-span-4 lg:col-span-3">
                        <FormInput label="สัญชาติ" name="motherNationality" />
                    </div>
                    <div className="md:col-span-4 lg:col-span-3">
                        <FormInput label="ศาสนา" name="motherReligion" />
                    </div>
                    <div className="md:col-span-12 border-t border-slate-100 dark:border-slate-800 pt-3 mt-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">ประวัติทางกีฬา</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormInput label="เคยเป็นนักกีฬาระดับ" name="motherAthleteLevel" placeholder="เช่น จังหวัด/เขต (ถ้ามี)" />
                            <FormInput label="ชนิดกีฬา" name="motherSport" placeholder="ระบุชนิดกีฬา" />
                            <FormInput label="ส่วนสูง (ซม.)" name="motherHeight" type="number" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Address */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                <SectionHeader icon={MapPin} title="ที่อยู่ที่ติดต่อได้สะดวก" color="green" />
                <div className="grid grid-cols-2 lg:grid-cols-12 gap-4">
                    <div className="col-span-1 lg:col-span-2"><FormInput label="บ้านเลขที่" name="address" /></div>
                    <div className="col-span-1 lg:col-span-2"><FormInput label="หมู่ที่" name="village" /></div>
                    <div className="col-span-2 lg:col-span-4"><FormInput label="ถนน" name="road" /></div>
                    <div className="col-span-2 lg:col-span-4"><FormInput label="ตำบล" name="subDistrict" /></div>
                    <div className="col-span-2 lg:col-span-4"><FormInput label="อำเภอ" name="district" /></div>
                    <div className="col-span-2 lg:col-span-4"><FormInput label="จังหวัด" name="province" /></div>
                    <div className="col-span-2 lg:col-span-4 flex gap-4">
                        <FormInput label="รหัสไปรษณีย์" name="postalCode" className="flex-1" />
                        <FormInput label="โทรศัพท์" name="phone" className="flex-1" />
                    </div>
                </div>
            </div>

            {/* Current Education */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                <SectionHeader icon={Award} title={`สถานภาพทางการศึกษาในปีการศึกษา ${new Date().getFullYear() + 543}`} color="orange" />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-4">
                    <div className="md:col-span-12 space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">กำลังศึกษาในชั้น</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setEducationLevel("primary")}
                                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${educationLevel === 'primary' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                ประถมศึกษา
                            </button>
                            <button
                                type="button"
                                onClick={() => setEducationLevel("secondary")}
                                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${educationLevel === 'secondary' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                มัธยมศึกษา
                            </button>
                        </div>
                    </div>

                    <div className="md:col-span-3 lg:col-span-2">
                        <FormInput label="ปีที่" name="currentYear" />
                    </div>
                    <div className="md:col-span-9 lg:col-span-10">
                        <FormInput label="โรงเรียน" name="schoolName" />
                    </div>

                    <div className="md:col-span-6 lg:col-span-3">
                        <FormInput label="ตำบล" name="schoolSubDistrict" />
                    </div>
                    <div className="md:col-span-6 lg:col-span-3">
                        <FormInput label="อำเภอ" name="schoolDistrict" />
                    </div>
                    <div className="md:col-span-6 lg:col-span-3">
                        <FormInput label="จังหวัด" name="schoolProvince" />
                    </div>
                    <div className="md:col-span-6 lg:col-span-3">
                        <FormInput label="รหัสไปรษณีย์" name="schoolPostalCode" />
                    </div>

                    <div className="md:col-span-12 border-t border-slate-100 pt-3 mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-12 lg:col-span-5"><FormInput label="สมัครเข้าศึกษาต่อในชั้น" name="appliedLevel" /></div>
                            <div className="md:col-span-8 lg:col-span-5"><FormInput label="ชนิดกีฬา" name="sportType" /></div>
                            <div className="md:col-span-4 lg:col-span-2"><FormInput label="รหัส" name="sportCode" /></div>
                        </div>
                    </div>
                </div>
            </div>



            {/* Documents Checklist & Upload */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                <SectionHeader icon={FileText} title="หลักฐานการสมัคร" color="purple" />
                <div className="grid grid-cols-1 gap-4">
                    {[
                        { label: 'หลักฐานการศึกษา (ปพ.1)', name: 'hasEducationCert', count: 'educationCertCount', file: 'educationCertFile' },
                        { label: 'ทะเบียนบ้าน', name: 'hasHouseReg', count: 'houseRegCount', file: 'houseRegFile' },
                        { label: 'บัตรประจำตัวประชาชนหรือสูติบัตร', name: 'hasIdCard', count: 'idCardCount', file: 'idCardFile' },
                        { label: 'เกียรติบัตรแสดงความสามารถทางการกีฬา', name: 'hasAthleteCert', count: 'athleteCertCount', file: 'athleteCertFile' },
                        { label: 'หลักฐานการเปลี่ยนชื่อ - สกุล', name: 'hasNameChange', count: 'nameChangeCount', file: 'nameChangeFile' },
                        { label: 'เอกสารประกอบการสมัครอื่นๆ (ระบุ)', name: 'hasOtherDocs', count: 'otherDocsCount', file: 'otherDocsFile', hasDetail: true }
                    ].map((item, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                            {/* Left: Checkbox + Label */}
                            <div className="flex items-center gap-3 flex-grow">
                                <input
                                    type="checkbox"
                                    name={item.name}
                                    defaultChecked={editData ? editData[item.name] : false}
                                    className="peer w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 shrink-0"
                                />
                                <div className="flex-grow">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                                    {item.hasDetail && <input type="text" name="otherDocsDesc" defaultValue={editData?.otherDocsDesc} className="mt-1 block w-full border-b border-slate-300 dark:border-slate-600 dark:bg-transparent dark:text-white focus:border-purple-500 focus:outline-none px-2 text-sm" placeholder="ระบุชื่อเอกสาร..." />}
                                </div>
                            </div>

                            {/* Right: File Input + Count - close together, left on mobile, right on desktop */}
                            <div className="flex flex-row items-center gap-1 shrink-0 mt-2 md:mt-0 md:justify-end">
                                <input
                                    type="file"
                                    name={item.file}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleFileChange(e, item.file)}
                                    className="block max-w-[200px] text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-slate-800 dark:file:text-slate-300 transition-all truncate"
                                />
                                {selectedFiles[item.file] && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFile(item.file)}
                                        className="p-0.5 text-slate-400 hover:text-red-500 rounded-full transition-all shrink-0"
                                        title="ลบไฟล์"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                )}
                                <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">จำนวน</span>
                                <input type="number" name={item.count} defaultValue={1} className="w-12 text-center rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-1 py-0.5 text-sm focus:ring-2 focus:ring-purple-500" />
                                <span className="text-sm text-slate-500 dark:text-slate-400">ฉบับ</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Submit Button */}
            <div className="pt-10 border-t border-slate-100 dark:border-slate-800 mt-10">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`group relative w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg transition-all duration-500
                        ${isSubmitting
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'gradient-red text-white hover:scale-[1.02] shadow-xl shadow-red-500/25 hover:shadow-red-500/40 active:scale-95'
                        }`}
                >
                    {isSubmitting ? (
                        <RefreshCw className="animate-spin" size={24} />
                    ) : (
                        <Save size={24} className="group-hover:rotate-12 transition-transform" />
                    )}
                    <span>{editData ? 'บันทึกการแก้ไขข้อมูล' : 'ยืนยันการส่งใบสมัคร'}</span>
                </button>
            </div>

        </form >
    );
}
