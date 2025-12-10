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
        console.log('🧪 Testing Add Class Level...');

        const levelName = 'TEST_LEVEL_1';
        const deptName = 'เทคโนโลยีสารสนเทศ';

        // Get Dept ID
        const [deptRows] = await connection.execute('SELECT id FROM departments WHERE name = ?', [deptName]);
        if (deptRows.length === 0) { console.error('Dept not found'); return; }
        const deptId = deptRows[0].id;

        // Simulate Add Logic
        // 1. Check Duplicate
        const [existing] = await connection.execute('SELECT id FROM class_levels WHERE name = ? AND department_id = ?', [levelName, deptId]);
        if (existing.length > 0) {
            console.log('⚠️ Level already exists, deleting first...');
            await connection.execute('DELETE FROM class_levels WHERE id = ?', [existing[0].id]);
        }

        // 2. Insert (The Fixed Logic)
        await connection.execute(
            'INSERT INTO class_levels (id, name, department_id) VALUES (UUID(), ?, ?)',
            [levelName, deptId]
        );

        console.log('✅ INSERT successful! The fix works.');

        // Clean up
        await connection.execute('DELETE FROM class_levels WHERE name = ?', [levelName]);
        console.log('🧹 Test data cleaned up.');

    } catch (error) {
        console.error('❌ INSERT failed:', error);
    } finally {
        await connection.end();
    }
}

main();
