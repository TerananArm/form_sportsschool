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
        // Check Class Levels
        const [clNulls] = await connection.execute('SELECT COUNT(*) as count FROM class_levels WHERE department_id IS NULL');
        console.log(`Class Levels with NULL department_id: ${clNulls[0].count}`);

        // Check Subjects
        const [subjNulls] = await connection.execute('SELECT COUNT(*) as count FROM subjects WHERE department_id IS NULL');
        console.log(`Subjects with NULL department_id: ${subjNulls[0].count}`);

        // Check Students
        const [stuNulls] = await connection.execute('SELECT COUNT(*) as count FROM students WHERE department_id IS NULL');
        console.log(`Students with NULL department_id: ${stuNulls[0].count}`);

        // Check Teachers
        const [teaNulls] = await connection.execute('SELECT COUNT(*) as count FROM teachers WHERE department_id IS NULL');
        console.log(`Teachers with NULL department_id: ${teaNulls[0].count}`);

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await connection.end();
    }
}

main();
