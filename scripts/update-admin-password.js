const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nextjs_login'
    });

    console.log('Connected to MySQL database.');

    try {
        // Update admin password to '1234' (plain text for simplicity as per auth logic)
        const [result] = await connection.execute(
            'UPDATE users SET password = ? WHERE username = ?',
            ['1234', 'admin']
        );
        console.log('Updated admin password to 1234. Affected rows:', result.affectedRows);
    } catch (error) {
        console.error('Error updating password:', error);
    } finally {
        await connection.end();
    }
}

main();
