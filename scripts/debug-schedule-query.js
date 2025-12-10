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
        const term = '2/2568'; // From user screenshot
        const sql = `
            SELECT s.id, s.day_of_week, s.start_period, s.end_period, s.class_level,
                   sub.code as subject_code, sub.name as subject_name, 
                   t.name as teacher_name, 
                   r.name as room_name,
                   (s.end_period - s.start_period + 1) as duration
            FROM schedule s
            JOIN subjects sub ON s.subject_id = sub.id
            JOIN teachers t ON s.teacher_id = t.id
            LEFT JOIN rooms r ON s.room_id = r.id
            WHERE s.term = ?
            ORDER BY s.day_of_week, s.start_period ASC
        `;

        console.log('Executing SQL:', sql);
        const [rows] = await connection.execute(sql, [term]);
        console.log('Query successful. Rows:', rows.length);
        if (rows.length > 0) console.log('Sample:', rows[0]);

    } catch (error) {
        console.error('Query failed:', error);
    } finally {
        await connection.end();
    }
}

main();
