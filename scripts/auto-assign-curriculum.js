const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function autoAssignCurriculum() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nextjs_login'
    });

    try {
        console.log("🚀 Starting Auto-Curriculum Assignment...");

        // 1. Load All Class Levels with Dept ID
        const [levels] = await db.execute('SELECT cl.id, cl.name, cl.departmentId FROM class_levels cl');

        // 2. Load Subjects
        const [commonSubjects] = await db.execute('SELECT id FROM subjects WHERE departmentId IS NULL');
        const [deptSubjects] = await db.execute('SELECT id, departmentId FROM subjects WHERE departmentId IS NOT NULL');

        // Group Dept Subjects
        const subjectsByDept = {};
        deptSubjects.forEach(s => {
            if (!subjectsByDept[s.departmentId]) subjectsByDept[s.departmentId] = [];
            subjectsByDept[s.departmentId].push(s.id);
        });

        console.log(`Found ${levels.length} Levels, ${commonSubjects.length} Common Subj, ${deptSubjects.length} Dept Subj.`);

        let totalAssigned = 0;

        for (const level of levels) {
            console.log(`   Processing ${level.name} (Dept ${level.departmentId})...`);

            const levelId = level.id;
            const deptId = level.departmentId;

            // Strategy: 
            // - Pick 3 Common Subjects (Randomly)
            // - Pick 5 Dept Subjects (Randomly from matching Dept)

            const selectedSubjects = new Set();

            // Pick Common
            const shuffledCommon = [...commonSubjects].sort(() => 0.5 - Math.random());
            shuffledCommon.slice(0, 3).forEach(s => selectedSubjects.add(s.id));

            // Pick Dept
            if (subjectsByDept[deptId]) {
                const shuffledDept = [...subjectsByDept[deptId]].sort(() => 0.5 - Math.random());
                shuffledDept.slice(0, 5).forEach(s => selectedSubjects.add(s.id));
            }

            // Insert into class_subjects
            for (const subjectId of selectedSubjects) {
                if (!levelId || !subjectId) continue;

                // Check if exists
                const [exists] = await db.execute(
                    'SELECT id FROM class_subjects WHERE classLevelId = ? AND subjectId = ?',
                    [levelId, subjectId]
                );

                if (exists.length === 0) {
                    await db.execute(
                        'INSERT INTO class_subjects (classLevelId, subjectId) VALUES (?, ?)',
                        [levelId, subjectId]
                    );
                    totalAssigned++;
                }
            }
        }

        console.log(`\n✅ Success! Assigned ${totalAssigned} new curriculum entries.`);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.end();
    }
}

autoAssignCurriculum();
