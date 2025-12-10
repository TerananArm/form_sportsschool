import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request) {
    try {
        const { type, data, force } = await request.json(); // รับ parameter 'force' เพิ่ม

        // Helper: แปลง undefined เป็น null
        const v = (val) => (val === undefined ? null : val);

        // Helper: หา Department ID
        const getDeptId = async (deptName) => {
            if (!deptName || deptName.startsWith('--')) return null;
            const [rows] = await db.execute('SELECT id FROM departments WHERE name = ?', [deptName]);
            return rows.length > 0 ? rows[0].id : null;
        };

        let checkSql = '';
        let checkParams = [];
        let insertSql = '';
        let insertParams = [];

        // Helper: หา ClassLevel ID
        const getClassLevelId = async (levelName) => {
            if (!levelName || levelName.startsWith('--')) return null;
            const [rows] = await db.execute('SELECT id FROM class_levels WHERE name = ?', [levelName]);
            return rows.length > 0 ? rows[0].id : null;
        };

        switch (type) {
            case 'students': {
                // DB columns: studentId, name, birthDate, password, departmentId, classLevelId, updatedAt
                checkSql = 'SELECT id FROM students WHERE studentId = ?';
                checkParams = [v(data.id)];
                const deptIdStd = await getDeptId(data.department);
                const classLevelIdStd = await getClassLevelId(data.level);
                // Use default dept=1 and classLevel=1 if not found
                insertSql = 'INSERT INTO students (studentId, name, birthDate, password, departmentId, classLevelId, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)';
                insertParams = [v(data.id), v(data.name), v(data.birthdate) || null, v(data.password) || '1234', deptIdStd || 1, classLevelIdStd || 1, new Date()];
                break;
            }

            case 'teachers': {
                // DB columns: teacherId, name, birthDate, officeRoom, password, maxHoursPerWeek, departmentId, updatedAt
                checkSql = 'SELECT id FROM teachers WHERE teacherId = ?';
                checkParams = [v(data.id)];
                const deptIdTch = await getDeptId(data.department);
                // Use default dept=1 if not found
                insertSql = 'INSERT INTO teachers (teacherId, name, birthDate, officeRoom, password, maxHoursPerWeek, departmentId, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                insertParams = [v(data.id), v(data.name), v(data.birthdate) || null, v(data.room) || null, v(data.password) || v(data.id), v(data.max_hours) || 20, deptIdTch || 1, new Date()];
                break;
            }

            case 'subjects': {
                // DB columns: code, name, credit, theoryHours, practiceHours, departmentId, updatedAt
                checkSql = 'SELECT id FROM subjects WHERE code = ?';
                checkParams = [v(data.code)];
                const deptIdSub = await getDeptId(data.department);
                insertSql = 'INSERT INTO subjects (code, name, credit, theoryHours, practiceHours, departmentId, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)';
                insertParams = [v(data.code), v(data.name), v(data.credit) || 3, v(data.theory) || 0, v(data.practice) || 0, deptIdSub, new Date()];
                break;
            }

            case 'rooms':
                checkSql = 'SELECT id FROM rooms WHERE name = ?';
                checkParams = [v(data.name)];
                insertSql = 'INSERT INTO rooms (name, type, capacity, updatedAt) VALUES (?, ?, ?, ?)';
                insertParams = [v(data.name), v(data.type) || 'lecture', v(data.capacity) || 40, new Date()];
                break;

            case 'departments':
                checkSql = 'SELECT id FROM departments WHERE name = ?';
                checkParams = [v(data.name)];
                insertSql = 'INSERT INTO departments (name, updatedAt) VALUES (?, ?)';
                insertParams = [v(data.name), new Date()];
                break;

            case 'users':
                checkSql = 'SELECT id FROM users WHERE username = ?';
                checkParams = [v(data.username)];
                insertSql = 'INSERT INTO users (username, name, password, role, updatedAt) VALUES (?, ?, ?, ?, ?)';
                insertParams = [v(data.username), v(data.name), v(data.password), 'admin', new Date()];
                break;

            case 'class_levels':
                const deptIdLevel = await getDeptId(data.department_name);
                checkSql = 'SELECT id FROM class_levels WHERE name = ? AND department_id = ?';
                checkParams = [v(data.level), deptIdLevel];
                insertSql = 'INSERT INTO class_levels (id, name, department_id, updatedAt) VALUES (UUID(), ?, ?, ?)';
                insertParams = [v(data.level), deptIdLevel, new Date()];
                break;

            default:
                return NextResponse.json({ message: 'ไม่รองรับข้อมูลประเภทนี้' }, { status: 400 });
        }

        // 1. ตรวจสอบข้อมูลซ้ำ (ถ้าไม่ได้ส่ง force=true มา)
        if (checkSql && !force) {
            if (checkParams.some(p => p === undefined || p === null)) {
                return NextResponse.json({ message: 'ข้อมูลสำคัญไม่ครบถ้วน' }, { status: 400 });
            }
            const [existing] = await db.execute(checkSql, checkParams);
            if (existing.length > 0) {
                // ส่ง status 409 (Conflict) เพื่อให้ Frontend รู้ว่าซ้ำ
                return NextResponse.json({ message: `ข้อมูลซ้ำ: ${checkParams[0]} มีอยู่ในระบบแล้ว` }, { status: 409 });
            }
        }

        // 2. บันทึกข้อมูล
        const finalParams = insertParams.map(p => (p === undefined ? null : p));
        await db.execute(insertSql, finalParams);

        return NextResponse.json({ message: 'บันทึกข้อมูลสำเร็จเรียบร้อย' }, { status: 200 });

    } catch (error) {
        // ดัก Error Duplicate Key ของ SQL โดยตรงด้วย
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ message: 'ข้อมูลซ้ำในระบบ' }, { status: 409 });
        }
        console.error("Add Data Error:", error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาด: ' + error.message }, { status: 500 });
    }
}