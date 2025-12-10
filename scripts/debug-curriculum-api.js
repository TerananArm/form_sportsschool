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
        console.log('🧪 Debugging Curriculum API...');

        const level = 'ปวช. 1/1';
        const dept = 'เทคโนโลยีสารสนเทศ';

        console.log(`Params: level="${level}", dept="${dept}"`);

        const sql = `
            SELECT s.code, s.name, d.name as dept, s.credit, s.id,
                   CASE WHEN cs.subject_id IS NOT NULL THEN 1 ELSE 0 END as is_enrolled
            FROM subjects s
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN class_subjects cs ON s.id = cs.subject_id 
                AND cs.class_level_id = (SELECT id FROM class_levels WHERE name = ?)
                AND cs.department = ?
            ORDER BY s.code ASC
        `;

        const [rows] = await connection.execute(sql, [level, dept]);
        console.log('Rows type:', Array.isArray(rows) ? 'Array' : typeof rows);
        console.log('Rows length:', rows.length);

        const data = rows.map(r => ({ ...r, is_enrolled: !!r.is_enrolled }));
        console.log('Data type:', Array.isArray(data) ? 'Array' : typeof data);
        console.log('Data sample:', JSON.stringify(data[0]));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await connection.end();
    }
}

main();
