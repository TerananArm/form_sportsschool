require('dotenv').config();
const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nextjs_login',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function main() {
    try {
        console.log('Checking columns for teachers table...');

        // Add birthdate
        try {
            await db.execute('ALTER TABLE teachers ADD COLUMN birthdate DATETIME NULL;');
            console.log('Successfully added birthdate column.');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') console.log('Column birthdate already exists.');
            else throw error;
        }

        // Add max_hours
        try {
            await db.execute('ALTER TABLE teachers ADD COLUMN max_hours INT DEFAULT 20;');
            console.log('Successfully added max_hours column.');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') console.log('Column max_hours already exists.');
            else throw error;
        }

    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    } finally {
        await db.end();
        process.exit(0);
    }
}

main();
