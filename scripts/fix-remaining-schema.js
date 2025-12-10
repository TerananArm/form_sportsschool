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
        // --- CLASS_LEVELS ---
        console.log('--- Fixing CLASS_LEVELS table ---');
        try {
            await connection.execute(`ALTER TABLE class_levels ADD COLUMN department_id VARCHAR(255)`);
            console.log('Added department_id to class_levels');
        } catch (e) { console.log('department_id already exists in class_levels'); }

        // Update default data for class_levels
        await connection.execute(`UPDATE class_levels SET department_id = '1' WHERE department_id IS NULL`);

        try {
            await connection.execute(`
          ALTER TABLE class_levels 
          ADD CONSTRAINT fk_class_level_department 
          FOREIGN KEY (department_id) REFERENCES departments(id)
        `);
            console.log('Class Levels FK added.');
        } catch (err) {
            if (err.code !== 'ER_DUP_KEY' && err.code !== 'ER_FK_DUP_NAME') console.warn('Class Levels FK error:', err.message);
        }

        // --- ROOMS ---
        console.log('--- Fixing ROOMS table ---');
        try {
            await connection.execute(`ALTER TABLE rooms ADD COLUMN type VARCHAR(255)`);
            console.log('Added type to rooms');
        } catch (e) { console.log('type already exists in rooms'); }

        // Update default data for rooms
        await connection.execute(`UPDATE rooms SET type = 'Lecture' WHERE type IS NULL`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

main();
