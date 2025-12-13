// app/api/ai-schedule/route.js
// Fast Deterministic Scheduler - No AI, instant results!
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSchedule, validateSchedule } from '@/app/lib/deterministic-scheduler';

export async function POST(request) {
    try {
        const { term, department, classLevel } = await request.json();
        console.log(`📅 Scheduling ${classLevel} (${department}) for term ${term}...`);

        // 1. Get Department ID
        const [deptRows] = await db.execute('SELECT id FROM departments WHERE name = ?', [department]);
        let departmentId = null;
        if (deptRows.length > 0) {
            departmentId = deptRows[0].id;
        } else {
            return NextResponse.json({ message: 'ไม่พบแผนกวิชานี้' }, { status: 404 });
        }

        // 2. Get Class Level ID (Filtered by Department)
        const [clRows] = await db.execute('SELECT id FROM class_levels WHERE name = ? AND departmentId = ?', [classLevel, departmentId]);
        if (clRows.length === 0) {
            return NextResponse.json({ message: `ไม่พบระดับชั้น ${classLevel} ในแผนก ${department}` }, { status: 404 });
        }
        const classLevelId = clRows[0].id;

        // 3. Fetch Subjects for this Class Level
        let sqlSubjects = `
            SELECT cs.subjectId, s.code, s.name, s.theoryHours, s.practiceHours, 
                   s.teacherId, t.name as teacher_name
            FROM class_subjects cs
            JOIN subjects s ON cs.subjectId = s.id
            LEFT JOIN teachers t ON s.teacherId = t.id 
            WHERE cs.classLevelId = ?
        `;
        const [subjects] = await db.execute(sqlSubjects, [classLevelId]);

        if (subjects.length === 0) {
            return NextResponse.json({ message: 'ไม่พบรายวิชาที่ลงทะเบียนไว้ในหลักสูตร' }, { status: 400 });
        }

        console.log(`📚 Found ${subjects.length} subjects to schedule`);

        // 4. Fetch Resources
        const [rooms] = await db.execute("SELECT id, name, type FROM rooms");
        const [teachers] = await db.execute("SELECT id, name FROM teachers");

        // 5. Fetch existing schedules (for conflict checking with other classes)
        const [existingSchedules] = await db.execute(
            `SELECT day_of_week, start_period, end_period, teacherId, roomId 
             FROM schedule WHERE term = ? AND classLevelId != ?`,
            [term, classLevelId]
        );

        console.log(`🔍 Found ${existingSchedules.length} existing schedule slots to check conflicts against`);

        // 6. Generate Schedule using deterministic algorithm
        console.log(`🚀 Generating schedule...`);
        const startTime = Date.now();

        const scheduleJson = generateSchedule(subjects, rooms, teachers, existingSchedules);

        const elapsed = Date.now() - startTime;
        console.log(`⚡ Schedule generated in ${elapsed}ms`);

        // 7. Validate Schedule
        const conflicts = validateSchedule(scheduleJson);

        if (conflicts.length > 0) {
            console.warn("⚠️ Validation warnings:", conflicts);
            // Continue anyway - these are soft warnings
        }

        // 8. Save to Database
        await db.execute('DELETE FROM schedule WHERE term = ? AND classLevelId = ?', [term, classLevelId]);

        function getPeriodTimes(start, end) {
            const times = {
                1: "08:00", 2: "09:00", 3: "10:00", 4: "11:00",
                5: "12:00", 6: "13:00", 7: "14:00", 8: "15:00",
                9: "16:00", 10: "17:00", 11: "18:00"
            };
            return {
                start: times[start] || "00:00",
                end: times[end + 1] || "00:00"
            };
        }

        for (const item of scheduleJson) {
            const { start, end } = getPeriodTimes(item.start_period, item.end_period);
            await db.execute(
                `INSERT INTO schedule 
             (term, day, day_of_week, start_period, end_period, startTime, endTime, subjectId, teacherId, classLevelId, roomId, departmentId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    term,
                    item.day_of_week,
                    item.day_of_week,
                    item.start_period,
                    item.end_period,
                    start,
                    end,
                    item.subject_id,
                    item.teacher_id || null,
                    classLevelId,
                    item.room_id || null,
                    departmentId
                ]
            );
        }

        console.log(`✅ Saved ${scheduleJson.length} slots to database`);

        // 9. Count conflicts after (for comparison)
        const [conflictsAfter] = await db.execute(`
            SELECT COUNT(*) as count FROM (
                SELECT day_of_week, start_period, teacherId
                FROM schedule WHERE term = ? AND teacherId IS NOT NULL
                GROUP BY day_of_week, start_period, teacherId
                HAVING COUNT(*) > 1
            ) as conflicts
        `, [term]);
        const conflictsAfterCount = conflictsAfter[0]?.count || 0;

        return NextResponse.json({
            message: `จัดตารางสำเร็จ (${scheduleJson.length} คาบ) ⚡ ${elapsed}ms`,
            stats: {
                slots: scheduleJson.length,
                elapsed: elapsed,
                warnings: conflicts.length,
                conflictsExisting: existingSchedules.length,
                conflictsAfter: conflictsAfterCount
            }
        });

    } catch (error) {
        console.error("Schedule Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}