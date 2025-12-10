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
        // --- TEACHERS ---
        console.log('--- Fixing TEACHERS table ---');
        try {
            await connection.execute(`
        ALTER TABLE teachers 
        ADD COLUMN department_id VARCHAR(255),
        ADD COLUMN room VARCHAR(255)
      `);
            console.log('Teachers columns added.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') console.log('Teachers columns already exist.');
            else throw err;
        }

        console.log('Updating teachers data...');
        await connection.execute(`UPDATE teachers SET department_id = '1', room = 'Room 101' WHERE department_id IS NULL`);

        try {
            await connection.execute(`
        ALTER TABLE teachers 
        ADD CONSTRAINT fk_teacher_department 
        FOREIGN KEY (department_id) REFERENCES departments(id)
      `);
            console.log('Teachers FK added.');
        } catch (err) {
            if (err.code !== 'ER_DUP_KEY' && err.code !== 'ER_FK_DUP_NAME') console.warn('Teachers FK error:', err.message);
        }

        // --- SUBJECTS ---
        console.log('--- Fixing SUBJECTS table ---');
        try {
            await connection.execute(`
        ALTER TABLE subjects 
        ADD COLUMN department_id VARCHAR(255),
        ADD COLUMN theory_hours INT DEFAULT 0,
        ADD COLUMN practice_hours INT DEFAULT 0
      `);
            console.log('Subjects columns added.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') console.log('Subjects columns already exist.');
            else throw err;
        }

        console.log('Updating subjects data...');
        await connection.execute(`UPDATE subjects SET department_id = '1', theory_hours = 2, practice_hours = 2 WHERE department_id IS NULL`);

        try {
            await connection.execute(`
        ALTER TABLE subjects 
        ADD CONSTRAINT fk_subject_department 
        FOREIGN KEY (department_id) REFERENCES departments(id)
      `);
            console.log('Subjects FK added.');
        } catch (err) {
            if (err.code !== 'ER_DUP_KEY' && err.code !== 'ER_FK_DUP_NAME') console.warn('Subjects FK error:', err.message);
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

main();
