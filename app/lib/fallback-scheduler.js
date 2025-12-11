export async function generateDeterministicSchedule(subjects, rooms, teachers, term, classLevelId, db) {
    console.log("⚠️ Switching to DETERMINISTIC Fallback Scheduler...");

    const days = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์'];
    const schedule = [];

    // Helper: Check if slot is busy in our CURRENT generated schedule (Internal Conflict)
    const isInternalBusy = (day, start, end) => {
        return schedule.some(s =>
            s.day_of_week === day &&
            Math.max(s.start_period, start) <= Math.min(s.end_period, end)
        );
    };

    // Helper: Check database for External Conflicts (Teacher/Room)
    const isExternalBusy = async (day, start, end, teacherId, roomId) => {
        // Teacher Check
        if (teacherId) {
            const [tBusy] = await db.execute(
                `SELECT id FROM schedule 
                 WHERE term = ? AND day_of_week = ? AND teacherId = ? 
                 AND classLevelId != ?
                 AND ((start_period <= ? AND end_period >= ?) OR (start_period <= ? AND end_period >= ?))`,
                [term, day, teacherId, classLevelId, end, start, end, start]
            );
            if (tBusy.length > 0) return true;
        }

        // Room Check
        if (roomId) {
            const [rBusy] = await db.execute(
                `SELECT id FROM schedule 
                 WHERE term = ? AND day_of_week = ? AND roomId = ? 
                 AND classLevelId != ?
                 AND ((start_period <= ? AND end_period >= ?) OR (start_period <= ? AND end_period >= ?))`,
                [term, day, roomId, classLevelId, end, start, end, start]
            );
            if (rBusy.length > 0) return true;
        }

        return false;
    };

    // Sort subjects: Harder constraints first (e.g. longer hours, labs)
    const sortedSubjects = [...subjects].sort((a, b) => {
        const totalA = (a.theoryHours || 0) + (a.practiceHours || 0);
        const totalB = (b.theoryHours || 0) + (b.practiceHours || 0);
        return totalB - totalA; // Descending duration
    });

    for (const sub of sortedSubjects) {
        const totalHours = (sub.theoryHours || 0) + (sub.practiceHours || 0);
        if (totalHours === 0) continue;

        let scheduled = false;

        // Find Teacher
        let teacherId = sub.teacherId;
        if (!teacherId || teacherId === 0) {
            // Assign random teacher if not fixed
            if (teachers.length > 0) {
                teacherId = teachers[Math.floor(Math.random() * teachers.length)].id;
            }
        }

        // Find Room
        // If practice > 0 try to find Lab, else Lecture
        let roomId = null;
        const requiredType = (sub.practiceHours > 0) ? 'Lab' : 'Classroom';
        const suitableRooms = rooms.filter(r =>
            sub.practiceHours > 0
                ? (r.type === 'Lab' || r.type === 'Workshop')
                : true // Any room for theory, preference to Classroom?
        );
        // Fallback to any room if no specific type found
        const potentialRooms = suitableRooms.length > 0 ? suitableRooms : rooms;

        // Try to find a slot
        // Prioritize Morning (1-4), then Afternoon (6-9)
        // We iterate Days -> Periods

        // Initialize Day Loads if not exists
        const dayHours = {
            'วันจันทร์': 0, 'วันอังคาร': 0, 'วันพุธ': 0, 'วันพฤหัสบดี': 0, 'วันศุกร์': 0
        };
        // Pre-calculate existing load from `schedule` array
        schedule.forEach(s => {
            dayHours[s.day_of_week] += (s.end_period - s.start_period + 1);
        });

        // Sort days by LEAST LOADED first
        const sortedDays = [...days].sort((a, b) => dayHours[a] - dayHours[b]);

        dayLoop: for (const day of sortedDays) {
            // Define possible start periods based on duration
            // Valid slots: 
            // Morning: 1..4 (Must end by 4) -> Max start = 4 - duration + 1
            // Afternoon: 6..10 (Must end by 10) -> Max start = 10 - duration + 1

            const possibleStarts = [];

            // Morning possibility
            for (let p = 1; p <= 4 - totalHours + 1; p++) {
                possibleStarts.push(p);
            }
            // Afternoon possibility
            for (let p = 6; p <= 10 - totalHours + 1; p++) {
                possibleStarts.push(p);
            }

            for (const start of possibleStarts) {
                const end = start + totalHours - 1;

                // 1. Check Internal Conflict (Class Busy)
                if (isInternalBusy(day, start, end)) continue;

                // 2. Try to find a valid Room
                // We need to check if ANY room is valid for this slot + teacher
                for (const room of potentialRooms) {
                    // 3. Check External Conflict (Teacher/Room Busy)
                    const busy = await isExternalBusy(day, start, end, teacherId, room.id);
                    if (!busy) {
                        // FOUND A SLOT!
                        schedule.push({
                            day_of_week: day,
                            start_period: start,
                            end_period: end,
                            subject_id: sub.subjectId,
                            teacher_id: teacherId,
                            room_id: room.id
                        });

                        // Update load
                        dayHours[day] += totalHours;

                        scheduled = true;
                        break dayLoop; // Move to next subject
                    }
                }
            }
        }

        if (!scheduled) {
            console.warn(`Could not schedule Subject ${sub.code} (${totalHours} hrs) - No slots available.`);
            // In a real app, strict failure. Here, we skip or force? 
            // Let's skip to output partial schedule.
        }
    }

    return schedule;
}
