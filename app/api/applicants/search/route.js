import { NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";

const prisma = new PrismaClient();

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query");

        if (!query) {
            return NextResponse.json({ success: false, message: "กรุณาระบุคำค้นหา" }, { status: 400 });
        }

        const applicants = await prisma.applicant.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { applicationNumber: { contains: query } }
                ]
            },
            select: {
                id: true,
                applicationNumber: true,
                examApplicationNumber: true,
                targetSchool: true,
                schoolCode: true,
                name: true,
                gender: true,
                age: true,
                birthdate: true,
                race: true,
                nationality: true,
                religion: true,
                height: true,
                weight: true,
                fatherName: true,
                fatherOccupation: true,
                fatherRace: true,
                fatherNationality: true,
                fatherReligion: true,
                fatherAthleteLevel: true,
                fatherSport: true,
                fatherHeight: true,
                motherName: true,
                motherOccupation: true,
                motherRace: true,
                motherNationality: true,
                motherReligion: true,
                motherAthleteLevel: true,
                motherSport: true,
                motherHeight: true,
                address: true,
                village: true,
                road: true,
                subDistrict: true,
                district: true,
                province: true,
                postalCode: true,
                phone: true,
                currentEducation: true,
                educationYear: true,
                schoolName: true,
                schoolSubDistrict: true,
                schoolDistrict: true,
                schoolProvince: true,
                schoolPostalCode: true,
                appliedLevel: true,
                sportType: true,
                sportCode: true,
                photoPath: true,
                status: true,
                createdAt: true,
                // Include specific counts/booleans for print
                educationCertCount: true,
                houseRegCount: true,
                idCardCount: true,
                athleteCertCount: true,
                nameChangeCertCount: true,
                otherDocsCount: true,
                otherDocsDesc: true,
            },
            take: 20 // Limit results
        });

        return NextResponse.json({ success: true, data: applicants });
    } catch (error) {
        console.error("Error searching applicants:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการค้นหาข้อมูล" },
            { status: 500 }
        );
    }
}
