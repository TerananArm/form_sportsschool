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
        // 1. Add missing columns
        console.log('Adding missing columns...');
        try {
            await connection.execute(`
        ALTER TABLE students 
        ADD COLUMN department_id VARCHAR(255),
        ADD COLUMN level VARCHAR(255)
      `);
            console.log('Columns added successfully.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Columns already exist.');
            } else {
                throw err;
            }
        }

        // 2. Update existing data with default values (to avoid foreign key errors)
        // Defaulting to Department ID '1' (Technology Information) and Level 'ปวช. 1/1'
        console.log('Updating existing students with default data...');
        await connection.execute(`
      UPDATE students 
      SET department_id = '1', level = 'ปวช. 1/1' 
      WHERE department_id IS NULL OR level IS NULL
    `);
        console.log('Data updated.');

        // 3. Add Foreign Key
        console.log('Adding Foreign Key constraint...');
        try {
            await connection.execute(`
        ALTER TABLE students 
        ADD CONSTRAINT fk_student_department 
        FOREIGN KEY (department_id) REFERENCES departments(id)
      `);
            console.log('Foreign Key added.');
        } catch (err) {
            if (err.code === 'ER_DUP_KEY' || err.code === 'ER_FK_DUP_NAME') {
                console.log('Foreign Key already exists.');
            } else {
                console.warn('Could not add Foreign Key (might be data inconsistency):', err.message);
            }
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

main();
