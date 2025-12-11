const mysql = require('mysql2/promise');

// Department IDs from previous check:
// 3: Computer Business
// 4: Mechanic
// 5: Electric
// 6: Accounting
// 7: Marketing

const COMMON_SUBJECTS = [
    { code: '20000-1101', name: 'ภาษาไทยเพื่ออาชีพ', credit: 2, t: 1, p: 2 },
    { code: '20000-1201', name: 'ภาษาอังกฤษในชีวิตจริง', credit: 2, t: 1, p: 2 },
    { code: '20000-1301', name: 'วิทยาศาสตร์เพื่อพัฒนาทักษะชีวิต', credit: 2, t: 1, p: 2 },
    { code: '20000-1401', name: 'คณิตศาสตร์พื้นฐานอาชีพ', credit: 2, t: 2, p: 0 },
    { code: '20000-1501', name: 'หน้าที่พลเมืองและศีลธรรม', credit: 2, t: 2, p: 0 },
    { code: '20000-1601', name: 'พลศึกษาเพื่อพัฒนาสุขภาพ', credit: 1, t: 0, p: 2 },
    { code: '30000-1101', name: 'ทักษะภาษาไทยเชิงวิชาชีพ', credit: 3, t: 3, p: 0 },
    { code: '30000-1201', name: 'ภาษาอังกฤษเพื่อการสื่อสาร', credit: 3, t: 3, p: 0 },
    { code: '30000-1301', name: 'วิทยาศาสตร์งานธุรกิจและบริการ', credit: 3, t: 2, p: 2 },
    { code: '30000-1401', name: 'คณิตศาสตร์และสถิติเรื่อยอาชีพ', credit: 3, t: 3, p: 0 }
];

const DEPT_SUBJECTS = {
    3: [ // Computer
        { code: '20204-2001', name: 'ระบบปฏิบัติการเบื้องต้น', credit: 3, t: 2, p: 2 },
        { code: '20204-2002', name: 'การเขียนโปรแกรมคอมพิวเตอร์', credit: 3, t: 2, p: 2 },
        { code: '20204-2003', name: 'เครือข่ายคอมพิวเตอร์เบื้องต้น', credit: 3, t: 2, p: 2 },
        { code: '20204-2004', name: 'ระบบฐานข้อมูล', credit: 3, t: 2, p: 2 },
        { code: '20204-2005', name: 'การสร้างเว็บไซต์', credit: 3, t: 2, p: 2 },
        { code: '20204-2006', name: 'โปรแกรมกราฟิก', credit: 3, t: 2, p: 2 },
        { code: '30204-2001', name: 'การวิเคราะห์และออกแบบระบบ', credit: 3, t: 2, p: 2 },
        { code: '30204-2002', name: 'การพัฒนาแอปพลิเคชันบนอุปกรณ์พกพา', credit: 3, t: 2, p: 2 },
        { code: '30204-2003', name: 'ความปลอดภัยระบบสารสนเทศ', credit: 3, t: 2, p: 2 }
    ],
    4: [ // Mechanic
        { code: '20101-2001', name: 'งานเครื่องยนต์แก๊สโซลีน', credit: 3, t: 1, p: 6 },
        { code: '20101-2002', name: 'งานเครื่องยนต์ดีเซล', credit: 3, t: 1, p: 6 },
        { code: '20101-2003', name: 'งานส่งกำลังรถยนต์', credit: 3, t: 1, p: 6 },
        { code: '20101-2004', name: 'งานไฟฟ้ารถยนต์', credit: 3, t: 1, p: 6 },
        { code: '20101-2005', name: 'งานเครื่องล่างรถยนต์', credit: 3, t: 1, p: 6 },
        { code: '30101-2001', name: 'เทคโนโลยียานยนต์สมัยใหม่', credit: 3, t: 2, p: 3 },
        { code: '30101-2002', name: 'การวิเคราะห์ปัญหายานยนต์', credit: 3, t: 2, p: 3 }
    ],
    5: [ // Electric
        { code: '20104-2001', name: 'วงจรไฟฟ้ากระแสตรง', credit: 3, t: 2, p: 3 },
        { code: '20104-2002', name: 'วงจรไฟฟ้ากระแสสลับ', credit: 3, t: 2, p: 3 },
        { code: '20104-2003', name: 'เครื่องวัดไฟฟ้า', credit: 2, t: 1, p: 3 },
        { code: '20104-2004', name: 'การติดตั้งไฟฟ้าในอาคาร', credit: 3, t: 1, p: 6 },
        { code: '20104-2005', name: 'มอเตอร์ไฟฟ้า', credit: 3, t: 2, p: 3 },
        { code: '30104-2001', name: 'การควบคุมมอเตอร์ไฟฟ้า', credit: 3, t: 2, p: 3 },
        { code: '30104-2002', name: 'โปรแกรมเมเบิลคอนโทรลเลอร์', credit: 3, t: 2, p: 3 }
    ],
    6: [ // Accounting
        { code: '20201-2001', name: 'การบัญชีเบื้องต้น', credit: 3, t: 2, p: 2 },
        { code: '20201-2002', name: 'การบัญชีตั๋วเงิน', credit: 3, t: 2, p: 2 },
        { code: '20201-2003', name: 'การบัญชีภาษีอากร', credit: 3, t: 2, p: 2 },
        { code: '20201-2004', name: 'กฎหมายพาณิชย์', credit: 2, t: 2, p: 0 },
        { code: '20201-2005', name: 'การใช้คอมพิวเตอร์ในงานบัญชี', credit: 3, t: 1, p: 4 },
        { code: '30201-2001', name: 'การบัญชีต้นทุน', credit: 3, t: 2, p: 2 },
        { code: '30201-2002', name: 'การตรวจสอบบัญชี', credit: 3, t: 2, p: 2 }
    ],
    7: [ // Marketing
        { code: '20202-2001', name: 'หลักการตลาด', credit: 3, t: 2, p: 2 },
        { code: '20202-2002', name: 'การขายเบื้องต้น', credit: 3, t: 2, p: 2 },
        { code: '20202-2003', name: 'การโฆษณาและการส่งเสริมการขาย', credit: 3, t: 2, p: 2 },
        { code: '20202-2004', name: 'พฤติกรรมผู้บริโภค', credit: 2, t: 2, p: 0 },
        { code: '20202-2005', name: 'การตลาดดิจิทัล', credit: 3, t: 1, p: 4 },
        { code: '30202-2001', name: 'การจัดการร้านค้าปลีก', credit: 3, t: 2, p: 2 },
        { code: '30202-2002', name: 'กลยุทธ์การตลาด', credit: 3, t: 2, p: 2 }
    ]
};

async function populateSubjects() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nextjs_login'
    });

    try {
        console.log("🚀 Populating Subjects...");

        // 1. Common Subjects
        console.log("\n📚 Processing Common Subjects...");
        for (const s of COMMON_SUBJECTS) {
            const [rows] = await db.execute('SELECT id FROM subjects WHERE code = ?', [s.code]);
            if (rows.length === 0) {
                await db.execute(
                    'INSERT INTO subjects (code, name, credit, theoryHours, practiceHours, departmentId, updatedAt) VALUES (?, ?, ?, ?, ?, NULL, ?)',
                    [s.code, s.name, s.credit, s.t, s.p, new Date()]
                );
                console.log(`   + Added: ${s.code} ${s.name}`);
            } else {
                // Determine if we should update it to make sure it is NULL dept
                // await db.execute('UPDATE subjects SET departmentId = NULL WHERE id = ?', [rows[0].id]);
                // console.log(`   = Updated (Null Dept): ${s.code}`);
            }
        }

        // 2. Department Subjects
        for (const [deptId, subjects] of Object.entries(DEPT_SUBJECTS)) {
            console.log(`\n🏢 Processing Department ${deptId}...`);
            for (const s of subjects) {
                const [rows] = await db.execute('SELECT id FROM subjects WHERE code = ?', [s.code]);
                if (rows.length === 0) {
                    await db.execute(
                        'INSERT INTO subjects (code, name, credit, theoryHours, practiceHours, departmentId, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [s.code, s.name, s.credit, s.t, s.p, deptId, new Date()]
                    );
                    console.log(`   + Added: ${s.code} ${s.name}`);
                } else {
                    // Ensure correct department
                    await db.execute('UPDATE subjects SET departmentId = ? WHERE id = ?', [deptId, rows[0].id]);
                    console.log(`   = Updated Dept: ${s.code}`);
                }
            }
        }

        console.log("\n✅ Done!");
    } catch (e) {
        console.error(e);
    } finally {
        await db.end();
    }
}

populateSubjects();
