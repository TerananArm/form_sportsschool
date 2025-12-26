import { NextResponse } from "next/server";
import { PrismaClient } from "../../generated/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Security utilities
import { checkRateLimit, getClientIP } from "@/lib/rateLimit";
import { validateRegistration } from "@/lib/validation";
import { validateFile, sanitizeFilename, FILE_CONFIG } from "@/lib/fileValidation";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // === SECURITY: Rate Limiting ===
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP, 'registration');

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, message: rateLimitResult.message },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }

    const formData = await request.formData();
    const data = {};
    let photoPath = null;

    // === SECURITY: Input Validation ===
    // Extract fields for validation first
    const rawData = {
      name: formData.get("name"),
      gender: formData.get("gender"),
      sportType: formData.get("sportType"),
      age: formData.get("age"),
      height: formData.get("height"),
      weight: formData.get("weight"),
      phone: formData.get("phone"),
      postalCode: formData.get("postalCode"),
      schoolPostalCode: formData.get("schoolPostalCode"),
      examApplicationNumber: formData.get("examApplicationNumber"),
      targetSchool: formData.get("targetSchool"),
      schoolCode: formData.get("schoolCode"),
      race: formData.get("race"),
      nationality: formData.get("nationality"),
      religion: formData.get("religion"),
      fatherName: formData.get("fatherName"),
      motherName: formData.get("motherName"),
      address: formData.get("address"),
      province: formData.get("province"),
    };

    const validationResult = validateRegistration(rawData);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: validationResult.errors.join(', '),
          errors: validationResult.errors
        },
        { status: 400 }
      );
    }

    // Helper to safely parse numbers
    const parseNumber = (value) => {
      if (!value || value === "") return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    // Helper to safely parse integers
    const parseIntSafe = (value) => {
      if (!value || value === "") return null;
      const parsed = parseInt(value);
      return isNaN(parsed) ? null : parsed;
    };

    // Helper to parse boolean from string/checkbox
    const parseBoolean = (value) => {
      return value === "true" || value === "on" || value === "1";
    };

    // === SECURITY: File Validation ===
    const file = formData.get("photo");
    if (file && file.size > 0) {
      // Validate file before processing
      const fileValidation = await validateFile(file, {
        maxSize: FILE_CONFIG.MAX_FILE_SIZE,
        allowedExtensions: ['.jpg', '.jpeg', '.png'],
        checkMimeType: true
      });

      if (!fileValidation.valid) {
        return NextResponse.json(
          { success: false, message: `รูปถ่าย: ${fileValidation.error}` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Sanitize filename
      const safeFilename = sanitizeFilename(file.name);
      const filename = `applicant-${uuidv4()}${path.extname(safeFilename)}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/applicants");
      const filepath = path.join(uploadDir, filename);

      // Ensure directory exists
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (e) { /* Directory may already exist */ }

      await writeFile(filepath, buffer);
      photoPath = `/uploads/applicants/${filename}`;
    }

    // Extract other fields
    // Header Info
    data.examApplicationNumber = formData.get("examApplicationNumber");
    data.targetSchool = formData.get("targetSchool");
    data.schoolCode = formData.get("schoolCode");

    // Personal Info
    data.name = formData.get("name");
    data.gender = formData.get("gender");
    data.age = parseIntSafe(formData.get("age"));
    data.birthdate = formData.get("birthdate") ? new Date(formData.get("birthdate")) : null;
    data.height = parseNumber(formData.get("height"));
    data.weight = parseNumber(formData.get("weight"));
    data.nationality = formData.get("nationality");
    data.race = formData.get("race");
    data.religion = formData.get("religion");

    // Father Info
    data.fatherName = formData.get("fatherName");
    data.fatherOccupation = formData.get("fatherOccupation");
    data.fatherRace = formData.get("fatherRace");
    data.fatherNationality = formData.get("fatherNationality");
    data.fatherReligion = formData.get("fatherReligion");

    data.fatherAthleteLevel = formData.get("fatherAthleteLevel");
    data.fatherSport = formData.get("fatherSport");
    // Derive boolean from presence of data
    data.fatherIsAthlete = !!(data.fatherAthleteLevel || data.fatherSport);

    data.fatherHeight = parseNumber(formData.get("fatherHeight"));
    data.fatherWeight = parseNumber(formData.get("fatherWeight"));

    // Mother Info
    data.motherName = formData.get("motherName");
    data.motherOccupation = formData.get("motherOccupation");
    data.motherRace = formData.get("motherRace");
    data.motherNationality = formData.get("motherNationality");
    data.motherReligion = formData.get("motherReligion");

    data.motherAthleteLevel = formData.get("motherAthleteLevel");
    data.motherSport = formData.get("motherSport");
    // Derive boolean from presence of data
    data.motherIsAthlete = !!(data.motherAthleteLevel || data.motherSport);

    data.motherHeight = parseNumber(formData.get("motherHeight"));
    data.motherWeight = parseNumber(formData.get("motherWeight"));

    // Address
    data.address = formData.get("address");
    data.village = formData.get("village");
    data.road = formData.get("road");
    data.subDistrict = formData.get("subDistrict");
    data.district = formData.get("district");
    data.province = formData.get("province");
    data.postalCode = formData.get("postalCode");
    data.phone = formData.get("phone");

    // Education
    data.currentEducation = formData.get("currentEducation");
    data.educationYear = formData.get("currentYear");
    data.schoolName = formData.get("schoolName");
    data.schoolSubDistrict = formData.get("schoolSubDistrict");
    data.schoolDistrict = formData.get("schoolDistrict");
    data.schoolProvince = formData.get("schoolProvince");
    data.schoolPostalCode = formData.get("schoolPostalCode");

    // Application
    data.sportType = formData.get("sportType");
    data.sportCode = formData.get("sportCode");
    data.appliedLevel = formData.get("appliedLevel");

    // Documents Helper with file validation
    const processFile = async (fieldName, prefix) => {
      const file = formData.get(fieldName);
      if (file && file.size > 0) {
        // === SECURITY: Validate document file ===
        const fileValidation = await validateFile(file, {
          maxSize: FILE_CONFIG.MAX_FILE_SIZE,
          allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
          checkMimeType: true
        });

        if (!fileValidation.valid) {
          console.warn(`File validation failed for ${fieldName}: ${fileValidation.error}`);
          return null; // Skip invalid files silently
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitize filename
        const safeFilename = sanitizeFilename(file.name);
        const filename = `${prefix}-${uuidv4()}${path.extname(safeFilename)}`;
        const uploadDir = path.join(process.cwd(), "public/uploads/documents");

        // Ensure directory exists
        try {
          await mkdir(uploadDir, { recursive: true });
        } catch (e) { /* Directory may already exist */ }

        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);
        return `/uploads/documents/${filename}`;
      }
      return null;
    };

    // Process Documents
    // Education Cert
    data.hasEducationCert = parseBoolean(formData.get("hasEducationCert")); // Keep boolean for backward compat or just logic
    data.educationCertPath = await processFile("educationCertFile", "educert");
    // If file uploaded, force boolean true
    if (data.educationCertPath) data.hasEducationCert = true;

    // House Reg
    data.hasHouseReg = parseBoolean(formData.get("hasHouseReg"));
    data.houseRegPath = await processFile("houseRegFile", "housereg");
    if (data.houseRegPath) data.hasHouseReg = true;

    // ID Card
    data.hasIdCard = parseBoolean(formData.get("hasIdCard"));
    data.idCardPath = await processFile("idCardFile", "idcard");
    if (data.idCardPath) data.hasIdCard = true;

    // Athlete Cert
    data.hasAthleteCert = parseBoolean(formData.get("hasAthleteCert"));
    data.athleteCertPath = await processFile("athleteCertFile", "athletecert");
    if (data.athleteCertPath) data.hasAthleteCert = true;

    // Name Change
    data.hasNameChangeCert = parseBoolean(formData.get("hasNameChange"));
    data.nameChangeCertPath = await processFile("nameChangeFile", "namechange");
    if (data.nameChangeCertPath) data.hasNameChangeCert = true;

    // Other Docs
    data.hasOtherDocs = parseBoolean(formData.get("hasOtherDocs"));
    data.otherDocsDesc = formData.get("otherDocsDesc");
    data.otherDocsPath = await processFile("otherDocsFile", "otherdocs");
    if (data.otherDocsPath) data.hasOtherDocs = true;

    data.photoPath = photoPath;

    // Check for Duplicates (Name or ExamApplicationNumber)
    const existingApplicant = await prisma.applicant.findFirst({
      where: {
        OR: [
          { name: data.name },
          { examApplicationNumber: data.examApplicationNumber }
        ]
      }
    });

    if (existingApplicant) {
      // Determine what matched
      let duplicateField = existingApplicant.name === data.name ? "ชื่อนี้" : "เลขที่สมัครสอบนี้";
      return NextResponse.json(
        { success: false, message: `ข้อมูลซ้ำ: ${duplicateField} มีอยู่ในระบบแล้ว` },
        { status: 400 }
      );
    }

    // Generate Application Number (Simple logic: Year + padded ID)
    // In a real high-concurrency app, this needs a transaction or atomic counter.
    // For simplicity here:

    // We can't generate the final number until we insert mostly because we need an ID or count.
    // Let's use a temporary placeholder or a transaction. 
    // Or generate a random one and check uniqueness.

    // Generate Application Number (Year + padded ID)
    const year = new Date().getFullYear() + 543; // Thai year

    // Find the last applicant to determine the next running number
    const lastApplicant = await prisma.applicant.findFirst({
      orderBy: { id: 'desc' },
      select: { applicationNumber: true }
    });

    let nextId = 1;
    if (lastApplicant && lastApplicant.applicationNumber) {
      const parts = lastApplicant.applicationNumber.split('-');
      if (parts.length === 2 && parseInt(parts[0]) === year) {
        nextId = parseInt(parts[1]) + 1;
      }
    }

    const applicationNumber = `${year}-${String(nextId).padStart(4, '0')}`;
    data.applicationNumber = applicationNumber;

    const applicant = await prisma.applicant.create({
      data: data
    });

    return NextResponse.json({
      success: true,
      message: "สมัครเรียนสำเร็จ",
      data: {
        applicationNumber: applicant.applicationNumber,
        id: applicant.id
      }
    });

  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการสมัคร: " + error.message },
      { status: 500 }
    );
  }
}
