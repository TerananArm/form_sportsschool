// app/api/dashboard/curriculum/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const dept = searchParams.get('dept');

    if (!level || !dept) return NextResponse.json([]);

    try {
        // Get department id
        const [deptRows] = await db.execute('SELECT id FROM departments WHERE name = ?', [dept]);
        const deptId = deptRows.length > 0 ? deptRows[0].id : null;

        // Get class level id WITH department filter
        // This ensures "ปวช. 1/1" in Dept A is different from "ปวช. 1/1" in Dept B
        const [clRows] = await db.execute(
            'SELECT id FROM class_levels WHERE name = ? AND departmentId = ?',
            [level, deptId]
        );

        // If not found with dept, try without (backward compat)
        let classLevelId = null;
        if (clRows.length > 0) {
            classLevelId = clRows[0].id;
        } else {
            // Fallback: Find by name only (for older data)
            const [fallback] = await db.execute('SELECT id FROM class_levels WHERE name = ?', [level]);
            if (fallback.length > 0) classLevelId = fallback[0].id;
        }

        if (!classLevelId) {
            return NextResponse.json([]); // No class level found
        }

        // Get all subjects with enrollment status for THIS class level
        let sql = `
            SELECT s.id, s.code, s.name, s.credit, s.departmentId,
                   CASE WHEN cs.subjectId IS NOT NULL THEN 1 ELSE 0 END as is_enrolled
            FROM subjects s
            LEFT JOIN class_subjects cs ON s.id = cs.subjectId AND cs.classLevelId = ?
            ORDER BY s.code ASC
        `;
        const [rows] = await db.execute(sql, [classLevelId]);
        const data = rows.map(r => ({ ...r, is_enrolled: !!r.is_enrolled }));
        return NextResponse.json(data);

    } catch (error) {
        console.error("Curriculum GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { level, dept, subject_ids } = await request.json();

        // 1. Get Department ID
        const [deptRows] = await db.execute('SELECT id FROM departments WHERE name = ?', [dept]);
        const deptId = deptRows.length > 0 ? deptRows[0].id : null;

        // 2. Get Class Level ID with department filter
        let [clRows] = await db.execute(
            'SELECT id FROM class_levels WHERE name = ? AND departmentId = ?',
            [level, deptId]
        );

        // If not found, create a new class level for this department
        if (clRows.length === 0) {
            // Create the class level for this specific department
            await db.execute(
                'INSERT INTO class_levels (name, departmentId) VALUES (?, ?)',
                [level, deptId]
            );
            // Get the new ID
            [clRows] = await db.execute(
                'SELECT id FROM class_levels WHERE name = ? AND departmentId = ?',
                [level, deptId]
            );
        }

        if (clRows.length === 0) {
            return NextResponse.json({ message: 'Failed to create or find class level' }, { status: 500 });
        }

        const classLevelId = clRows[0].id;

        // 3. Delete existing enrollments for THIS class level only
        await db.execute('DELETE FROM class_subjects WHERE classLevelId = ?', [classLevelId]);

        // 4. Insert new enrollments
        if (subject_ids?.length > 0) {
            for (const sid of subject_ids) {
                await db.execute(
                    'INSERT INTO class_subjects (classLevelId, subjectId) VALUES (?, ?)',
                    [classLevelId, sid]
                );
            }
        }

        return NextResponse.json({ message: 'Saved' });

    } catch (error) {
        console.error("Curriculum POST Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}