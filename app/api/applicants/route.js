import { NextResponse } from "next/server";
import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

export async function GET(request) {
    try {
        const applicants = await prisma.applicant.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ success: true, data: applicants });
    } catch (error) {
        console.error("Error fetching applicants:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้สมัคร" },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, status, name, sportType, schoolName, phone } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "ไม่พบรหัสผู้สมัคร (ID)" }, { status: 400 });
        }

        // Build update data dynamically
        const updateData = {};
        if (status !== undefined) updateData.status = status;
        if (name !== undefined) updateData.name = name;
        if (sportType !== undefined) updateData.sportType = sportType;
        if (schoolName !== undefined) updateData.schoolName = schoolName;
        if (phone !== undefined) updateData.phone = phone;

        const updated = await prisma.applicant.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating applicant:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        // Check for bulk delete (JSON body with ids array)
        const contentType = request.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            const { ids } = await request.json();
            if (ids && Array.isArray(ids) && ids.length > 0) {
                await prisma.applicant.deleteMany({
                    where: { id: { in: ids.map(id => parseInt(id)) } }
                });
                return NextResponse.json({ success: true, message: `ลบข้อมูล ${ids.length} รายการเรียบร้อยแล้ว` });
            }
        }

        // Single delete via query param
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "ไม่พบรหัสผู้สมัคร (ID)" }, { status: 400 });
        }

        await prisma.applicant.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true, message: "ลบข้อมูลสำเร็จ" });
    } catch (error) {
        console.error("Error deleting applicant:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการลบข้อมูล" },
            { status: 500 }
        );
    }
}
