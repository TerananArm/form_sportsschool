// app/api/dashboard/metrics/route.js
// Dashboard Metrics API - Room Utilization & Teaching Load
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Room Utilization
        // Total possible slots per room = 5 days * 8 periods = 40 slots
        const PERIODS_PER_DAY = 8; // Excluding lunch
        const DAYS_PER_WEEK = 5;
        const TOTAL_SLOTS_PER_ROOM = PERIODS_PER_DAY * DAYS_PER_WEEK;

        const [rooms] = await db.execute('SELECT COUNT(*) as count FROM rooms');
        const totalRooms = rooms[0].count || 1;
        const totalAvailableSlots = totalRooms * TOTAL_SLOTS_PER_ROOM;

        // Count used room slots
        const [usedSlots] = await db.execute(`
            SELECT SUM(end_period - start_period + 1) as total
            FROM schedule
            WHERE roomId IS NOT NULL
        `);
        const usedRoomSlots = Number(usedSlots[0].total) || 0;
        const roomUtilization = totalAvailableSlots > 0
            ? Math.round((usedRoomSlots / totalAvailableSlots) * 100)
            : 0;

        // 2. Teaching Load per Teacher
        const [teachingLoad] = await db.execute(`
            SELECT 
                t.id,
                t.name,
                t.maxHoursPerWeek as max_hours,
                COALESCE(SUM(s.end_period - s.start_period + 1), 0) as current_hours
            FROM teachers t
            LEFT JOIN schedule s ON t.id = s.teacherId
            GROUP BY t.id, t.name, t.maxHoursPerWeek
            ORDER BY current_hours DESC
        `);

        // Calculate average load
        const totalTeachers = teachingLoad.length || 1;
        const totalHours = teachingLoad.reduce((sum, t) => sum + (Number(t.current_hours) || 0), 0);
        const avgLoad = Math.round(totalHours / totalTeachers);

        // 3. Schedule Statistics
        const [scheduleStats] = await db.execute(`
            SELECT 
                COUNT(DISTINCT teacherId) as teachers_scheduled,
                COUNT(DISTINCT roomId) as rooms_used,
                COUNT(DISTINCT subjectId) as subjects_scheduled,
                COUNT(*) as total_slots
            FROM schedule
        `);

        // 4. Check for conflicts (same teacher/room at same time)
        const [conflicts] = await db.execute(`
            SELECT COUNT(*) as count FROM (
                SELECT day_of_week, start_period, teacherId
                FROM schedule
                WHERE teacherId IS NOT NULL
                GROUP BY day_of_week, start_period, teacherId
                HAVING COUNT(*) > 1
            ) as teacher_conflicts
        `);
        const teacherConflicts = conflicts[0]?.count || 0;

        const [roomConflicts] = await db.execute(`
            SELECT COUNT(*) as count FROM (
                SELECT day_of_week, start_period, roomId
                FROM schedule
                WHERE roomId IS NOT NULL
                GROUP BY day_of_week, start_period, roomId
                HAVING COUNT(*) > 1
            ) as room_conflicts
        `);
        const roomConflictCount = roomConflicts[0]?.count || 0;

        return NextResponse.json({
            roomUtilization: {
                percentage: roomUtilization,
                usedSlots: usedRoomSlots,
                totalSlots: totalAvailableSlots,
                totalRooms
            },
            teachingLoad: {
                average: avgLoad,
                total: totalHours,
                teachers: teachingLoad.map(t => ({
                    id: t.id,
                    name: t.name,
                    currentHours: Number(t.current_hours) || 0,
                    maxHours: t.max_hours || 20,
                    percentage: t.max_hours ? Math.round((Number(t.current_hours) / t.max_hours) * 100) : 0
                }))
            },
            scheduleStats: {
                teachersScheduled: scheduleStats[0]?.teachers_scheduled || 0,
                roomsUsed: scheduleStats[0]?.rooms_used || 0,
                subjectsScheduled: scheduleStats[0]?.subjects_scheduled || 0,
                totalSlots: scheduleStats[0]?.total_slots || 0
            },
            conflicts: {
                teacher: teacherConflicts,
                room: roomConflictCount,
                total: teacherConflicts + roomConflictCount
            }
        });
    } catch (error) {
        console.error("Metrics API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
