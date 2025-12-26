import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAction } from '@/lib/logger';

export async function DELETE(request) {
  try {
    const { type, id } = await request.json();
    let sql = '';
    let params = [id]; // id here is likely the visible ID (studentId, code, etc) from the table, NOT the PK

    switch (type) {
      // Use logical IDs (Unique Strings) where available
      case 'students': sql = 'DELETE FROM students WHERE studentId = ?'; break;
      case 'teachers': sql = 'DELETE FROM teachers WHERE teacherId = ?'; break;
      case 'subjects': sql = 'DELETE FROM subjects WHERE code = ?'; break;
      case 'rooms': sql = 'DELETE FROM rooms WHERE name = ?'; break; // Room name is unique

      // Use PKs (Integers) for these
      case 'departments': sql = 'DELETE FROM departments WHERE id = ?'; break;
      case 'levels':
      case 'class_levels': sql = 'DELETE FROM class_levels WHERE id = ?'; break;
      case 'users': sql = 'DELETE FROM users WHERE username = ?'; break; // Username is unique

      default: return NextResponse.json({ message: 'Invalid type' }, { status: 400 });
    }

    const [result] = await db.execute(sql, params);

    // Check if anything was actually deleted
    if (result.affectedRows === 0) {
      // Fallback: Try deleting by PK ID if logical ID failed (just in case frontend sent PK)
      let fallbackSql = '';
      switch (type) {
        case 'students': fallbackSql = 'DELETE FROM students WHERE id = ?'; break;
        case 'teachers': fallbackSql = 'DELETE FROM teachers WHERE id = ?'; break;
        case 'subjects': fallbackSql = 'DELETE FROM subjects WHERE id = ?'; break;
        case 'rooms': fallbackSql = 'DELETE FROM rooms WHERE id = ?'; break;
      }
      if (fallbackSql) {
        const [fbResult] = await db.execute(fallbackSql, params);
        if (fbResult.affectedRows > 0) return NextResponse.json({ message: 'ลบข้อมูลสำเร็จ (ID)' });
      }

      return NextResponse.json({ message: 'ไม่พบข้อมูลที่ต้องการลบ' }, { status: 404 });
    }

    // Audit Log
    try {
      await logAction({
        action: 'DELETE',
        resource: type,
        resourceId: String(id),
        details: `Deleted ${type} ID: ${id}`,
        performedBy: 'Admin'
      });
    } catch (e) { console.error("Audit log error", e); }

    return NextResponse.json({ message: 'ลบข้อมูลสำเร็จ' });

  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ message: 'ลบไม่สำเร็จ: ' + error.message }, { status: 500 });
  }
}