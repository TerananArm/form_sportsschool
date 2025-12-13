import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ✅ บังคับให้ Next.js ไม่ใช้ Cache ของ API นี้
export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    try {
        let query = '';
        let params = [];

        // กรณีที่ 1: ดึงข้อมูลรายการเดียว (สำหรับแก้ไข)
        if (id) {
            switch (type) {
                case 'students':
                    query = `
                        SELECT s.id, s.studentId, s.name, d.name as department, cl.name as level, s.birthDate as birthdate 
                        FROM students s 
                        LEFT JOIN departments d ON s.departmentId = d.id 
                        LEFT JOIN class_levels cl ON s.classLevelId = cl.id
                        WHERE s.id = ?
                    `;
                    break;
                case 'teachers':
                    query = `
                        SELECT t.id, t.teacherId, t.name, d.name as department, t.officeRoom as room, t.maxHoursPerWeek as max_hours, t.birthDate as birthdate, t.unavailableTimes as unavailable_times
                        FROM teachers t 
                        LEFT JOIN departments d ON t.departmentId = d.id 
                        WHERE t.id = ?
                    `;
                    break;
                case 'subjects':
                    query = `
                        SELECT s.id, s.code, s.name, d.name as department, s.credit, s.theoryHours as theory, s.practiceHours as practice
                        FROM subjects s 
                        LEFT JOIN departments d ON s.departmentId = d.id 
                        WHERE s.code = ?
                    `;
                    break;
                case 'rooms': query = 'SELECT name, type, capacity FROM rooms WHERE name = ?'; break;
                case 'departments': query = 'SELECT id, name FROM departments WHERE id = ?'; break;
                case 'users': query = 'SELECT username, name, role FROM users WHERE username = ?'; break;
            }
            params = [id];
        }
        // กรณีที่ 2: ดึงข้อมูลทั้งหมด (สำหรับแสดงในตาราง Modal)
        else {
            switch (type) {
                case 'students':
                    query = `
                    SELECT s.id, s.studentId, s.name, d.name as dept, cl.name as level, s.birthDate as birthdate 
                    FROM students s 
                    LEFT JOIN departments d ON s.departmentId = d.id 
                    LEFT JOIN class_levels cl ON s.classLevelId = cl.id
                    ORDER BY s.id DESC
                `;
                    break;
                case 'teachers':
                    query = `
                    SELECT t.id, t.teacherId, t.name, d.name as dept, t.officeRoom as room, t.maxHoursPerWeek as max_hours, t.birthDate as birthdate, t.unavailableTimes as unavailable_times 
                    FROM teachers t 
                    LEFT JOIN departments d ON t.departmentId = d.id 
                    ORDER BY t.id ASC
                `;
                    break;
                case 'subjects':
                    query = `
                    SELECT s.id, s.code, s.name, s.credit, s.theoryHours as theory_hours, s.practiceHours as practice_hours, d.name as dept 
                    FROM subjects s 
                    LEFT JOIN departments d ON s.departmentId = d.id 
                    ORDER BY s.code ASC
                `;
                    break;
                case 'users':
                    query = `
                    SELECT username, name as fullname, role 
                    FROM users 
                    ORDER BY id ASC
                `;
                    break;
                case 'rooms': query = 'SELECT id, name, type, capacity FROM rooms ORDER BY name ASC'; break;
                case 'departments': query = 'SELECT id, name FROM departments ORDER BY id ASC'; break;
                case 'class_levels':
                    query = `
                    SELECT cl.id, cl.name as level, cl.departmentId, d.name as department_name,
                           (SELECT COUNT(*) FROM students s WHERE s.classLevelId = cl.id) as count 
                    FROM class_levels cl 
                    LEFT JOIN departments d ON cl.departmentId = d.id
                    ORDER BY d.name, cl.name ASC
                `;
                    break;
                case 'curriculum':
                    query = `
                        SELECT cs.id, cl.name as level, d.name as department, s.code, s.name as subject_name 
                        FROM class_subjects cs 
                        JOIN subjects s ON cs.subjectId = s.id 
                        JOIN class_levels cl ON cs.classLevelId = cl.id
                        LEFT JOIN departments d ON cl.departmentId = d.id
                        ORDER BY d.name, cl.name
                    `;
                    break;
                case 'schedule':
                    query = `
                        SELECT sch.id, cl.name as level, d.name as dept, s.name as subject, t.name as teacher, 
                               sch.day_of_week, sch.start_period, sch.end_period 
                        FROM schedule sch 
                        JOIN subjects s ON sch.subjectId = s.id 
                        JOIN teachers t ON sch.teacherId = t.id 
                        JOIN class_levels cl ON sch.classLevelId = cl.id
                        JOIN departments d ON cl.departmentId = d.id
                        ORDER BY sch.day_of_week, sch.start_period
                    `;
                    break;
                case 'scheduled_subjects':
                    query = `
                        SELECT DISTINCT s.code, s.name, d.name as dept 
                        FROM schedule sch 
                        JOIN subjects s ON sch.subjectId = s.id 
                        LEFT JOIN departments d ON s.departmentId = d.id
                    `;
                    break;
                case 'credits':
                    query = `
                        SELECT s.code, s.name, s.credit, d.name as dept 
                        FROM subjects s 
                        LEFT JOIN departments d ON s.departmentId = d.id 
                        ORDER BY s.credit DESC
                    `;
                    break;
                case 'hours':
                    query = `
                        SELECT t.name, SUM(sch.end_period - sch.start_period + 1) as total_hours 
                        FROM schedule sch 
                        JOIN teachers t ON sch.teacherId = t.id 
                        GROUP BY t.id, t.name 
                        ORDER BY total_hours DESC
                    `;
                    break;
                case 'room_utilization':
                    query = `
                        SELECT r.name as room, r.type, r.capacity, COUNT(sch.id) as used_periods,
                               ROUND(COUNT(sch.id) * 100.0 / 50, 1) as utilization_percent
                        FROM rooms r
                        LEFT JOIN schedule sch ON sch.roomId = r.id
                        GROUP BY r.id, r.name, r.type, r.capacity
                        ORDER BY utilization_percent DESC
                    `;
                    break;
                case 'teaching_load':
                    query = `
                        SELECT t.name as teacher, t.maxHoursPerWeek as max_hours, 
                               COALESCE(SUM(sch.end_period - sch.start_period + 1), 0) as actual_hours,
                               d.name as dept
                        FROM teachers t
                        LEFT JOIN schedule sch ON sch.teacherId = t.id
                        LEFT JOIN departments d ON t.departmentId = d.id
                        GROUP BY t.id, t.name, t.maxHoursPerWeek, d.name
                        ORDER BY actual_hours DESC
                    `;
                    break;
                case 'logs':
                    // Mock Data for now
                    return NextResponse.json([{ user: 'System', action: 'System started', timestamp: new Date() }]);
                default: return NextResponse.json([]);
            }
        }

        const [rows] = await db.execute(query, params);

        if (!id && type === 'class_levels') rows.forEach(row => row.count = `${row.count} คน`);

        // Format birthDate for display (YYYY-MM-DD)
        if ((type === 'students' || type === 'teachers')) { // Removed !id condition as single item also needs formatting
            rows.forEach(row => {
                if (row.birthdate) {
                    const d = new Date(row.birthdate);
                    row.birthdate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                }
            });
        }

        if (id) {
            return NextResponse.json(rows.length > 0 ? rows[0] : {});
        }

        return NextResponse.json(rows);

    } catch (error) {
        console.error("Fetch Data Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}