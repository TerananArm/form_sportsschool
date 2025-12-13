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
                sql = 'UPDATE students SET name=?, birthDate=?, departmentId=?, updatedAt=? WHERE id=?';
                params = [v(data.name), v(data.birthdate), deptIdStd, new Date(), id];
                break;

            case 'teachers':
                const deptIdTch = await getDeptId(data.department);

                // Parse unavailable_times from text format (e.g. "จันทร์:1,2 พุธ:7,8,9") to JSON
                let unavailableTimesJson = null;
                if (data.unavailable_times) {
                    if (typeof data.unavailable_times === 'string') {
                        const dayMap = { 'จันทร์': 1, 'อังคาร': 2, 'พุธ': 3, 'พฤหัสบดี': 4, 'ศุกร์': 5 };
                        const parts = data.unavailable_times.trim().split(/\s+/);
                        const parsed = [];
                        for (const part of parts) {
                            const [dayName, periodsStr] = part.split(':');
                            const dayNum = dayMap[dayName];
                            if (dayNum && periodsStr) {
                                const periods = periodsStr.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
                                if (periods.length > 0) parsed.push({ day: dayNum, periods });
                            }
                        }
                        unavailableTimesJson = parsed.length > 0 ? JSON.stringify(parsed) : null;
                    } else {
                        unavailableTimesJson = JSON.stringify(data.unavailable_times);
                    }
                }

                sql = 'UPDATE teachers SET name=?, departmentId=?, officeRoom=?, maxHoursPerWeek=?, birthDate=?, unavailableTimes=?, updatedAt=? WHERE id=?';
                params = [v(data.name), deptIdTch, v(data.room), v(data.max_hours), v(data.birthdate), unavailableTimesJson, new Date(), id];
                break;

            case 'subjects':
                const deptIdSub = await getDeptId(data.department);
                sql = 'UPDATE subjects SET name=?, departmentId=?, credit=?, theoryHours=?, practiceHours=?, updatedAt=? WHERE code=?';
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