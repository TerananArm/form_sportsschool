// app/api/dashboard/schedule/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term') || '1/2567';
    const classLevel = searchParams.get('classLevel');
    const teacherId = searchParams.get('teacher');
    const department = searchParams.get('department');

    try {
        // Get class level ID if provided
        let classLevelId = null;
        if (classLevel) {
            const [clRows] = await db.execute('SELECT id FROM class_levels WHERE name = ?', [classLevel]);
            if (clRows.length > 0) classLevelId = clRows[0].id;
        }

        // SQL with CORRECT column names (matching DB schema: camelCase)
        let sql = `
            SELECT s.id, s.day, s.day_of_week, s.start_period, s.end_period, s.startTime, s.endTime,
                   sub.code as subject_code, sub.name as subject_name, 
                   t.name as teacher_name, 
                   r.name as room_name,
                   cl.name as class_level,
                   (COALESCE(s.end_period, 1) - COALESCE(s.start_period, 1) + 1) as duration
            FROM schedule s
            JOIN subjects sub ON s.subjectId = sub.id
            LEFT JOIN teachers t ON s.teacherId = t.id
            LEFT JOIN rooms r ON s.roomId = r.id
            LEFT JOIN class_levels cl ON s.classLevelId = cl.id
            WHERE 1=1
        `;

        let params = [];
        if (term) { sql += " AND s.term = ?"; params.push(term); }
        if (classLevelId) { sql += " AND s.classLevelId = ?"; params.push(classLevelId); }
        if (teacherId) { sql += " AND s.teacherId = ?"; params.push(teacherId); }

        sql += " ORDER BY s.day_of_week, s.start_period ASC";
        const [rows] = await db.execute(sql, params);

        // Format data for display (Group by day)
        const scheduleMap = {};
        const days = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์'];
        days.forEach(d => { scheduleMap[d] = {}; });

        rows.forEach(row => {
            const day = row.day_of_week || row.day; // Support both columns
            const start = row.start_period || 1;
            const end = row.end_period || start;
            if (scheduleMap[day]) {
                scheduleMap[day][start] = row;
                for (let i = start + 1; i <= end; i++) scheduleMap[day][i] = 'skip';
            }
        });

        return NextResponse.json(scheduleMap);

    } catch (error) {
        console.error("Fetch Schedule Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const { action, data } = await request.json();
    try {
        if (action === 'manual_add') {
            const { term, day, subject_id, teacher_id, class_level, start_period, duration, room_id } = data;
            const end_period = start_period + duration - 1;

            // Get class level ID
            const [clRows] = await db.execute('SELECT id, departmentId FROM class_levels WHERE name = ?', [class_level]);
            if (clRows.length === 0) {
                return NextResponse.json({ message: 'ไม่พบระดับชั้นนี้' }, { status: 404 });
            }
            const classLevelId = clRows[0].id;
            const departmentId = clRows[0].departmentId || 1; // fallback

            // Time mapping helper
            const times = { 1: "08:00", 2: "09:00", 3: "10:00", 4: "11:00", 5: "12:00", 6: "13:00", 7: "14:00", 8: "15:00", 9: "16:00", 10: "17:00", 11: "18:00" };
            const startTime = times[start_period] || "00:00";
            const endTime = times[end_period + 1] || "00:00";

            // 1. Check Room Conflict
            if (room_id) {
                const [roomConflicts] = await db.execute(`
                    SELECT cl.name as class_level, t.name as teacher_name, sub.name as subject_name
                    FROM schedule s
                    LEFT JOIN teachers t ON s.teacherId = t.id
                    JOIN subjects sub ON s.subjectId = sub.id
                    LEFT JOIN class_levels cl ON s.classLevelId = cl.id
                    WHERE s.term = ? AND s.day_of_week = ? 
                    AND ((s.start_period <= ? AND s.end_period >= ?))
                    AND s.roomId = ?
                `, [term, day, end_period, start_period, room_id]);

                if (roomConflicts.length > 0) {
                    const c = roomConflicts[0];
                    return NextResponse.json({
                        message: `ห้องเรียนไม่ว่าง! (ชนกับ ${c.class_level} วิชา ${c.subject_name})`
                    }, { status: 409 });
                }
            }

            // 2. Check Teacher Conflict
            const [teacherConflicts] = await db.execute(`
                SELECT cl.name as class_level, r.name as room_name, sub.name as subject_name
                FROM schedule s
                LEFT JOIN rooms r ON s.roomId = r.id
                JOIN subjects sub ON s.subjectId = sub.id
                LEFT JOIN class_levels cl ON s.classLevelId = cl.id
                WHERE s.term = ? AND s.day_of_week = ? 
                AND ((s.start_period <= ? AND s.end_period >= ?))
                AND s.teacherId = ?
            `, [term, day, end_period, start_period, teacher_id]);

            if (teacherConflicts.length > 0) {
                const c = teacherConflicts[0];
                return NextResponse.json({
                    message: `ครูติดสอน! (ชนกับ ${c.class_level} วิชา ${c.subject_name})`
                }, { status: 409 });
            }

            // 3. Check Class Level Conflict
            const [classConflicts] = await db.execute(`
                SELECT t.name as teacher_name, r.name as room_name, sub.name as subject_name
                FROM schedule s
                LEFT JOIN teachers t ON s.teacherId = t.id
                LEFT JOIN rooms r ON s.roomId = r.id
                JOIN subjects sub ON s.subjectId = sub.id
                WHERE s.term = ? AND s.day_of_week = ? 
                AND ((s.start_period <= ? AND s.end_period >= ?))
                AND s.classLevelId = ?
            `, [term, day, end_period, start_period, classLevelId]);

            if (classConflicts.length > 0) {
                const c = classConflicts[0];
                return NextResponse.json({
                    message: `ชั้นเรียนนี้มีเรียนแล้ว! (วิชา ${c.subject_name} ครู ${c.teacher_name})`
                }, { status: 409 });
            }

            // INSERT (using correct column names)
            await db.execute(`
                INSERT INTO schedule (day, day_of_week, start_period, end_period, startTime, endTime, subjectId, teacherId, classLevelId, roomId, departmentId, term) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [day, day, start_period, end_period, startTime, endTime, subject_id, teacher_id, classLevelId, room_id || null, departmentId, term]);

            return NextResponse.json({ message: 'เพิ่มรายวิชาสำเร็จ' });
        }
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error("POST Schedule Error:", error);
        return NextResponse.json({ message: 'Error: ' + error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const { action, ids, mode, term, value } = await request.json();
    try {
        if (action === 'bulk_delete') {
            if (!ids?.length) return NextResponse.json({ message: 'ไม่พบรายการ' });
            const placeholders = ids.map(() => '?').join(',');
            await db.execute(`DELETE FROM schedule WHERE id IN (${placeholders})`, ids);
            return NextResponse.json({ message: 'ลบสำเร็จ' });
        } else if (action === 'clear_table') {
            let sql = `DELETE FROM schedule WHERE term = ?`;
            let params = [term];
            if (mode === 'class') {
                // Get classLevelId
                const [clRows] = await db.execute('SELECT id FROM class_levels WHERE name = ?', [value]);
                if (clRows.length > 0) {
                    sql += " AND classLevelId = ?";
                    params.push(clRows[0].id);
                }
            }
            else if (mode === 'teacher') { sql += " AND teacherId = ?"; params.push(value); }
            await db.execute(sql, params);
            return NextResponse.json({ message: 'ล้างข้อมูลสำเร็จ' });
        }
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error("DELETE Schedule Error:", error);
        return NextResponse.json({ message: 'Error: ' + error.message }, { status: 500 });
    }
}