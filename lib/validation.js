/**
 * Input Validation with Zod
 * ระบบตรวจสอบข้อมูลการสมัครเรียน
 */

import { z } from 'zod';

// Sanitize input ป้องกัน XSS
const sanitize = (str) => {
    if (!str || typeof str !== 'string') return str;
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// Thai phone number pattern (08x, 09x, 06x)
const thaiPhoneRegex = /^(0[689]\d{8}|0\d{9})$/;

// Postal code pattern (5 digits)
const postalCodeRegex = /^\d{5}$/;

// Registration Schema
export const registrationSchema = z.object({
    // Personal Info (Required)
    name: z.string()
        .min(2, 'กรุณากรอกชื่อ-นามสกุล (อย่างน้อย 2 ตัวอักษร)')
        .max(100, 'ชื่อยาวเกินไป (สูงสุด 100 ตัวอักษร)')
        .transform(sanitize),

    gender: z.enum(['male', 'female'], {
        errorMap: () => ({ message: 'กรุณาเลือกเพศ (ชาย หรือ หญิง)' })
    }),

    sportType: z.string()
        .min(1, 'กรุณาระบุชนิดกีฬา')
        .max(100, 'ชนิดกีฬายาวเกินไป')
        .transform(sanitize),

    // Personal Info (Optional but validated)
    age: z.preprocess(
        (val) => (val === '' || val === null) ? undefined : Number(val),
        z.number()
            .int('อายุต้องเป็นจำนวนเต็ม')
            .min(5, 'อายุต้องมากกว่า 5 ปี')
            .max(50, 'อายุต้องน้อยกว่า 50 ปี')
            .optional()
    ),

    height: z.preprocess(
        (val) => (val === '' || val === null) ? undefined : Number(val),
        z.number()
            .min(50, 'ส่วนสูงต้องมากกว่า 50 ซม.')
            .max(250, 'ส่วนสูงต้องน้อยกว่า 250 ซม.')
            .optional()
    ),

    weight: z.preprocess(
        (val) => (val === '' || val === null) ? undefined : Number(val),
        z.number()
            .min(10, 'น้ำหนักต้องมากกว่า 10 กก.')
            .max(200, 'น้ำหนักต้องน้อยกว่า 200 กก.')
            .optional()
    ),

    phone: z.string()
        .regex(thaiPhoneRegex, 'เบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0812345678)')
        .optional()
        .or(z.literal('')),

    postalCode: z.string()
        .regex(postalCodeRegex, 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก')
        .optional()
        .or(z.literal('')),

    schoolPostalCode: z.string()
        .regex(postalCodeRegex, 'รหัสไปรษณีย์โรงเรียนต้องเป็นตัวเลข 5 หลัก')
        .optional()
        .or(z.literal('')),

    // Text fields with sanitization
    examApplicationNumber: z.string().max(50).transform(sanitize).optional().or(z.literal('')),
    targetSchool: z.string().max(255).transform(sanitize).optional().or(z.literal('')),
    schoolCode: z.string().max(50).transform(sanitize).optional().or(z.literal('')),
    race: z.string().max(100).transform(sanitize).optional().or(z.literal('')),
    nationality: z.string().max(100).transform(sanitize).optional().or(z.literal('')),
    religion: z.string().max(100).transform(sanitize).optional().or(z.literal('')),

    // Father info
    fatherName: z.string().max(255).transform(sanitize).optional().or(z.literal('')),
    fatherOccupation: z.string().max(255).transform(sanitize).optional().or(z.literal('')),
    fatherRace: z.string().max(100).transform(sanitize).optional().or(z.literal('')),
    fatherNationality: z.string().max(100).transform(sanitize).optional().or(z.literal('')),
    fatherReligion: z.string().max(100).transform(sanitize).optional().or(z.literal('')),
    fatherAthleteLevel: z.string().max(255).transform(sanitize).optional().or(z.literal('')),
    fatherSport: z.string().max(100).transform(sanitize).optional().or(z.literal('')),
    fatherHeight: z.preprocess(
        (val) => (val === '' || val === null) ? undefined : Number(val),
        z.number().min(50).max(250).optional()
    ),
    fatherWeight: z.preprocess(
        (val) => (val === '' || val === null) ? undefined : Number(val),
        z.number().min(10).max(200).optional()
    ),

    // Mother info
    motherName: z.string().max(255).transform(sanitize).optional().or(z.literal('')),
    motherOccupation: z.string().max(255).transform(sanitize).optional().or(z.literal('')),
    motherRace: z.string().max(100).transform(sanitize).optional().or(z.literal('')),
    motherNationality: z.string().max(100).transform(sanitize).optional().or(z.literal('')),
    motherReligion: z.string().max(100).transform(sanitize).optional().or(z.literal('')),
    motherAthleteLevel: z.string().max(255).transform(sanitize).optional().or(z.literal('')),
    motherSport: z.string().max(100).transform(sanitize).optional().or(z.literal('')),
    motherHeight: z.preprocess(
        (val) => (val === '' || val === null) ? undefined : Number(val),
        z.number().min(50).max(250).optional()
    ),
    motherWeight: z.preprocess(
        (val) => (val === '' || val === null) ? undefined : Number(val),
        z.number().min(10).max(200).optional()
    ),

    // Address
    address: z.string().max(255).transform(sanitize).optional().or(z.literal('')),
    village: z.string().max(50).transform(sanitize).optional().or(z.literal('')),
    road: z.string().max(100).transform(sanitize).optional().or(z.literal('')),
    subDistrict: z.string().max(100).transform(sanitize).optional().or(z.literal('')),
    district: z.string().max(100).transform(sanitize).optional().or(z.literal('')),
    province: z.string().max(100).transform(sanitize).optional().or(z.literal('')),

    // Education
    currentEducation: z.string().max(50).transform(sanitize).optional().or(z.literal('')),
    currentYear: z.string().max(20).transform(sanitize).optional().or(z.literal('')),
    schoolName: z.string().max(255).transform(sanitize).optional().or(z.literal('')),
    schoolSubDistrict: z.string().max(100).transform(sanitize).optional().or(z.literal('')),
    schoolDistrict: z.string().max(100).transform(sanitize).optional().or(z.literal('')),
    schoolProvince: z.string().max(100).transform(sanitize).optional().or(z.literal('')),

    // Application
    sportCode: z.string().max(50).transform(sanitize).optional().or(z.literal('')),
    appliedLevel: z.string().max(50).transform(sanitize).optional().or(z.literal('')),

    // Documents
    otherDocsDesc: z.string().max(255).transform(sanitize).optional().or(z.literal('')),
}).passthrough(); // Allow additional fields

/**
 * Validate registration data
 * @param {Object} data - Form data to validate
 * @returns {{ success: boolean, data?: Object, errors?: string[] }}
 */
export function validateRegistration(data) {
    try {
        const validated = registrationSchema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = error.errors.map(e => e.message);
            return { success: false, errors };
        }
        return { success: false, errors: ['เกิดข้อผิดพลาดในการตรวจสอบข้อมูล'] };
    }
}

/**
 * Sanitize all string values in an object
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
export function sanitizeObject(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            result[key] = sanitize(value);
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            result[key] = sanitizeObject(value);
        } else {
            result[key] = value;
        }
    }
    return result;
}
