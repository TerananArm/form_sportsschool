import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAction } from '@/lib/logger';

export async function PUT(request) {
    try {
        const { type, data, id } = await request.json(); // id is the identifier (old value)

        // Helper: แปลง undefined เป็น null
        const v = (val) => (val === undefined ? null : val);

        // Helper: หา Department ID
        const getDeptId = async (deptName) => {
            if (!deptName || deptName.startsWith('--')) return null;
            const [rows] = await db.execute('SELECT id FROM departments WHERE name = ?', [deptName]);
            return rows.length > 0 ? rows[0].id : null;
        };

        let sql = '';
        let params = [];

        switch (type) {
            case 'students':
                const deptIdStd = await getDeptId(data.department);
                // Use studentId for WHERE clause if possible, or try to be smart.
                // Assuming 'id' passed in is the OLD studentId.
                sql = 'UPDATE students SET studentId=?, name=?, birthDate=?, departmentId=?, updatedAt=? WHERE studentId=?';
                params = [v(data.id), v(data.name), v(data.birthdate), deptIdStd, new Date(), id];
                break;

            case 'teachers':
                const deptIdTch = await getDeptId(data.department);
                // Assuming 'id' passed in is the OLD teacherId.
                sql = 'UPDATE teachers SET teacherId=?, name=?, departmentId=?, officeRoom=?, maxHoursPerWeek=?, birthDate=?, updatedAt=? WHERE teacherId=?';
                params = [v(data.id), v(data.name), deptIdTch, v(data.room), v(data.max_hours), v(data.birthdate), new Date(), id];
                break;

            case 'subjects':
                const deptIdSub = await getDeptId(data.department);
                // Get teacherId from teacher name
                let teacherIdSub = null;
                if (data.teacher && !data.teacher.startsWith('--')) {
                    const [teacherRows] = await db.execute('SELECT id FROM teachers WHERE name = ?', [data.teacher]);
                    if (teacherRows.length > 0) teacherIdSub = teacherRows[0].id;
                }
                sql = 'UPDATE subjects SET code=?, name=?, departmentId=?, teacherId=?, credit=?, theoryHours=?, practiceHours=?, updatedAt=? WHERE code=?';
                params = [v(data.code), v(data.name), deptIdSub, teacherIdSub, v(data.credit), v(data.theory), v(data.practice), new Date(), id];
                break;

            case 'rooms':
                sql = 'UPDATE rooms SET name=?, type=?, capacity=?, updatedAt=? WHERE name=?';
                params = [v(data.name), v(data.type), v(data.capacity), new Date(), id];
                break;

            case 'departments':
                sql = 'UPDATE departments SET name=?, updatedAt=? WHERE id=?';
                params = [v(data.name), new Date(), id];
                break;

            case 'users':
                sql = 'UPDATE users SET name=?, role=?, updatedAt=? WHERE username=?';
                params = [v(data.name), 'admin', new Date(), id];
                break;

            case 'levels':
            case 'class_levels':
                const deptVal = data.department || data.department_name;
                const deptIdLvl = await getDeptId(deptVal);
                sql = 'UPDATE class_levels SET name=?, departmentId=?, updatedAt=? WHERE id=?';
                params = [v(data.level), deptIdLvl, new Date(), id];
                break;

            default:
                return NextResponse.json({ message: 'ไม่รองรับข้อมูลประเภทนี้' }, { status: 400 });
        }

        // 3. ตรวจสอบ ID (ต้องไม่เป็น undefined)
        if (id === undefined) {
            return NextResponse.json({ message: 'ไม่พบ ID สำหรับอัปเดต' }, { status: 400 });
        }

        const [result] = await db.execute(sql, params);

        if (result.affectedRows === 0) {
            // Fallback: This might happen if 'id' was actually the PK (int) but we searched by string ID.
            // But for now, let's assume valid string IDs.
            return NextResponse.json({ message: 'ไม่พบข้อมูลที่ต้องการอัปเดต หรือข้อมูลไม่มีการเปลี่ยนแปลง' }, { status: 404 });
        }

        return NextResponse.json({ message: 'อัปเดตข้อมูลสำเร็จ' });

        // Audit Log
        try {
            await logAction({
                action: 'UPDATE',
                resource: type,
                resourceId: String(id),
                details: `Updated ${type} ID: ${id}`,
                performedBy: 'Admin'
            });
        } catch (e) { console.error("Audit log error", e); }

        return NextResponse.json({ message: 'อัปเดตข้อมูลสำเร็จ' });

    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาด: ' + error.message }, { status: 500 });
    }
}