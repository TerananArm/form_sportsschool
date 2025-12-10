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
        console.log('Seeding data...');

        // 1. Add more teachers if needed
        const [teachers] = await connection.execute('SELECT id FROM teachers');
        if (teachers.length < 5) {
            console.log('Adding sample teachers...');
            const newTeachers = [
                ['สมชาย ใจดี', 'somchai@example.com', 'IT', '3201'],
                ['สมหญิง รักเรียน', 'somying@example.com', 'IT', '3202'],
                ['วิชัย เก่งกาจ', 'wichai@example.com', 'General', '1101']
            ];
            for (const t of newTeachers) {
                // Get department ID
                const [dept] = await connection.execute('SELECT id FROM departments WHERE name = ?', [t[2]]);
                const deptId = dept.length > 0 ? dept[0].id : 1;

                await connection.execute(
                    'INSERT INTO teachers (id, name, email, department_id, room) VALUES (UUID(), ?, ?, ?, ?)',
                    [t[0], t[1], deptId, t[3]]
                );
            }
        }

        // 2. Clear existing schedule for this term to avoid duplicates
        const term = '2/2568';
        await connection.execute('DELETE FROM schedule WHERE term = ?', [term]);

        // 3. Generate Schedule
        // Get necessary IDs
        const [allTeachers] = await connection.execute('SELECT id FROM teachers');
        const [allSubjects] = await connection.execute('SELECT id, code, name, theory_hours, practice_hours FROM subjects');
        const [allRooms] = await connection.execute('SELECT id FROM rooms');
        const [allLevels] = await connection.execute('SELECT id, name FROM class_levels');

        if (allSubjects.length === 0 || allLevels.length === 0) {
            console.log('No subjects or levels found. Skipping schedule generation.');
            return;
        }

        const days = [1, 2, 3, 4, 5]; // 1=Monday, 5=Friday
        let count = 0;

        // Create schedule for "ปวช. 1/1" (or first available level)
        const targetLevel = allLevels.find(l => l.name === 'ปวช. 1/1') || allLevels[0];
        console.log(`Generating schedule for ${targetLevel.name}...`);

        for (let i = 0; i < 15; i++) { // Generate 15 slots
            const day = days[i % 5];
            const startPeriod = (i % 4) + 1; // 1, 2, 3, 4
            const subject = allSubjects[i % allSubjects.length];
            const duration = (subject.theory_hours || 0) + (subject.practice_hours || 0) || 2;
            const endPeriod = startPeriod + duration - 1;

            // Random teacher and room
            const teacherId = allTeachers[i % allTeachers.length].id;
            const roomId = allRooms.length > 0 ? allRooms[i % allRooms.length].id : null;

            // Insert
            await connection.execute(
                `INSERT INTO schedule (id, term, day_of_week, start_period, end_period, subject_id, teacher_id, class_level, room_id, class_level_id)
                 VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [term, day, startPeriod, endPeriod, subject.id, teacherId, targetLevel.name, roomId, targetLevel.id]
            );
            count++;
        }

        console.log(`Seeded ${count} schedule entries.`);

    } catch (error) {
        console.error('Seed failed:', error);
    } finally {
        await connection.end();
    }
}

main();
