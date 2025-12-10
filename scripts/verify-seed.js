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
        console.log('--- Teachers ---');
        const [teachers] = await connection.execute('SELECT id, name, birthdate FROM teachers');
        console.log(teachers);

        console.log('--- Students ---');
        const [students] = await connection.execute('SELECT id, name, birthdate FROM students');
        console.log(students);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

main();
