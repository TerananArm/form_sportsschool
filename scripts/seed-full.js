const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nextjs_login'
    });

    try {
        console.log('🗑️  Cleaning database...');

        // Disable FK checks to allow truncation
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        const tables = [
            'schedule', 'class_subjects', 'subjects', 'students',
            'class_levels', 'teachers', 'rooms', 'departments', 'users'
        ];

        for (const table of tables) {
            await connection.execute(`TRUNCATE TABLE ${table}`);
        }

        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Database cleaned.');

        // --- 1. Departments ---
        console.log('🌱 Seeding Departments...');
        const departments = [
            { id: 'dept_it', name: 'เทคโนโลยีสารสนเทศ' },
            { id: 'dept_ac', name: 'การบัญชี' },
            { id: 'dept_mk', name: 'การตลาด' },
            { id: 'dept_el', name: 'อิเล็กทรอนิกส์' },
            { id: 'dept_ge', name: 'สามัญสัมพันธ์' }
        ];
        for (const d of departments) {
            await connection.execute('INSERT INTO departments (id, name) VALUES (?, ?)', [d.id, d.name]);
        }

        // --- 2. Rooms ---
        console.log('🌱 Seeding Rooms...');
        const rooms = [
            { name: '3201', type: 'Lab', capacity: 40 },
            { name: '3202', type: 'Lab', capacity: 40 },
            { name: '4101', type: 'Lecture', capacity: 50 },
            { name: '4102', type: 'Lecture', capacity: 50 },
            { name: '5201', type: 'Workshop', capacity: 30 },
            { name: '1101', type: 'Meeting', capacity: 20 }
        ];
        for (const r of rooms) {
            await connection.execute('INSERT INTO rooms (id, name, type, capacity) VALUES (UUID(), ?, ?, ?)', [r.name, r.type, r.capacity]);
        }
        // Get room IDs for later
        const [roomRows] = await connection.execute('SELECT id, name FROM rooms');
        const roomMap = roomRows.reduce((acc, r) => ({ ...acc, [r.name]: r.id }), {});

        // --- 3. Users ---
        console.log('🌱 Seeding Users...');
        const hashedPassword = await bcrypt.hash('123456', 10);
        await connection.execute(
            'INSERT INTO users (username, name, password, role) VALUES (?, ?, ?, ?)',
            ['admin', 'ผู้ดูแลระบบสูงสุด', hashedPassword, 'admin']
        );

        // --- 4. Teachers ---
        console.log('🌱 Seeding Teachers...');
        const teachers = [
            { id: 'T001', name: 'สมชาย ใจดี', email: 'somchai@test.com', dept: 'dept_it', room: '3201', birth: '1980-05-15' },
            { id: 'T002', name: 'สมหญิง รักเรียน', email: 'somying@test.com', dept: 'dept_it', room: '3202', birth: '1985-08-20' },
            { id: 'T003', name: 'วิชัย เก่งกาจ', email: 'wichai@test.com', dept: 'dept_el', room: '5201', birth: '1978-12-10' },
            { id: 'T004', name: 'มานี มีตา', email: 'manee@test.com', dept: 'dept_ac', room: '4101', birth: '1982-03-25' },
            { id: 'T005', name: 'ปิติ พอใจ', email: 'piti@test.com', dept: 'dept_ge', room: '1101', birth: '1975-11-30' },
            { id: 'T006', name: 'ชูใจ ใฝ่รู้', email: 'chujai@test.com', dept: 'dept_mk', room: '4102', birth: '1988-07-14' }
        ];

        const teacherMap = {}; // name -> id

        for (const t of teachers) {
            // Format birthdate to DDMMYYYY for password
            const [year, month, day] = t.birth.split('-');
            const passwordRaw = `${day}${month}${year}`;
            const passwordHash = await bcrypt.hash(passwordRaw, 10);

            await connection.execute(
                'INSERT INTO teachers (id, name, email, department_id, room, password, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [t.id, t.name, t.email, t.dept, t.room, passwordHash, t.birth]
            );
            teacherMap[t.name] = t.id;
        }

        // --- 5. Class Levels ---
        console.log('🌱 Seeding Class Levels...');
        const levels = [
            { name: 'ปวช. 1/1', dept: 'dept_it' },
            { name: 'ปวช. 2/1', dept: 'dept_it' },
            { name: 'ปวช. 3/1', dept: 'dept_it' },
            { name: 'ปวส. 1/1', dept: 'dept_it' },
            { name: 'ปวช. 1/1', dept: 'dept_ac' }, // Same name, diff dept
            { name: 'ปวช. 1/1', dept: 'dept_mk' }  // Same name, diff dept
        ];

        const levelMap = {}; // name -> id

        for (const l of levels) {
            await connection.execute(
                'INSERT INTO class_levels (id, name, department_id) VALUES (UUID(), ?, ?)',
                [l.name, l.dept]
            );
            const [rows] = await connection.execute('SELECT id FROM class_levels WHERE name = ?', [l.name]);
            levelMap[l.name] = rows[0].id;
        }

        // --- 6. Students ---
        console.log('🌱 Seeding Students...');
        // Add 5 students to 'ปวช. 1/1'
        for (let i = 1; i <= 5; i++) {
            const birthDate = `2005-${String(i).padStart(2, '0')}-15`;
            // Format birthdate to DDMMYYYY for password (e.g., 15012005)
            const passwordRaw = `15${String(i).padStart(2, '0')}2005`;
            const passwordHash = await bcrypt.hash(passwordRaw, 10);

            await connection.execute(
                'INSERT INTO students (id, name, level, department_id, password, birthdate) VALUES (?, ?, ?, ?, ?, ?)',
                [`66000${i}`, `นักเรียน ${i}`, 'ปวช. 1/1', 'dept_it', passwordHash, birthDate]
            );
        }

        // --- 7. Subjects ---
        console.log('🌱 Seeding Subjects...');
        const subjects = [
            { code: '3000-0001', name: 'คณิตศาสตร์พื้นฐาน', credit: 2, theory: 2, practice: 0, dept: 'dept_ge', teacher: 'ปิติ พอใจ' },
            { code: '3000-0002', name: 'ภาษาอังกฤษในชีวิตจริง', credit: 2, theory: 1, practice: 2, dept: 'dept_ge', teacher: 'ปิติ พอใจ' },
            { code: '3204-2001', name: 'ระบบฐานข้อมูล', credit: 3, theory: 2, practice: 2, dept: 'dept_it', teacher: 'สมชาย ใจดี' },
            { code: '3204-2002', name: 'การเขียนโปรแกรมเว็บ', credit: 3, theory: 2, practice: 2, dept: 'dept_it', teacher: 'สมหญิง รักเรียน' },
            { code: '3204-2003', name: 'เครือข่ายคอมพิวเตอร์', credit: 3, theory: 2, practice: 2, dept: 'dept_it', teacher: 'สมชาย ใจดี' },
            { code: '3200-0001', name: 'บัญชีเบื้องต้น', credit: 3, theory: 2, practice: 2, dept: 'dept_ac', teacher: 'มานี มีตา' }
        ];

        const subjectMap = {}; // code -> id

        for (const s of subjects) {
            const teacherId = teacherMap[s.teacher];
            await connection.execute(
                'INSERT INTO subjects (id, code, name, credit, theory_hours, practice_hours, department_id, teacherId) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)',
                [s.code, s.name, s.credit, s.theory, s.practice, s.dept, teacherId]
            );
            const [rows] = await connection.execute('SELECT id FROM subjects WHERE code = ?', [s.code]);
            subjectMap[s.code] = rows[0].id;
        }

        // --- 8. Curriculum (Class Subjects) ---
        console.log('🌱 Seeding Curriculum...');
        // Enroll IT subjects to 'ปวช. 1/1'
        const itLevelId = levelMap['ปวช. 1/1'];
        const itSubjects = ['3000-0001', '3000-0002', '3204-2001', '3204-2002', '3204-2003'];

        for (const code of itSubjects) {
            const subjectId = subjectMap[code];
            await connection.execute(
                'INSERT INTO class_subjects (id, class_level_id, subject_id, department) VALUES (UUID(), ?, ?, ?)',
                [itLevelId, subjectId, 'dept_it']
            );
        }

        // --- 9. Schedule ---
        console.log('🌱 Seeding Schedule...');
        const term = '2/2568';
        const scheduleItems = [
            { day: 1, start: 1, end: 2, code: '3000-0001', room: '4101' }, // Mon 08:00-10:00 Math
            { day: 1, start: 3, end: 5, code: '3204-2001', room: '3201' }, // Mon 10:00-13:00 DB
            { day: 2, start: 1, end: 4, code: '3204-2002', room: '3202' }, // Tue 08:00-12:00 Web
            { day: 3, start: 1, end: 4, code: '3204-2003', room: '3201' }, // Wed 08:00-12:00 Network
            { day: 4, start: 1, end: 3, code: '3000-0002', room: '1101' }  // Thu 08:00-11:00 English
        ];

        for (const item of scheduleItems) {
            const subjectId = subjectMap[item.code];
            const roomId = roomMap[item.room];
            // Find teacher from subject
            const [subjRows] = await connection.execute('SELECT teacherId FROM subjects WHERE id = ?', [subjectId]);
            const teacherId = subjRows[0].teacherId;

            await connection.execute(
                `INSERT INTO schedule (id, term, day_of_week, start_period, end_period, subject_id, teacher_id, room_id, class_level_id, class_level)
                 VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [term, item.day, item.start, item.end, subjectId, teacherId, roomId, itLevelId, 'ปวช. 1/1']
            );
        }

        console.log('✨ Database Reset & Seed Complete!');

    } catch (error) {
        console.error('❌ Seed failed:', error);
    } finally {
        await connection.end();
    }
}

main();
