const mysql = require('mysql2/promise');

async function migrateCurriculum() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nextjs_login'
    });

    try {
        console.log("Starting Migration: Junk Dept (ID 1) -> Real Dept (ID 3 'Computer Business')");

        // 1. Get all classes in Junk Dept (ID 1)
        const [junkClasses] = await db.execute('SELECT id, name FROM class_levels WHERE departmentId = 1');

        for (const junk of junkClasses) {
            console.log(`Processing Junk Class: ${junk.name} (ID: ${junk.id})`);

            // 2. Find matching class in Real Dept (ID 3)
            const [realClasses] = await db.execute('SELECT id FROM class_levels WHERE name = ? AND departmentId = 3', [junk.name]);

            if (realClasses.length > 0) {
                const realId = realClasses[0].id;
                console.log(`   -> Found match in Real Dept: ID ${realId}`);

                // 3. Check if Junk has curriculum
                const [junkSubjects] = await db.execute('SELECT subjectId FROM class_subjects WHERE classLevelId = ?', [junk.id]);

                if (junkSubjects.length > 0) {
                    console.log(`   -> Moving ${junkSubjects.length} subjects properties...`);

                    // 4. Move subjects: Delete old subjects from Real ID first to avoid duplicates? 
                    // Or just Insert ignore? 
                    // Let's just Loop Insert IGNORE or duplicate check.
                    for (const sub of junkSubjects) {
                        // Check exist
                        const [exist] = await db.execute('SELECT * FROM class_subjects WHERE classLevelId = ? AND subjectId = ?', [realId, sub.subjectId]);
                        if (exist.length === 0) {
                            await db.execute('INSERT INTO class_subjects (classLevelId, subjectId) VALUES (?, ?)', [realId, sub.subjectId]);
                        }
                    }
                    console.log("   -> Migration Done.");
                } else {
                    console.log("   -> No subjects to move.");
                }

                // 5. Delete Junk Class Level ? 
                // Maybe keep for safety but empty subjects?
                // Let's delete subjects from Junk to be clean.
                await db.execute('DELETE FROM class_subjects WHERE classLevelId = ?', [junk.id]);
            } else {
                console.log("   -> No matching class in Real Dept. Skipping.");
            }
        }

        console.log("Migration Complete.");

    } catch (e) {
        console.error(e);
    } finally {
        await db.end();
    }
}

migrateCurriculum();
