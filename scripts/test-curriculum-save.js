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
        const level = 'ปวช. 1/1';
        const dept = 'เทคโนโลยีสารสนเทศ'; // Name, not ID, as sent by frontend

        // 1. Get Class Level ID
        const [clRows] = await connection.execute('SELECT id FROM class_levels WHERE name = ?', [level]);
        if (clRows.length === 0) {
            console.error('Class Level not found');
            return;
        }
        const classLevelId = clRows[0].id;
        console.log(`Class Level ID for ${level}: ${classLevelId}`);

        // 2. Get some subject IDs
        const [subjects] = await connection.execute('SELECT id FROM subjects LIMIT 2');
        const subjectIds = subjects.map(s => s.id);
        console.log('Subject IDs to save:', subjectIds);

        // 3. Simulate API Logic
        console.log('Deleting existing...');
        await connection.execute('DELETE FROM class_subjects WHERE class_level_id = ?', [classLevelId]);

        console.log('Inserting new...');
        if (subjectIds.length > 0) {
            const placeholders = subjectIds.map(() => '(UUID(), ?, ?, ?)').join(', ');
            const values = [];
            subjectIds.forEach(sid => values.push(classLevelId, sid, dept));
            await connection.execute(`INSERT INTO class_subjects (id, class_level_id, subject_id, department) VALUES ${placeholders}`, values);
        }

        console.log('Saved!');

        // 4. Verify
        const [saved] = await connection.execute('SELECT * FROM class_subjects WHERE class_level_id = ?', [classLevelId]);
        console.log('Saved entries:', saved);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

main();
