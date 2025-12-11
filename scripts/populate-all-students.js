const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const STANDARD_LEVELS = ['ปวช. 1/1', 'ปวช. 1/2', 'ปวช. 2/1', 'ปวช. 3/1', 'ปวส. 1/1', 'ปวส. 2/1'];
const TARGET_STUDENT_COUNT = 15;

const FIRST_NAMES = ['Somsak', 'Somchai', 'Sompong', 'Malee', 'Mali', 'Ratana', 'Prasert', 'Wichai', 'Niwat', 'Sunee', 'Arthit', 'Kamol', 'Nipa', 'Suchart', 'Wimon'];
const LAST_NAMES = ['Jaidee', 'Rakthai', 'Meemark', 'Sookjai', 'Charoen', 'Mungme', 'Pattan', 'Saensuk', 'Yindee', 'Klat', 'Ngam', 'Dee', 'Siri', 'Wong', 'Kul'];

function getRandomName() {
    const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    return `${fn} ${ln}`;
}

async function populateStudents() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nextjs_login'
    });

    try {
        console.log("🚀 Starting Comprehensive Student Population...");

        // 1. Get All Real Departments (Exclude Test Dept ID 1)
        const [depts] = await db.execute('SELECT id, name FROM departments WHERE id != 1');

        for (const dept of depts) {
            console.log(`\n🏢 Processing Department: ${dept.name} (ID: ${dept.id})`);

            for (const levelName of STANDARD_LEVELS) {
                // 2. Ensure Class Level Exists
                let levelId = null;
                const [existingLevel] = await db.execute('SELECT id FROM class_levels WHERE name = ? AND departmentId = ?', [levelName, dept.id]);

                if (existingLevel.length === 0) {
                    console.log(`   + Creating Class Level: ${levelName}`);
                    const [res] = await db.execute('INSERT INTO class_levels (name, departmentId, updatedAt) VALUES (?, ?, ?)', [levelName, dept.id, new Date()]);
                    levelId = res.insertId;
                } else {
                    levelId = existingLevel[0].id;
                }

                // 3. Ensure Students
                const [countRes] = await db.execute('SELECT count(*) as count FROM students WHERE classLevelId = ?', [levelId]);
                const currentCount = countRes[0].count;
                const needed = TARGET_STUDENT_COUNT - currentCount;

                if (needed > 0) {
                    console.log(`   + Adding ${needed} students to ${levelName}...`);
                    for (let i = 0; i < needed; i++) {
                        const name = getRandomName();
                        const id = uuidv4();
                        const studentId = Math.floor(10000000 + Math.random() * 90000000).toString(); // Random 8 digit ID

                        await db.execute(
                            'INSERT INTO students (studentId, name, classLevelId, departmentId, updatedAt) VALUES (?, ?, ?, ?, ?)',
                            [studentId, name, levelId, dept.id, new Date()]
                        );
                    }
                } else {
                    console.log(`   = ${levelName} has ${currentCount} students (Enough).`);
                }
            }
        }

        console.log("\n✅ Population Complete!");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.end();
    }
}

populateStudents();
