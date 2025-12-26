/**
 * File Upload Validation
 * ระบบตรวจสอบไฟล์อัพโหลด ป้องกัน Malicious File Upload
 */

// Allowed file types with their magic bytes (file signatures)
const FILE_SIGNATURES = {
    // Images
    'image/jpeg': [
        [0xFF, 0xD8, 0xFF, 0xE0],
        [0xFF, 0xD8, 0xFF, 0xE1],
        [0xFF, 0xD8, 0xFF, 0xE2],
        [0xFF, 0xD8, 0xFF, 0xDB],
        [0xFF, 0xD8, 0xFF, 0xEE],
    ],
    'image/png': [
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
    ],
    // PDF
    'application/pdf': [
        [0x25, 0x50, 0x44, 0x46] // %PDF
    ],
};

// Allowed extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

// Max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Max filename length
const MAX_FILENAME_LENGTH = 200;

/**
 * Check if file extension is allowed
 * @param {string} filename - File name
 * @returns {boolean}
 */
function isAllowedExtension(filename) {
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
    return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Check magic bytes to verify actual file type
 * @param {ArrayBuffer} buffer - File buffer
 * @returns {string|null} - Detected MIME type or null
 */
function detectMimeType(buffer) {
    const bytes = new Uint8Array(buffer);

    for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
        for (const signature of signatures) {
            let match = true;
            for (let i = 0; i < signature.length; i++) {
                if (bytes[i] !== signature[i]) {
                    match = false;
                    break;
                }
            }
            if (match) return mimeType;
        }
    }
    return null;
}

/**
 * Sanitize filename - remove dangerous characters
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export function sanitizeFilename(filename) {
    // Remove path traversal attempts
    let safe = filename.replace(/\.\.\//g, '').replace(/\.\./g, '');

    // Only allow alphanumeric, Thai chars, dots, hyphens, underscores
    safe = safe.replace(/[^a-zA-Z0-9\u0E00-\u0E7F._-]/g, '_');

    // Prevent multiple dots (except one for extension)
    const parts = safe.split('.');
    if (parts.length > 2) {
        safe = parts.slice(0, -1).join('_') + '.' + parts[parts.length - 1];
    }

    // Limit length
    if (safe.length > MAX_FILENAME_LENGTH) {
        const ext = safe.slice(safe.lastIndexOf('.'));
        safe = safe.slice(0, MAX_FILENAME_LENGTH - ext.length) + ext;
    }

    return safe;
}

/**
 * Validate uploaded file
 * @param {File} file - File object from FormData
 * @param {Object} options - Validation options
 * @returns {Promise<{ valid: boolean, error?: string, mimeType?: string }>}
 */
export async function validateFile(file, options = {}) {
    const {
        maxSize = MAX_FILE_SIZE,
        allowedExtensions = ALLOWED_EXTENSIONS,
        checkMimeType = true,
    } = options;

    // Check if file exists
    if (!file || !file.name) {
        return { valid: false, error: 'ไม่พบไฟล์' };
    }

    // Check file size
    if (file.size > maxSize) {
        const maxMB = (maxSize / 1024 / 1024).toFixed(1);
        return { valid: false, error: `ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${maxMB}MB)` };
    }

    // Check file size is not 0
    if (file.size === 0) {
        return { valid: false, error: 'ไฟล์ว่างเปล่า' };
    }

    // Check extension
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(ext)) {
        return {
            valid: false,
            error: `ประเภทไฟล์ไม่ถูกต้อง (อนุญาตเฉพาะ ${allowedExtensions.join(', ')})`
        };
    }

    // Check magic bytes (actual file type)
    if (checkMimeType) {
        try {
            const buffer = await file.arrayBuffer();
            const detectedType = detectMimeType(buffer);

            if (!detectedType) {
                return { valid: false, error: 'ไม่สามารถระบุประเภทไฟล์ได้ กรุณาใช้ไฟล์ JPG, PNG หรือ PDF' };
            }

            // Extra check: extension should match detected type
            const expectedTypes = {
                '.jpg': ['image/jpeg'],
                '.jpeg': ['image/jpeg'],
                '.png': ['image/png'],
                '.pdf': ['application/pdf'],
            };

            if (!expectedTypes[ext]?.includes(detectedType)) {
                return {
                    valid: false,
                    error: 'นามสกุลไฟล์ไม่ตรงกับเนื้อหาจริง กรุณาอัพโหลดไฟล์ที่ถูกต้อง'
                };
            }

            return { valid: true, mimeType: detectedType };
        } catch (error) {
            return { valid: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบไฟล์' };
        }
    }

    return { valid: true };
}

/**
 * Validate multiple files
 * @param {Object} files - Object with fieldName: File pairs
 * @param {Object} options - Validation options
 * @returns {Promise<{ valid: boolean, errors?: Object }>}
 */
export async function validateFiles(files, options = {}) {
    const errors = {};

    for (const [fieldName, file] of Object.entries(files)) {
        if (file && file.size > 0) {
            const result = await validateFile(file, options);
            if (!result.valid) {
                errors[fieldName] = result.error;
            }
        }
    }

    if (Object.keys(errors).length > 0) {
        return { valid: false, errors };
    }

    return { valid: true };
}

/**
 * Configuration exports
 */
export const FILE_CONFIG = {
    MAX_FILE_SIZE,
    MAX_FILENAME_LENGTH,
    ALLOWED_EXTENSIONS,
};
