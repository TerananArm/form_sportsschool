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
        const [columns] = await connection.execute('DESCRIBE class_levels');
        console.log('class_levels columns:', columns.map(c => c.Field));

        const [rows] = await connection.execute('SELECT * FROM class_levels LIMIT 5');
        console.log('class_levels sample:', rows);

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await connection.end();
    }
}

main();
