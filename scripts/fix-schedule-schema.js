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
        // --- SCHEDULE ---
        console.log('--- Fixing SCHEDULE table ---');
        try {
            // Rename columns if they exist in camelCase
            await connection.execute(`ALTER TABLE schedule CHANGE dayOfWeek day_of_week INT`);
            console.log('Renamed dayOfWeek -> day_of_week');
        } catch (e) { console.log('dayOfWeek rename skipped (might not exist or already renamed)'); }

        try {
            await connection.execute(`ALTER TABLE schedule CHANGE teacherId teacher_id VARCHAR(255)`);
            console.log('Renamed teacherId -> teacher_id');
        } catch (e) { console.log('teacherId rename skipped'); }

        try {
            await connection.execute(`ALTER TABLE schedule CHANGE roomId room_id VARCHAR(255)`);
            console.log('Renamed roomId -> room_id');
        } catch (e) { console.log('roomId rename skipped'); }

        try {
            await connection.execute(`ALTER TABLE schedule CHANGE courseId course_id VARCHAR(255)`);
            console.log('Renamed courseId -> course_id');
        } catch (e) { console.log('courseId rename skipped'); }

        try {
            await connection.execute(`ALTER TABLE schedule ADD COLUMN class_level_id VARCHAR(255)`);
            console.log('Added class_level_id to schedule');
        } catch (e) { console.log('class_level_id already exists in schedule'); }

        // Update default data for schedule
        await connection.execute(`UPDATE schedule SET class_level_id = '1' WHERE class_level_id IS NULL`);

        // --- CLASS_SUBJECTS ---
        console.log('--- Fixing CLASS_SUBJECTS table ---');
        try {
            await connection.execute(`
        ALTER TABLE class_subjects 
        ADD COLUMN class_level_id VARCHAR(255),
        ADD COLUMN subject_id VARCHAR(255)
      `);
            console.log('Added columns to class_subjects');
        } catch (e) { console.log('class_subjects columns already exist'); }

        // Update default data for class_subjects
        // Assuming we have subjects and class_levels, let's link them
        // Get a subject ID and a class level ID
        const [subjects] = await connection.execute('SELECT id FROM subjects LIMIT 1');
        const [levels] = await connection.execute('SELECT id FROM class_levels LIMIT 1');

        if (subjects.length > 0 && levels.length > 0) {
            const subId = subjects[0].id;
            const levelId = levels[0].id;
            await connection.execute(`UPDATE class_subjects SET class_level_id = ?, subject_id = ? WHERE class_level_id IS NULL`, [levelId, subId]);
            console.log('Updated class_subjects data');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

main();
