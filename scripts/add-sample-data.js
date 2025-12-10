// Script to add sample data to the database
const mysql = require('mysql2/promise');

async function addSampleData() {
    const db = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'nextjs_login'
    });

    console.log('Connected to database');

    // 1. Add Departments (5 total)
    const departments = [
        'คอมพิวเตอร์ธุรกิจ', 'ช่างยนต์', 'ช่างไฟฟ้า', 'บัญชี', 'การตลาด'
    ];
    for (const name of departments) {
        try {
            await db.execute('INSERT INTO departments (name) VALUES (?)', [name]);
            console.log(`Added dept: ${name}`);
        } catch (e) { console.log(`Dept exists: ${name}`); }
    }

    // Get department IDs
    const [deptRows] = await db.execute('SELECT id, name FROM departments');
    const deptMap = {};
    deptRows.forEach(d => deptMap[d.name] = d.id);

    // 2. Add Class Levels (more levels for each dept)
    const levels = ['ปวช. 1/1', 'ปวช. 1/2', 'ปวช. 2/1', 'ปวช. 2/2', 'ปวช. 3/1', 'ปวส. 1/1', 'ปวส. 2/1'];
    for (const level of levels) {
        try {
            await db.execute('INSERT INTO class_levels (name) VALUES (?)', [level]);
            console.log(`Added level: ${level}`);
        } catch (e) { /* exists */ }
    }
    const [levelRows] = await db.execute('SELECT id, name FROM class_levels');
    const levelMap = {};
    levelRows.forEach(l => levelMap[l.name] = l.id);

    // 3. Add Rooms (20 rooms)
    const roomTypes = ['lecture', 'lab', 'workshop'];
    for (let i = 1; i <= 20; i++) {
        const name = `${String(Math.floor((i - 1) / 10) + 1)}0${(i % 10) || 10}`;
        const type = roomTypes[i % 3];
        const capacity = 30 + (i % 3) * 10;
        try {
            await db.execute('INSERT INTO rooms (name, type, capacity) VALUES (?, ?, ?)', [name, type, capacity]);
            console.log(`Added room: ${name}`);
        } catch (e) { /* exists */ }
    }

    // 4. Add Subjects (30 subjects)
    const subjectData = [
        { code: '30001001', name: 'คณิตศาสตร์พื้นฐาน', credit: 3, theory: 2, practice: 2 },
        { code: '30001002', name: 'ภาษาไทยเพื่อการสื่อสาร', credit: 3, theory: 3, practice: 0 },
        { code: '30001003', name: 'ภาษาอังกฤษเพื่อการสื่อสาร', credit: 2, theory: 2, practice: 0 },
        { code: '30001004', name: 'วิทยาศาสตร์พื้นฐาน', credit: 3, theory: 2, practice: 2 },
        { code: '30001005', name: 'สังคมศึกษา', credit: 2, theory: 2, practice: 0 },
        { code: '30204001', name: 'การเขียนโปรแกรมเบื้องต้น', credit: 3, theory: 1, practice: 4 },
        { code: '30204002', name: 'ระบบฐานข้อมูล', credit: 3, theory: 2, practice: 2 },
        { code: '30204003', name: 'เครือข่ายคอมพิวเตอร์', credit: 3, theory: 2, practice: 2 },
        { code: '30204004', name: 'การออกแบบเว็บไซต์', credit: 3, theory: 1, practice: 4 },
        { code: '30204005', name: 'ระบบปฏิบัติการ', credit: 3, theory: 2, practice: 2 },
        { code: '30100001', name: 'งานเครื่องยนต์เบื้องต้น', credit: 3, theory: 1, practice: 4 },
        { code: '30100002', name: 'งานระบบส่งกำลัง', credit: 3, theory: 1, practice: 4 },
        { code: '30100003', name: 'งานระบบเบรก', credit: 2, theory: 1, practice: 2 },
        { code: '30100004', name: 'งานระบบไฟฟ้ารถยนต์', credit: 3, theory: 1, practice: 4 },
        { code: '30100005', name: 'งานซ่อมเครื่องยนต์', credit: 4, theory: 1, practice: 6 },
        { code: '30104001', name: 'วงจรไฟฟ้ากระแสตรง', credit: 3, theory: 2, practice: 2 },
        { code: '30104002', name: 'วงจรไฟฟ้ากระแสสลับ', credit: 3, theory: 2, practice: 2 },
        { code: '30104003', name: 'เครื่องวัดไฟฟ้า', credit: 2, theory: 1, practice: 2 },
        { code: '30104004', name: 'การติดตั้งไฟฟ้าในอาคาร', credit: 3, theory: 1, practice: 4 },
        { code: '30104005', name: 'อิเล็กทรอนิกส์เบื้องต้น', credit: 3, theory: 2, practice: 2 },
        { code: '30201001', name: 'การบัญชีเบื้องต้น 1', credit: 3, theory: 2, practice: 2 },
        { code: '30201002', name: 'การบัญชีเบื้องต้น 2', credit: 3, theory: 2, practice: 2 },
        { code: '30201003', name: 'การบัญชีต้นทุน', credit: 3, theory: 2, practice: 2 },
        { code: '30201004', name: 'ภาษีอากร', credit: 2, theory: 2, practice: 0 },
        { code: '30201005', name: 'การใช้โปรแกรมบัญชี', credit: 3, theory: 1, practice: 4 },
        { code: '30202001', name: 'หลักการตลาด', credit: 3, theory: 3, practice: 0 },
        { code: '30202002', name: 'การขาย', credit: 2, theory: 2, practice: 0 },
        { code: '30202003', name: 'การโฆษณา', credit: 2, theory: 2, practice: 0 },
        { code: '30202004', name: 'การตลาดดิจิทัล', credit: 3, theory: 1, practice: 4 },
        { code: '30202005', name: 'พฤติกรรมผู้บริโภค', credit: 2, theory: 2, practice: 0 },
    ];

    const deptId = deptMap['คอมพิวเตอร์ธุรกิจ'] || Object.values(deptMap)[0] || 1;
    for (const s of subjectData) {
        try {
            await db.execute(
                'INSERT INTO subjects (code, name, credit, theoryHours, practiceHours, departmentId) VALUES (?, ?, ?, ?, ?, ?)',
                [s.code, s.name, s.credit, s.theory, s.practice, deptId]
            );
            console.log(`Added subject: ${s.code}`);
        } catch (e) { console.log(`Subject exists: ${s.code}`); }
    }

    // 5. Add Teachers (20 teachers)
    const firstNames = ['สมชาย', 'สมหญิง', 'สุภาพ', 'วิชัย', 'ประสิทธิ์', 'อรุณ', 'สมศักดิ์', 'มานะ', 'วันดี', 'สุดา'];
    const lastNames = ['ใจดี', 'รักเรียน', 'มีสุข', 'สว่าง', 'เจริญ', 'พัฒนา', 'บุญมา', 'ศรีสุข', 'วงศ์ดี', 'แสนงาม'];

    for (let i = 1; i <= 20; i++) {
        const teacherId = `T${String(i).padStart(4, '0')}`;
        const name = `${firstNames[i % 10]} ${lastNames[(i + 3) % 10]}`;
        const birthYear = 1970 + (i % 25);
        const birthMonth = ((i % 12) + 1).toString().padStart(2, '0');
        const birthDate = `${birthYear}-${birthMonth}-15`;
        const room = `A${100 + i}`;
        const maxHours = 18 + (i % 6);

        try {
            await db.execute(
                'INSERT INTO teachers (teacherId, name, birthDate, officeRoom, password, maxHoursPerWeek, departmentId) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [teacherId, name, birthDate, room, teacherId, maxHours, deptId]
            );
            console.log(`Added teacher: ${teacherId}`);
        } catch (e) { console.log(`Teacher exists: ${teacherId}`); }
    }

    // 6. Add Students (50 students)
    const studentFirstNames = ['ธนา', 'พิมพ์', 'กิต', 'ศิริ', 'ชาญ', 'วิภา', 'อภิ', 'พร', 'สุ', 'ธีร'];
    const studentLastNames = ['วัฒนา', 'ศรี', 'พงษ์', 'ชัย', 'กุล', 'มณี', 'รัตน์', 'วงศ์', 'ธรรม', 'พ'];

    const levelId = levelMap['ปวช. 1/1'] || Object.values(levelMap)[0] || 1;
    for (let i = 1; i <= 50; i++) {
        const studentId = `STD${String(i).padStart(5, '0')}`;
        const name = `${studentFirstNames[i % 10]}${studentLastNames[(i + 2) % 10]}`;
        const birthYear = 2003 + (i % 5);
        const birthMonth = ((i % 12) + 1).toString().padStart(2, '0');
        const birthDay = ((i % 28) + 1).toString().padStart(2, '0');
        const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;
        const levelIdx = i % Object.keys(levelMap).length;
        const selectedLevelId = Object.values(levelMap)[levelIdx] || levelId;

        try {
            await db.execute(
                'INSERT INTO students (studentId, name, birthDate, password, departmentId, classLevelId) VALUES (?, ?, ?, ?, ?, ?)',
                [studentId, name, birthDate, studentId, deptId, selectedLevelId]
            );
            console.log(`Added student: ${studentId}`);
        } catch (e) { console.log(`Student exists: ${studentId}`); }
    }

    console.log('\n=== Sample Data Added ===');
    console.log('Departments: 5');
    console.log('Class Levels: 7');
    console.log('Rooms: 20');
    console.log('Subjects: 30');
    console.log('Teachers: 20');
    console.log('Students: 50');
    console.log('Total: 132 records');

    await db.end();
}

addSampleData().catch(console.error);
