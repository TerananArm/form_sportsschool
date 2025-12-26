import { NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";
import { writeFile } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const formData = await request.formData();
        const id = formData.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: "ID required" }, { status: 400 });
        }

        // Helper functions
        const getVal = (name) => {
            const val = formData.get(name);
            return (val && val !== '' && val !== 'null' && val !== 'undefined') ? val : undefined;
        };
        const getNum = (name) => {
            const val = formData.get(name);
            if (!val || val === '' || val === 'null' || val === 'undefined') return undefined;
            const num = parseInt(val);
            return isNaN(num) ? undefined : num;
        };
        const getFloat = (name) => {
            const val = formData.get(name);
            if (!val || val === '' || val === 'null' || val === 'undefined') return undefined;
            const num = parseFloat(val);
            return isNaN(num) ? undefined : num;
        };
        const getBool = (name) => {
            const val = formData.get(name);
            if (val === 'true' || val === 'on') return true;
            if (val === 'false' || val === 'off') return false;
            return undefined;
        };

        // Build update data - ONLY fields that exist in Prisma schema
        const updateData = {};

        // Personal - match schema field names exactly
        if (getVal('name')) updateData.name = getVal('name');
        if (getVal('gender')) updateData.gender = getVal('gender');
        if (getNum('age') !== undefined) updateData.age = getNum('age');
        if (getVal('birthdate')) updateData.birthdate = new Date(getVal('birthdate'));
        if (getVal('race')) updateData.race = getVal('race');
        if (getVal('nationality')) updateData.nationality = getVal('nationality');
        if (getVal('religion')) updateData.religion = getVal('religion');
        if (getFloat('height') !== undefined) updateData.height = getFloat('height');
        if (getFloat('weight') !== undefined) updateData.weight = getFloat('weight');

        // Father
        if (getVal('fatherName')) updateData.fatherName = getVal('fatherName');
        if (getVal('fatherOccupation')) updateData.fatherOccupation = getVal('fatherOccupation');
        if (getVal('fatherRace')) updateData.fatherRace = getVal('fatherRace');
        if (getVal('fatherNationality')) updateData.fatherNationality = getVal('fatherNationality');
        if (getVal('fatherReligion')) updateData.fatherReligion = getVal('fatherReligion');
        if (getVal('fatherAthleteLevel')) updateData.fatherAthleteLevel = getVal('fatherAthleteLevel');
        if (getVal('fatherSport')) updateData.fatherSport = getVal('fatherSport');
        if (getFloat('fatherHeight') !== undefined) updateData.fatherHeight = getFloat('fatherHeight');

        // Mother
        if (getVal('motherName')) updateData.motherName = getVal('motherName');
        if (getVal('motherOccupation')) updateData.motherOccupation = getVal('motherOccupation');
        if (getVal('motherRace')) updateData.motherRace = getVal('motherRace');
        if (getVal('motherNationality')) updateData.motherNationality = getVal('motherNationality');
        if (getVal('motherReligion')) updateData.motherReligion = getVal('motherReligion');
        if (getVal('motherAthleteLevel')) updateData.motherAthleteLevel = getVal('motherAthleteLevel');
        if (getVal('motherSport')) updateData.motherSport = getVal('motherSport');
        if (getFloat('motherHeight') !== undefined) updateData.motherHeight = getFloat('motherHeight');

        // Address
        if (getVal('address')) updateData.address = getVal('address');
        if (getVal('village')) updateData.village = getVal('village');
        if (getVal('road')) updateData.road = getVal('road');
        if (getVal('subDistrict')) updateData.subDistrict = getVal('subDistrict');
        if (getVal('district')) updateData.district = getVal('district');
        if (getVal('province')) updateData.province = getVal('province');
        if (getVal('postalCode')) updateData.postalCode = getVal('postalCode');
        if (getVal('phone')) updateData.phone = getVal('phone');

        // Education - use schema field names
        if (getVal('currentEducation')) updateData.currentEducation = getVal('currentEducation');
        if (getVal('currentYear')) updateData.educationYear = getVal('currentYear'); // Map form field to schema field
        if (getVal('schoolName')) updateData.schoolName = getVal('schoolName');
        if (getVal('schoolSubDistrict')) updateData.schoolSubDistrict = getVal('schoolSubDistrict');
        if (getVal('schoolDistrict')) updateData.schoolDistrict = getVal('schoolDistrict');
        if (getVal('schoolProvince')) updateData.schoolProvince = getVal('schoolProvince');
        if (getVal('schoolPostalCode')) updateData.schoolPostalCode = getVal('schoolPostalCode');

        // Application - use schema field names
        if (getVal('sportType')) updateData.sportType = getVal('sportType');
        if (getVal('sportCode')) updateData.sportCode = getVal('sportCode');
        if (getVal('appliedLevel')) updateData.appliedLevel = getVal('appliedLevel');
        if (getVal('status')) updateData.status = getVal('status');

        // Documents - use schema field names
        if (getBool('hasEducationCert') !== undefined) updateData.hasEducationCert = getBool('hasEducationCert');
        if (getNum('educationCertCount') !== undefined) updateData.educationCertCount = getNum('educationCertCount');
        if (getBool('hasHouseReg') !== undefined) updateData.hasHouseReg = getBool('hasHouseReg');
        if (getNum('houseRegCount') !== undefined) updateData.houseRegCount = getNum('houseRegCount');
        if (getBool('hasIdCard') !== undefined) updateData.hasIdCard = getBool('hasIdCard');
        if (getNum('idCardCount') !== undefined) updateData.idCardCount = getNum('idCardCount');
        if (getBool('hasNameChangeCert') !== undefined) updateData.hasNameChangeCert = getBool('hasNameChangeCert');
        if (getNum('nameChangeCertCount') !== undefined) updateData.nameChangeCertCount = getNum('nameChangeCertCount');
        // Map form field names to schema field names for other docs
        if (getBool('hasOtherDoc') !== undefined) updateData.hasOtherDocs = getBool('hasOtherDoc');
        if (getVal('otherDocDetail')) updateData.otherDocsDesc = getVal('otherDocDetail');
        if (getNum('otherDocCount') !== undefined) updateData.otherDocsCount = getNum('otherDocCount');

        // Handle photo upload if provided
        const photo = formData.get('photo');
        if (photo && photo instanceof Blob && photo.size > 0) {
            try {
                const bytes = await photo.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const fileName = `${Date.now()}-${photo.name}`;
                const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                const filePath = path.join(uploadDir, fileName);
                await writeFile(filePath, buffer);
                updateData.photoPath = `/uploads/${fileName}`;
            } catch (fileError) {
                console.error("File upload error:", fileError);
            }
        }

        console.log('Update data:', updateData);

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, message: "No data to update" }, { status: 400 });
        }

        const updated = await prisma.applicant.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        return NextResponse.json({ success: true, data: updated, message: 'อัปเดตข้อมูลสำเร็จ' });
    } catch (error) {
        console.error("Error updating applicant:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Error updating applicant" },
            { status: 500 }
        );
    }
}
