import { db } from './lib/db.js';

async function testConnection() {
    try {
        console.log('Testing connection...');
        const [rows] = await db.execute('SELECT 1 as val');
        console.log('Connection successful:', rows);

        console.log('Describing tables...');
        const [class_subjects] = await db.execute("DESCRIBE class_subjects");
        console.log('Class Subjects:', class_subjects);

        console.log('Checking students...');
        const [students] = await db.execute('SELECT * FROM students');
        console.log('Students:', students);

        process.exit(0);
    } catch (error) {
        console.error('Connection failed:', error);
        process.exit(1);
    }
}

testConnection();
