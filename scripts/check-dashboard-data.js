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
        const tables = ['schedule', 'subjects', 'teachers', 'class_levels', 'class_subjects', 'departments'];
        for (const table of tables) {
            const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`${table}: ${rows[0].count}`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

main();
