import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request) {
    try {
        const { type, data, id } = await request.json(); // id คือรหัสเดิม (ก่อนแก้)

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
                sql = 'UPDATE students SET name=?, birthdate=?, department_id=?, level=?, updatedAt=? WHERE id=?';
                params = [v(data.name), v(data.birthdate), deptIdStd, v(data.level), new Date(), id];
                break;

            case 'teachers':
                const deptIdTch = await getDeptId(data.department);
                sql = 'UPDATE teachers SET name=?, department_id=?, room=?, max_hours=?, birthdate=?, updatedAt=? WHERE id=?';
                params = [v(data.name), deptIdTch, v(data.room), v(data.max_hours), v(data.birthdate), new Date(), id];
                break;

            case 'subjects':
                const deptIdSub = await getDeptId(data.department);
                sql = 'UPDATE subjects SET name=?, department_id=?, credit=?, theory_hours=?, practice_hours=?, updatedAt=? WHERE code=?';
                params = [v(data.name), deptIdSub, v(data.credit), v(data.theory), v(data.practice), new Date(), id];
                break;

            case 'rooms':
                sql = 'UPDATE rooms SET type=?, capacity=?, updatedAt=? WHERE name=?';
                params = [v(data.type), v(data.capacity), new Date(), id];
                break;

            case 'departments':
                sql = 'UPDATE departments SET name=?, updatedAt=? WHERE id=?';
                params = [v(data.name), new Date(), id];
                break;

            case 'users':
                sql = 'UPDATE users SET name=?, role=?, updatedAt=? WHERE username=?';
                params = [v(data.name), 'admin', new Date(), id];
                break;

            default:
                return NextResponse.json({ message: 'ไม่รองรับข้อมูลประเภทนี้' }, { status: 400 });
        }

        // 3. ตรวจสอบ ID (ต้องไม่เป็น undefined)
        if (id === undefined) {
            return NextResponse.json({ message: 'ไม่พบ ID สำหรับอัปเดต' }, { status: 400 });
        }

        await db.execute(sql, params);
        return NextResponse.json({ message: 'อัปเดตข้อมูลสำเร็จ' });

    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาด: ' + error.message }, { status: 500 });
    }
}