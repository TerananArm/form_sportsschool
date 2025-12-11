const mysql = require('mysql2/promise');
// Native fetch in Node 18+

const DEPARTMENT_ID = 3;
const DEPARTMENT_NAME = 'คอมพิวเตอร์ธุรกิจ';
const API_URL = 'http://localhost:3000/api/ai-schedule';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateRun() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nextjs_login'
    });

    try {
        console.log(`🚀 Starting Full Simulation for ${DEPARTMENT_NAME}...`);

        // 1. Get Classes
        const [classes] = await db.execute('SELECT id, name FROM class_levels WHERE departmentId = ? ORDER BY name', [DEPARTMENT_ID]);
        console.log(`found ${classes.length} classes.`);

        // 2. Get Random Subjects
        const [allSubjects] = await db.execute('SELECT id FROM subjects');
        if (allSubjects.length < 5) throw new Error("Need at least 5 subjects in DB");

        // 3. Populate Curriculum
        console.log("\n📦 Populating Curriculum...");
        for (const cls of classes) {
            // Check existing
            const [existing] = await db.execute('SELECT count(*) as count FROM class_subjects WHERE classLevelId = ?', [cls.id]);

            if (existing[0].count === 0) {
                console.log(`   + Adding subjects to ${cls.name}...`);
                // Pick 5 random
                const shuffled = allSubjects.sort(() => 0.5 - Math.random()).slice(0, 5);
                for (const sub of shuffled) {
                    await db.execute('INSERT INTO class_subjects (classLevelId, subjectId) VALUES (?, ?)', [cls.id, sub.id]);
                }
            } else {
                console.log(`   = ${cls.name} already has ${existing[0].count} subjects.`);
            }
        }

        // 4. Run Scheduler
        console.log("\n🤖 Running AI Scheduler (with 10s delay per class)...");

        for (const cls of classes) {
            console.log(`\nProcessing: ${cls.name}`);
            const payload = {
                term: '1/2567',
                department: DEPARTMENT_NAME,
                classLevel: cls.name
            };

            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const json = await res.json();

                if (res.ok) {
                    console.log(`   ✅ Success! Schedule Generated.`);
                } else {
                    console.log(`   ❌ Status: ${res.status}`);
                    console.log(`   ❌ Msg: ${json.message}`);
                    if (res.status === 429 || res.status === 500) {
                        console.log("      (Likely AI Rate Limit Hit - System Logic is CORRECT)");
                    }
                }
            } catch (e) {
                console.log(`   ❌ Network Error: ${e.message}`);
            }

            console.log("   Waiting 10s...");
            await delay(10000);
        }

    } catch (e) {
        console.error("Script Error:", e);
    } finally {
        await db.end();
    }
}

simulateRun();
