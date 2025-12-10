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
        console.log('Updating student levels...');
        const [result] = await connection.execute('UPDATE students SET level = ? WHERE level IS NULL OR level = ""', ['ปวช. 1/1']);
        console.log(`Updated ${result.affectedRows} students.`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

main();
