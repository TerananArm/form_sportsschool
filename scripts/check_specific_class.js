const mysql = require('mysql2/promise');

async function checkSpecificClass() {
    console.log("🔍 Checking Database for 'Pwc. 1/1' in 'Computer Business'...");

    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nextjs_login'
    });

    try {
        // 1. Find the specific class
        // Use LIKE for flexibility with spaces
        const [classes] = await db.execute(`
            SELECT cl.id, cl.name as class_name, d.name as dept_name, d.id as dept_id 
            FROM class_levels cl
            JOIN departments d ON cl.departmentId = d.id
            WHERE d.name LIKE '%คอมพิวเตอร์%' AND cl.name LIKE '%ปวช. 1/1%'
        `);

        if (classes.length === 0) {
            console.error("❌ No matching Class found in DB.");
        } else {
            const target = classes[0];
            console.log(`✅ Found Class: "${target.class_name}"`);
            console.log(`   Department: "${target.dept_name}" (ID: ${target.dept_id})`);
            console.log(`   Class ID: ${target.id}`);

            // 2. Check subjects
            const [subjects] = await db.execute(`
                SELECT s.code, s.name 
                FROM class_subjects cs
                JOIN subjects s ON cs.subjectId = s.id
                WHERE cs.classLevelId = ?
            `, [target.id]);

            console.log(`\n📚 Curriculum Check:`);
            if (subjects.length === 0) {
                console.error("❌ 0 Subjects found! (This would cause 'No Curriculum' error)");
            } else {
                console.log(`✅ Found ${subjects.length} Subjects:`);
                subjects.forEach((s, i) => console.log(`   ${i + 1}. [${s.code}] ${s.name}`));
            }
        }
    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        await db.end();
    }
}

checkSpecificClass();
