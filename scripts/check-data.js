const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nextjs_login'
    });

    console.log('Connected to database.');

    try {
        const [classLevels] = await connection.execute('SELECT COUNT(*) as count FROM class_levels');
        console.log(`Class Levels Count: ${classLevels[0].count}`);

        const [departments] = await connection.execute('SELECT COUNT(*) as count FROM departments');
        console.log(`Departments Count: ${departments[0].count}`);

        const [subjects] = await connection.execute('SELECT COUNT(*) as count FROM subjects');
        console.log(`Subjects Count: ${subjects[0].count}`);

        const [teachers] = await connection.execute('SELECT COUNT(*) as count FROM teachers');
        console.log(`Teachers Count: ${teachers[0].count}`);

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await connection.end();
    }
}

main();
