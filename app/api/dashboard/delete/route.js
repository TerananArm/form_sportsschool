import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request) {
  try {
    const { type, id } = await request.json();
    let sql = '';
    let params = [id];

    switch (type) {
      case 'students': sql = 'DELETE FROM students WHERE id = ?'; break;
      case 'teachers': sql = 'DELETE FROM teachers WHERE id = ?'; break;
      case 'subjects': sql = 'DELETE FROM subjects WHERE code = ?'; break;
      case 'rooms': sql = 'DELETE FROM rooms WHERE name = ?'; break;
      case 'departments': sql = 'DELETE FROM departments WHERE id = ?'; break;
      case 'class_levels': sql = 'DELETE FROM class_levels WHERE id = ?'; break;
      case 'users': sql = 'DELETE FROM users WHERE id = ?'; break;
      default: return NextResponse.json({ message: 'Invalid type' }, { status: 400 });
    }

    await db.execute(sql, params);
    return NextResponse.json({ message: 'ลบข้อมูลสำเร็จ' });

  } catch (error) {
    return NextResponse.json({ message: 'ลบไม่สำเร็จ: ' + error.message }, { status: 500 });
  }
}