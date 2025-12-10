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
        console.log('🧪 Testing Curriculum Department Filter...');

        // 1. Setup Data
        const level = 'ปวช. 1/1';
        const dept1 = 'เทคโนโลยีสารสนเทศ';
        const dept2 = 'การบัญชี';

        // Get IDs
        const [clRows] = await connection.execute('SELECT id FROM class_levels WHERE name = ?', [level]);
        const classLevelId = clRows[0].id;

        const [subjects] = await connection.execute('SELECT id FROM subjects LIMIT 1');
        const subjectId = subjects[0].id;

        // 2. Insert for Dept 1 ONLY
        await connection.execute('DELETE FROM class_subjects WHERE class_level_id = ?', [classLevelId]);
        await connection.execute(
            'INSERT INTO class_subjects (id, class_level_id, subject_id, department) VALUES (UUID(), ?, ?, ?)',
            [classLevelId, subjectId, dept1]
        );
        console.log(`✅ Inserted subject for ${dept1}`);

        // 3. Query for Dept 1 (Should be enrolled)
        const sql = `
            SELECT s.code, 
                   CASE WHEN cs.subject_id IS NOT NULL THEN 1 ELSE 0 END as is_enrolled
            FROM subjects s
            LEFT JOIN class_subjects cs ON s.id = cs.subject_id 
                AND cs.class_level_id = ?
                AND cs.department = ?
            WHERE s.id = ?
        `;

        const [rows1] = await connection.execute(sql, [classLevelId, dept1, subjectId]);
        console.log(`Dept 1 (${dept1}) Enrolled:`, !!rows1[0].is_enrolled);

        // 4. Query for Dept 2 (Should NOT be enrolled)
        const [rows2] = await connection.execute(sql, [classLevelId, dept2, subjectId]);
        console.log(`Dept 2 (${dept2}) Enrolled:`, !!rows2[0].is_enrolled);

        if (rows1[0].is_enrolled && !rows2[0].is_enrolled) {
            console.log('✅ Filter works correctly!');
        } else {
            console.error('❌ Filter failed!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await connection.end();
    }
}

main();
