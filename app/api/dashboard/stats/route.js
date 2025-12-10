import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ✅ บังคับให้ Next.js ไม่ใช้ Cache ของ API นี้
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // ฟังก์ชันช่วยนับจำนวนแถว (COUNT) แบบปลอดภัย (ถ้าไม่มีตารางจะไม่ Error พังทั้งระบบ)
    const getCount = async (table) => {
      try {
        const [rows] = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
        return rows[0].count;
      } catch (e) {
        console.error(`Error counting ${table}:`, e);
        return 0;
      }
    };

    // ฟังก์ชันคำนวณผลรวม (SUM)
    const getSum = async (table, column) => {
      try {
        const [rows] = await db.execute(`SELECT SUM(${column}) as total FROM ${table}`);
        return Number(rows[0].total) || 0;
      } catch (e) {
        return 0;
      }
    };

    // ฟังก์ชันนับแบบมีเงื่อนไข (DISTINCT)
    const getDistinctCount = async (table, column) => {
      try {
        const [rows] = await db.execute(`SELECT COUNT(DISTINCT ${column}) as count FROM ${table}`);
        return rows[0].count;
      } catch (e) {
        return 0;
      }
    };

    // 1. ดึงข้อมูลพื้นฐาน (Basic Counts) พร้อมกันแบบ Parallel
    const [
      students, teachers, users, subjects,
      departments, rooms, curriculum, schedule
    ] = await Promise.all([
      getCount('students'),
      getCount('teachers'),
      getCount('users'),
      getCount('subjects'),
      getCount('departments'),
      getCount('rooms'),
      getCount('class_subjects'), // แก้ไขจาก 'curriculum' เป็น 'class_subjects' ตามชื่อตารางจริง
      getCount('schedule')
    ]);

    // 2. คำนวณข้อมูลเชิงลึก (Advanced Stats)

    // - ระดับชั้นเรียน: นับจากระดับชั้นที่ไม่ซ้ำกันในตารางนักเรียน
    // - ระดับชั้นเรียน: นับจากตาราง class_levels โดยตรง
    const class_levels = await getCount('class_levels');

    // - หน่วยกิตรวม: ผลรวมหน่วยกิตของทุกวิชา
    const credits = await getSum('subjects', 'credit');

    // - วิชาที่มีการสอน: นับรหัสวิชาที่ไม่ซ้ำกันในตารางสอน
    const scheduled_subjects = await getDistinctCount('schedule', 'subject_id'); // แก้ไขเป็น subject_id

    // - ชั่วโมงสอนรวม: นับจำนวนคาบทั้งหมดในตารางสอน (คำนวณจาก start_period และ end_period)
    let hours = 0;
    try {
      const [rows] = await db.execute('SELECT SUM(end_period - start_period + 1) as total_hours FROM schedule');
      hours = Number(rows[0].total_hours) || 0;
    } catch (e) { }

    // - Logs: เนื่องจากยังไม่มีตาราง logs ให้สมมติเป็น 0
    const logs = 1;

    // ส่งข้อมูลกลับไปที่ Frontend
    const stats = {
      students,
      teachers,
      users,
      class_levels,
      subjects,
      departments,
      rooms,
      credits,
      curriculum,
      schedule,
      scheduled_subjects,
      total_credits: credits,
      hours,
      logs
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}