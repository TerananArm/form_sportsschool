const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nextjs_login'
    });

    try {
        console.log('🧪 Testing corrected INSERT statement...');

        // Mock data
        const term = 'TEST_TERM';
        const day = 1;
        const start = 1;
        const end = 2;
        const subjectId = 'mock_subject_id'; // Needs to exist? No, FK checks might fail if not disabled or if we don't use real IDs.
        // Let's use real IDs to be safe, or disable FK checks.
        // For simplicity, let's just try to insert with a random UUID for subject/teacher if FKs allow, 
        // OR better, just pick one from DB.

        const [subjects] = await connection.execute('SELECT id FROM subjects LIMIT 1');
        const [teachers] = await connection.execute('SELECT id FROM teachers LIMIT 1');
        const [levels] = await connection.execute('SELECT id, name FROM class_levels LIMIT 1');
        const [rooms] = await connection.execute('SELECT id FROM rooms LIMIT 1');

        if (subjects.length === 0) { console.log('No subjects found to test with.'); return; }

        const sId = subjects[0].id;
        const tId = teachers[0].id;
        const lName = levels[0].name; // API uses name for class_level column? Let's check schema.
        // API: item.class_level || classLevel. Schema: class_level (varchar?)
        const rId = rooms[0].id;

        // The Fixed SQL
        await connection.execute(
            `INSERT INTO schedule (id, term, day_of_week, start_period, end_period, subject_id, teacher_id, class_level, room_id)
             VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
            [term, day, start, end, sId, tId, lName, rId]
        );

        console.log('✅ INSERT successful! The fix works.');

        // Clean up
        await connection.execute('DELETE FROM schedule WHERE term = ?', [term]);
        console.log('🧹 Test data cleaned up.');

    } catch (error) {
        console.error('❌ INSERT failed:', error);
    } finally {
        await connection.end();
    }
}

main();
