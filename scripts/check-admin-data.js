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
        const [rows] = await connection.execute('SELECT id, username, LENGTH(image) as image_length, image FROM users WHERE username = ?', ['admin']);
        if (rows.length > 0) {
            const user = rows[0];
            console.log('User found:', user.username);
            console.log('Image length:', user.image_length);
            console.log('Image start:', user.image ? user.image.substring(0, 50) : 'null');
        } else {
            console.log('User admin not found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

main();
