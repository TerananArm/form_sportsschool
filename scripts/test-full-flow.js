const mysql = require('mysql2/promise');

async function testFullFlow() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nextjs_login'
    });

    try {
        console.log("1. Setup: Finding 'Pwc. 2/1' and 'Computer Business'...");
        const [dept] = await db.execute('SELECT id, name FROM departments WHERE name LIKE "%คอมพิวเตอร์%" LIMIT 1');
        if (!dept.length) throw new Error("Dept not found");
        console.log(`   Department: ${dept[0].name} (ID: ${dept[0].id})`);

        const [level] = await db.execute('SELECT id, name FROM class_levels WHERE (name = "Pwc. 2/1" OR name = "ปวช. 2/1") AND departmentId = ? LIMIT 1', [dept[0].id]);
        // If not found, create it
        let levelId;
        let levelName = "ปวช. 2/1";
        if (!level.length) {
            console.log("   Class Level not found, creating...");
            await db.execute('INSERT INTO class_levels (name, departmentId, updatedAt) VALUES (?, ?, ?)', [levelName, dept[0].id, new Date()]);
            const [newLevel] = await db.execute('SELECT id FROM class_levels WHERE name = ? AND departmentId = ?', [levelName, dept[0].id]);
            levelId = newLevel[0].id;
        } else {
            levelId = level[0].id;
            levelName = level[0].name;
            console.log(`   Class Level: ${levelName} (ID: ${levelId})`);
        }

        console.log("\n2. Action: Adding Curriculum (5 Subjects)...");
        // Clear old
        await db.execute('DELETE FROM class_subjects WHERE classLevelId = ?', [levelId]);

        // Get 5 random subjects
        const [subjects] = await db.execute('SELECT id, code, name FROM subjects LIMIT 5');
        if (subjects.length < 5) throw new Error("Not enough subjects in DB");

        for (const sub of subjects) {
            await db.execute('INSERT INTO class_subjects (classLevelId, subjectId) VALUES (?, ?)', [levelId, sub.id]);
            console.log(`   - Added: ${sub.code} ${sub.name}`);
        }

        console.log("\n3. Action: Invoking AI Schedule API...");
        // We use fetch against the running server
        const response = await fetch('http://localhost:3000/api/ai-schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                term: '1/2567',
                department: dept[0].name,
                classLevel: levelName
            })
        });

        const result = await response.json();
        console.log(`   API Status: ${response.status}`);
        console.log(`   API Result:`, JSON.stringify(result, null, 2));

        if (response.ok) {
            console.log("\n4. Verification: Checking Schedule Table...");
            const [schedule] = await db.execute('SELECT * FROM schedule WHERE classLevelId = ? AND term = "1/2567"', [levelId]);
            console.log(`   Found ${schedule.length} schedule slots generated.`);
            if (schedule.length > 0) {
                console.log("   Sample:", JSON.stringify(schedule[0], null, 2));
                console.log("\n✅ TEST SUCCESS: Curriculum added and AI Schedule generated!");
            } else {
                console.error("\n❌ TEST FAILED: API said success but no records found.");
            }
        } else {
            console.error("\n❌ TEST FAILED: API returned error.");
        }

    } catch (e) {
        console.error("Test Error:", e);
    } finally {
        await db.end();
    }
}

testFullFlow();
