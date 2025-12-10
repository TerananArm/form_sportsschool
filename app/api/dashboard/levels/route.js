import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [rows] = await db.execute(`
            SELECT cl.*, d.name as department_name 
            FROM class_levels cl
            LEFT JOIN departments d ON cl.department_id = d.id
            ORDER BY cl.name ASC
        `);
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { name, department_id } = await request.json();
        await db.execute('INSERT INTO class_levels (id, name, department_id) VALUES (UUID(), ?, ?)', [name, department_id]);
        return NextResponse.json({ message: 'Created' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { id } = await request.json();
        await db.execute('DELETE FROM class_levels WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
