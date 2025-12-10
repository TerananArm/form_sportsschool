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
        console.log('Restoring relationships...');

        // 1. Assign all orphaned Class Levels to 'เทคโนโลยีสารสนเทศ' (ID 1)
        // In a real scenario, we might map by name, but for now, we want "usable" data.
        const [clResult] = await connection.execute('UPDATE class_levels SET department_id = ? WHERE department_id IS NULL', ['1']);
        console.log(`Updated ${clResult.affectedRows} Class Levels to Dept ID 1`);

        // 2. Assign orphaned Subjects to 'เทคโนโลยีสารสนเทศ' (ID 1)
        const [subResult] = await connection.execute('UPDATE subjects SET department_id = ? WHERE department_id IS NULL', ['1']);
        console.log(`Updated ${subResult.affectedRows} Subjects to Dept ID 1`);

        // 3. Assign orphaned Students to 'เทคโนโลยีสารสนเทศ' (ID 1)
        const [stuResult] = await connection.execute('UPDATE students SET department_id = ? WHERE department_id IS NULL', ['1']);
        console.log(`Updated ${stuResult.affectedRows} Students to Dept ID 1`);

        // 4. Assign orphaned Teachers to 'เทคโนโลยีสารสนเทศ' (ID 1)
        const [teaResult] = await connection.execute('UPDATE teachers SET department_id = ? WHERE department_id IS NULL', ['1']);
        console.log(`Updated ${teaResult.affectedRows} Teachers to Dept ID 1`);

        console.log('Data restoration complete.');

    } catch (error) {
        console.error('Restoration failed:', error);
    } finally {
        await connection.end();
    }
}

main();
