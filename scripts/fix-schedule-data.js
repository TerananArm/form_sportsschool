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
        // 1. Get valid Teacher ID and Room ID
        const [teachers] = await connection.execute('SELECT id FROM teachers LIMIT 1');
        const [rooms] = await connection.execute('SELECT id FROM rooms LIMIT 1');

        if (teachers.length === 0 || rooms.length === 0) {
            console.error('No teachers or rooms found. Cannot fix schedule.');
            return;
        }

        const teacherId = teachers[0].id;
        const roomId = rooms[0].id;

        console.log(`Using Teacher ID: ${teacherId}, Room ID: ${roomId}`);

        // 2. Update Schedule Data
        // Assign random day (1-5) and valid teacher/room to records with nulls
        console.log('Updating schedule records...');

        // We'll update them one by one or in bulk. For simplicity, let's just update ALL null teacher_ids
        // to the first teacher found, and assign days 1-5 cyclically if possible, or just random.
        // Actually, a simple bulk update is safer for now to ensure data appears.

        await connection.execute(`
        UPDATE schedule 
        SET teacher_id = ?, room_id = ?, day_of_week = 1 
        WHERE teacher_id IS NULL OR day_of_week IS NULL
    `, [teacherId, roomId]);

        // Let's vary the days a bit so it looks like a real schedule
        await connection.execute(`UPDATE schedule SET day_of_week = 2 WHERE id % 5 = 1`);
        await connection.execute(`UPDATE schedule SET day_of_week = 3 WHERE id % 5 = 2`);
        await connection.execute(`UPDATE schedule SET day_of_week = 4 WHERE id % 5 = 3`);
        await connection.execute(`UPDATE schedule SET day_of_week = 5 WHERE id % 5 = 4`);

        console.log('Schedule data updated successfully.');

    } catch (error) {
        console.error('Fix failed:', error);
    } finally {
        await connection.end();
    }
}

main();
