// app/api/dashboard/conflicts/route.js
import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(req) {
    try {
        // Count potential conflicts that were AVOIDED by the scheduler

        // 1. Teacher conflicts - same teacher in same time slot
        const [teacherConflicts] = await db.query(`
            SELECT COUNT(*) as count FROM (
                SELECT teacherId, day, start_period
                FROM schedule
                GROUP BY teacherId, day, start_period
                HAVING COUNT(*) > 1
            ) as conflicts
        `);

        // 2. Room conflicts - same room in same time slot
        const [roomConflicts] = await db.query(`
            SELECT COUNT(*) as count FROM (
                SELECT roomId, day, start_period
                FROM schedule
                GROUP BY roomId, day, start_period
                HAVING COUNT(*) > 1
            ) as conflicts
        `);

        // 3. Class level conflicts - same class in same time slot
        const [classConflicts] = await db.query(`
            SELECT COUNT(*) as count FROM (
                SELECT classLevelId, day, start_period
                FROM schedule
                GROUP BY classLevelId, day, start_period
                HAVING COUNT(*) > 1
            ) as conflicts
        `);

        // 4. Schedule stats
        const [scheduleStats] = await db.query(`
            SELECT 
                COUNT(*) as total_slots,
                COUNT(DISTINCT teacherId) as unique_teachers,
                COUNT(DISTINCT roomId) as unique_rooms,
                COUNT(DISTINCT classLevelId) as unique_classes
            FROM schedule
        `);

        // 5. Teacher unavailable violations
        const [teacherData] = await db.query(`
            SELECT t.id, t.name, t.unavailableTimes, s.day, s.start_period
            FROM teachers t
            JOIN schedule s ON s.teacherId = t.id
            WHERE t.unavailableTimes IS NOT NULL AND t.unavailableTimes != '{}'
        `);

        let unavailableViolations = 0;
        teacherData.forEach(row => {
            try {
                const unavailable = typeof row.unavailableTimes === 'string'
                    ? JSON.parse(row.unavailableTimes)
                    : row.unavailableTimes;
                const key = `${row.day}-${row.start_period}`;
                if (unavailable[key]) {
                    unavailableViolations++;
                }
            } catch { }
        });

        // Calculate conflict-free rate
        const totalSlots = scheduleStats[0]?.total_slots || 0;
        const totalConflicts = (teacherConflicts[0]?.count || 0) +
            (roomConflicts[0]?.count || 0) +
            (classConflicts[0]?.count || 0) +
            unavailableViolations;

        // Potential conflicts (theoretical max without scheduler)
        // Each slot could potentially conflict with teachers/rooms/classes
        const potentialConflicts = totalSlots * 3; // 3 types of conflicts possible
        const conflictsAvoided = Math.max(0, potentialConflicts - totalConflicts);
        const conflictFreeRate = totalSlots > 0
            ? Math.round(((totalSlots - totalConflicts) / totalSlots) * 100)
            : 100;

        return NextResponse.json({
            currentConflicts: {
                teacher: teacherConflicts[0]?.count || 0,
                room: roomConflicts[0]?.count || 0,
                class: classConflicts[0]?.count || 0,
                unavailable: unavailableViolations,
                total: totalConflicts
            },
            stats: {
                totalSlots,
                uniqueTeachers: scheduleStats[0]?.unique_teachers || 0,
                uniqueRooms: scheduleStats[0]?.unique_rooms || 0,
                uniqueClasses: scheduleStats[0]?.unique_classes || 0,
                conflictsAvoided,
                conflictFreeRate
            }
        });

    } catch (error) {
        console.error('Conflicts API Error:', error);
        return NextResponse.json({
            error: error.message,
            currentConflicts: { teacher: 0, room: 0, class: 0, unavailable: 0, total: 0 },
            stats: { totalSlots: 0, uniqueTeachers: 0, uniqueRooms: 0, uniqueClasses: 0, conflictsAvoided: 0, conflictFreeRate: 100 }
        }, { status: 500 });
    }
}
