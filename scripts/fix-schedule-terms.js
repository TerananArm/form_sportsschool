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
        console.log('Fixing NULL terms...');

        // Update term to '2/2568' (matches user screenshot)
        const [res1] = await connection.execute('UPDATE schedule SET term = ? WHERE term IS NULL', ['2/2568']);
        console.log(`Updated ${res1.affectedRows} rows with term '2/2568'`);

        // Also check if class_level is NULL and fix it if needed
        // We'll assign a default class level if it's missing, e.g., 'ปวช. 1/1'
        const [res2] = await connection.execute('UPDATE schedule SET class_level = ? WHERE class_level IS NULL', ['ปวช. 1/1']);
        console.log(`Updated ${res2.affectedRows} rows with class_level 'ปวช. 1/1'`);

    } catch (error) {
        console.error('Fix failed:', error);
    } finally {
        await connection.end();
    }
}

main();
