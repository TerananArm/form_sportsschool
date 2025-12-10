import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        // 1. Create Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS class_levels (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                department_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
            )
        `);

        // 2. Migrate Data (Avoid duplicates)
        await db.execute(`
            INSERT IGNORE INTO class_levels (name, department_id)
            SELECT DISTINCT level, department_id FROM students
            WHERE level IS NOT NULL AND department_id IS NOT NULL
        `);

        return NextResponse.json({ message: 'Table class_levels created and data migrated.' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
