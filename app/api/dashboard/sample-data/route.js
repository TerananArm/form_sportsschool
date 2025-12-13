// app/api/dashboard/sample-data/route.js
// Generate Sample Data for Demo/Testing
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
    try {
        // 1. Create Departments
        const departments = [
            { name: 'เทคโนโลยีสารสนเทศ' },
            { name: 'การบัญชี' },
            { name: 'ช่างยนต์' }
        ];

        for (const dept of departments) {
            await db.execute(
                'INSERT IGNORE INTO departments (id, name, updatedAt) VALUES (UUID(), ?, NOW())',
                [dept.name]
            );
        }

        // Get inserted department IDs
        const [deptRows] = await db.execute('SELECT id, name FROM departments');
        const deptMap = {};
        deptRows.forEach(d => deptMap[d.name] = d.id);

        // 2. Create Rooms
        const rooms = [
            { name: 'ห้อง 101', type: 'lecture', capacity: 40 },
            { name: 'ห้อง 102', type: 'lecture', capacity: 35 },
            { name: 'Lab คอม 1', type: 'lab', capacity: 30 },
            { name: 'Lab คอม 2', type: 'lab', capacity: 30 },
            { name: 'ห้องปฏิบัติการยนต์', type: 'workshop', capacity: 20 }
        ];

        for (const room of rooms) {
            await db.execute(
                'INSERT IGNORE INTO rooms (id, name, type, capacity, updatedAt) VALUES (UUID(), ?, ?, ?, NOW())',
                [room.name, room.type, room.capacity]
            );
        }

        // 3. Create Class Levels
        const levels = ['ปวช.1', 'ปวช.2', 'ปวช.3', 'ปวส.1', 'ปวส.2'];
        for (const level of levels) {
            for (const deptName of Object.keys(deptMap)) {
                await db.execute(
                    'INSERT IGNORE INTO class_levels (id, name, departmentId, updatedAt) VALUES (UUID(), ?, ?, NOW())',
                    [level, deptMap[deptName]]
                );
            }
        }

        // 4. Create Teachers with Unavailable Times
        const teacherData = [
            { id: 'T001', name: 'อ.สมชาย ใจดี', dept: 'เทคโนโลยีสารสนเทศ', room: 'ห้องพัก IT', maxHours: 20, unavailable: [{ day: 1, periods: [1, 2] }] },
            { id: 'T002', name: 'อ.สมหญิง รักเรียน', dept: 'เทคโนโลยีสารสนเทศ', room: 'ห้องพัก IT', maxHours: 18, unavailable: [{ day: 3, periods: [7, 8, 9] }] },
            { id: 'T003', name: 'อ.วิชัย คำนวณ', dept: 'การบัญชี', room: 'ห้องพักบัญชี', maxHours: 20, unavailable: [] },
            { id: 'T004', name: 'อ.นิตยา บัญชีการ', dept: 'การบัญชี', room: 'ห้องพักบัญชี', maxHours: 16, unavailable: [{ day: 5, periods: [1, 2, 3, 4] }] },
            { id: 'T005', name: 'อ.ประยุทธ ช่างยนต์', dept: 'ช่างยนต์', room: 'โรงงาน', maxHours: 24, unavailable: [] },
            { id: 'T006', name: 'อ.สมศักดิ์ เครื่องกล', dept: 'ช่างยนต์', room: 'โรงงาน', maxHours: 20, unavailable: [{ day: 2, periods: [6, 7] }] },
            { id: 'T007', name: 'อ.พิมพ์ใจ โปรแกรม', dept: 'เทคโนโลยีสารสนเทศ', room: 'Lab คอม', maxHours: 18, unavailable: [] },
            { id: 'T008', name: 'อ.ธนา ระบบ', dept: 'เทคโนโลยีสารสนเทศ', room: 'Lab คอม', maxHours: 20, unavailable: [{ day: 4, periods: [1, 2] }] },
            { id: 'T009', name: 'อ.ศิริ ภาษีการ', dept: 'การบัญชี', room: 'ห้องพักบัญชี', maxHours: 16, unavailable: [] },
            { id: 'T010', name: 'อ.วรรณา สถิตย์', dept: 'การบัญชี', room: 'ห้องพักบัญชี', maxHours: 18, unavailable: [{ day: 1, periods: [7, 8, 9] }] }
        ];

        for (const t of teacherData) {
            await db.execute(
                `INSERT IGNORE INTO teachers (id, teacherId, name, departmentId, officeRoom, maxHoursPerWeek, unavailableTimes, password, updatedAt) 
                 VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [t.id, t.name, deptMap[t.dept], t.room, t.maxHours, JSON.stringify(t.unavailable), t.id]
            );
        }

        // 5. Create Subjects
        const subjects = [
            { code: '2204-2001', name: 'คอมพิวเตอร์และการบำรุงรักษา', dept: 'เทคโนโลยีสารสนเทศ', credit: 3, theory: 2, practice: 2 },
            { code: '2204-2002', name: 'ระบบปฏิบัติการ', dept: 'เทคโนโลยีสารสนเทศ', credit: 3, theory: 2, practice: 2 },
            { code: '2204-2003', name: 'การเขียนโปรแกรม', dept: 'เทคโนโลยีสารสนเทศ', credit: 3, theory: 1, practice: 4 },
            { code: '2204-2004', name: 'เครือข่ายคอมพิวเตอร์', dept: 'เทคโนโลยีสารสนเทศ', credit: 3, theory: 2, practice: 2 },
            { code: '2204-2005', name: 'การพัฒนาเว็บไซต์', dept: 'เทคโนโลยีสารสนเทศ', credit: 3, theory: 1, practice: 4 },
            { code: '2201-2001', name: 'การบัญชีเบื้องต้น', dept: 'การบัญชี', credit: 3, theory: 3, practice: 0 },
            { code: '2201-2002', name: 'การบัญชีชั้นกลาง', dept: 'การบัญชี', credit: 3, theory: 3, practice: 0 },
            { code: '2201-2003', name: 'ภาษีเงินได้', dept: 'การบัญชี', credit: 2, theory: 2, practice: 0 },
            { code: '2201-2004', name: 'การใช้โปรแกรมบัญชี', dept: 'การบัญชี', credit: 3, theory: 1, practice: 4 },
            { code: '2101-2001', name: 'งานเครื่องยนต์เบื้องต้น', dept: 'ช่างยนต์', credit: 3, theory: 1, practice: 4 },
            { code: '2101-2002', name: 'งานไฟฟ้ายานยนต์', dept: 'ช่างยนต์', credit: 3, theory: 1, practice: 4 },
            { code: '2101-2003', name: 'งานเครื่องล่าง', dept: 'ช่างยนต์', credit: 3, theory: 1, practice: 4 },
            { code: '3000-0101', name: 'ภาษาไทยเพื่อการสื่อสาร', dept: 'เทคโนโลยีสารสนเทศ', credit: 3, theory: 3, practice: 0 },
            { code: '3000-0102', name: 'ภาษาอังกฤษเพื่อการสื่อสาร', dept: 'เทคโนโลยีสารสนเทศ', credit: 2, theory: 2, practice: 0 },
            { code: '3000-0103', name: 'คณิตศาสตร์พื้นฐาน', dept: 'การบัญชี', credit: 2, theory: 2, practice: 0 }
        ];

        for (const s of subjects) {
            await db.execute(
                `INSERT IGNORE INTO subjects (id, code, name, departmentId, credit, theoryHours, practiceHours, updatedAt) 
                 VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW())`,
                [s.code, s.name, deptMap[s.dept], s.credit, s.theory, s.practice]
            );
        }

        // 6. Create Sample Students (50)
        const studentNames = [
            'สมชาย', 'สมหญิง', 'วิชัย', 'นิตยา', 'ประยุทธ', 'สมศักดิ์', 'พิมพ์ใจ', 'ธนา', 'ศิริ', 'วรรณา',
            'กิตติ', 'มานี', 'ชูใจ', 'ดวงใจ', 'เอกชัย', 'วีระ', 'สุดา', 'ปราณี', 'ชาติ', 'ดารา',
            'ไพบูลย์', 'สุรีย์', 'ประสิทธิ์', 'พรพิมล', 'วิทยา', 'สุภาพร', 'ชาตรี', 'อรุณ', 'ประทีป', 'รัตนา',
            'ศักดิ์', 'สุกัญญา', 'อนุสรณ์', 'ทิพย์', 'สันติ', 'มณี', 'เกียรติ', 'นงนุช', 'ประเสริฐ', 'อุทัย',
            'วิรัตน์', 'สุพรรณี', 'เสมอ', 'บุญมี', 'สุวรรณ', 'พรทิพย์', 'ประพันธ์', 'รัชนี', 'ชาญ', 'ดาวเรือง'
        ];
        const surnames = ['ใจดี', 'รักเรียน', 'คิดดี', 'มานะ', 'ขยัน', 'พากเพียร', 'รุ่งเรือง', 'มั่งมี', 'สุขใจ', 'เจริญ'];

        // Get class levels
        const [classLevels] = await db.execute('SELECT id, name, departmentId FROM class_levels');

        let studentId = 670001;
        for (let i = 0; i < 50; i++) {
            const name = `${studentNames[i % studentNames.length]} ${surnames[i % surnames.length]}`;
            const classLevel = classLevels[i % classLevels.length];
            await db.execute(
                `INSERT IGNORE INTO students (id, studentId, name, departmentId, classLevelId, password, updatedAt) 
                 VALUES (UUID(), ?, ?, ?, ?, '1234', NOW())`,
                [String(studentId++), name, classLevel.departmentId, classLevel.id]
            );
        }

        // 7. Create Admin User
        await db.execute(
            `INSERT IGNORE INTO users (username, name, password, role, updatedAt) 
             VALUES ('admin', 'ผู้ดูแลระบบ', '1234', 'admin', NOW())`
        );

        return NextResponse.json({
            message: 'โหลดข้อมูลตัวอย่างสำเร็จ!',
            created: {
                departments: departments.length,
                rooms: rooms.length,
                levels: levels.length * departments.length,
                teachers: teacherData.length,
                subjects: subjects.length,
                students: 50
            }
        });

    } catch (error) {
        console.error("Sample Data Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
