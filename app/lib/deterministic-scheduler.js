// app/lib/deterministic-scheduler.js
// กระจายทุกวัน อย่างน้อยครึ่งวัน!

const DAYS = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์'];
const LUNCH_PERIOD = 5;
const MAX_PERIOD = 9;
const MIN_MORNING_PER_DAY = 4; // At least 4 morning periods (half day)

export function generateSchedule(subjects, rooms, teachers, existingSchedules = []) {
    const schedule = [];

    // Track all occupied slots globally
    const globalOccupied = {};
    existingSchedules.forEach(slot => {
        for (let p = slot.start_period; p <= slot.end_period; p++) {
            const key = `${slot.day_of_week}-${p}`;
            if (!globalOccupied[key]) globalOccupied[key] = { rooms: new Set(), teachers: new Set() };
            if (slot.roomId) globalOccupied[key].rooms.add(slot.roomId);
            if (slot.teacherId) globalOccupied[key].teachers.add(slot.teacherId);
            if (slot.room_id) globalOccupied[key].rooms.add(slot.room_id);
            if (slot.teacher_id) globalOccupied[key].teachers.add(slot.teacher_id);
        }
    });

    // Track this class's schedule
    const dayState = {};
    DAYS.forEach(day => dayState[day] = {
        morningPeriods: new Set(),
        afternoonPeriods: new Set(),
    });

    // Helper: Mark period as used
    function markUsed(day, start, end, roomId, teacherId) {
        for (let p = start; p <= end; p++) {
            const key = `${day}-${p}`;
            if (!globalOccupied[key]) globalOccupied[key] = { rooms: new Set(), teachers: new Set() };
            if (roomId) globalOccupied[key].rooms.add(roomId);
            if (teacherId) globalOccupied[key].teachers.add(teacherId);

            if (p <= 4) dayState[day].morningPeriods.add(p);
            else if (p >= 6) dayState[day].afternoonPeriods.add(p);
        }
    }

    // Helper: Check resource availability
    const isRoomFree = (day, p, roomId) => {
        const key = `${day}-${p}`;
        return !globalOccupied[key]?.rooms.has(roomId);
    };

    function isTeacherAvailable(day, p, teacherId) {
        if (!teacherId) return true;
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher || !teacher.unavailableTimes) return true;

        // Check strict unavailable times
        let unavailable = teacher.unavailableTimes;
        if (typeof unavailable === 'string') {
            try { unavailable = JSON.parse(unavailable); } catch { return true; }
        }
        if (!Array.isArray(unavailable)) return true;

        const dayIndex = DAYS.indexOf(day) + 1;
        for (const slot of unavailable) {
            if (slot.day === dayIndex && Array.isArray(slot.periods) && slot.periods.includes(p)) return false;
        }
        return true;
    }

    const isTeacherFree = (day, p, teacherId) => {
        if (!teacherId) return true;
        if (!isTeacherAvailable(day, p, teacherId)) return false;
        const key = `${day}-${p}`;
        return !globalOccupied[key]?.teachers.has(teacherId);
    };

    // Prepare Queue: Breakdown subjects into 1-hour blocks but keep reference to full duration preference?
    // User wants continuous blocks. Better to keep subjects as chunks (e.g., 2h, 3h) and try to fit them.
    // However, the "queue" logic in original code split them.
    // Let's create a queue of "Subject instances" with preferred duration (max 2-3 hours).

    let subjectQueue = [];
    subjects.forEach(sub => {
        let theoryLeft = sub.theoryHours || 0;
        let practiceLeft = sub.practiceHours || 0;

        // Break into max 4-hour chunks (usually max continuous is 3-4)
        while (theoryLeft > 0) {
            let dur = Math.min(theoryLeft, 2); // Prefer 2 hour blocks for theory
            if (theoryLeft === 3) dur = 3; // Keep 3 hours together if possible
            subjectQueue.push({ ...sub, duration: dur, isPractice: false, originalSubjectId: sub.subjectId || sub.id });
            theoryLeft -= dur;
        }
        while (practiceLeft > 0) {
            let dur = Math.min(practiceLeft, 4); // Practice can be longer, e.g. 4 hours
            subjectQueue.push({ ...sub, duration: dur, isPractice: true, originalSubjectId: sub.subjectId || sub.id });
            practiceLeft -= dur;
        }
    });

    // Shuffle for randomness
    subjectQueue.sort(() => Math.random() - 0.5);

    // Filter rooms
    const labRooms = rooms.filter(r => r.type?.match(/lab|workshop|ปฏิบัติ/i));
    const regularRooms = rooms.filter(r => !labRooms.includes(r));

    const findRoom = (day, start, duration, isPractice, studentCount = 0) => {
        const targetRooms = isPractice ? [...labRooms, ...regularRooms] : [...regularRooms, ...labRooms];
        for (const r of targetRooms) {
            if (studentCount > 0 && r.capacity && r.capacity < studentCount) continue;
            let free = true;
            for (let i = 0; i < duration; i++) {
                if (start + i === LUNCH_PERIOD || start + i > MAX_PERIOD) { free = false; break; } // Cannot schedule over lunch or past max
                if (!isRoomFree(day, start + i, r.id)) { free = false; break; }
            }
            if (free) return r.id;
        }
        return null;
    };

    const findAnyTeacher = (day, start, duration) => {
        for (const t of teachers) {
            let free = true;
            for (let i = 0; i < duration; i++) {
                if (start + i === LUNCH_PERIOD || start + i > MAX_PERIOD) { free = false; break; } // Cannot schedule over lunch or past max
                if (!isTeacherFree(day, start + i, t.id)) { free = false; break; }
            }
            if (free) return t.id;
        }
        return null;
    };

    // MAIN ALGORITHM: Day-by-Day Filling
    // We try to fill strictly: Mon(1..9) -> Tue(1..9)...
    // Within a day: 1->2->3->4 (Morning MUST be full) -> Check -> 6->7->8->9

    // To ensure "Morning First", we will simply iterate periods 1..4 first for ALL days? 
    // No, user said "Fill each day fully" (เต็มทุกวันก่อน). This likely means Mon Morning, Mon Afternoon -> Tue Morning...
    // BUT "Morning first before afternoon" (ทุกวันต้องมีถึงเที่ยงก่อนถึงจะขึ้นบ่าย) applies per day.

    // Phase 1: Fill Morning (Periods 1-4) for ALL days first
    for (const day of DAYS) {
        for (let p = 1; p <= 4; p++) {
            if (dayState[day].morningPeriods.has(p)) continue; // Already filled

            // Find a subject that fits starting at p
            let bestIdx = -1;

            for (let i = 0; i < subjectQueue.length; i++) {
                const item = subjectQueue[i];
                if (p + item.duration - 1 > 4) continue;

                let effectiveDuration = item.duration;

                // Check Resources
                let tId = item.teacherId;
                let teacherOk = true;
                for (let k = 0; k < effectiveDuration; k++) {
                    if (!isTeacherFree(day, p + k, tId)) { teacherOk = false; break; }
                }

                if (!teacherOk && !tId) {
                    tId = findAnyTeacher(day, p, effectiveDuration);
                    teacherOk = !!tId;
                } else if (!teacherOk && tId) {
                    continue;
                }

                const rId = findRoom(day, p, effectiveDuration, item.isPractice, item.studentCount);
                if (!rId) continue;

                bestIdx = i;
                schedule.push({
                    day_of_week: day,
                    start_period: p,
                    end_period: p + effectiveDuration - 1,
                    subject_id: item.originalSubjectId,
                    teacher_id: tId,
                    room_id: rId
                });

                markUsed(day, p, p + effectiveDuration - 1, rId, tId);
                subjectQueue.splice(i, 1);
                p += effectiveDuration - 1;
                break;
            }

            if (bestIdx === -1) break; // Stick to "No Gaps" rule
        }
    }

    // Phase 2: Fill Afternoon (Periods 6-9) for ALL days
    // Only if morning is fully booked (or almost fully? Strict rule says "Full Morning")
    for (const day of DAYS) {
        if (dayState[day].morningPeriods.size < 4) continue; // Skip afternoon if morning not full

        for (let p = 6; p <= 9; p++) {
            if (dayState[day].afternoonPeriods.has(p)) continue;

            let bestIdx = -1;
            for (let i = 0; i < subjectQueue.length; i++) {
                const item = subjectQueue[i];
                if (p + item.duration - 1 > 9) continue;

                // Resource Check
                let tId = item.teacherId;
                let teacherOk = true;
                for (let k = 0; k < item.duration; k++) {
                    if (!isTeacherFree(day, p + k, tId)) { teacherOk = false; break; }
                }

                if (!teacherOk && !tId) {
                    tId = findAnyTeacher(day, p, item.duration);
                    teacherOk = !!tId;
                } else if (!teacherOk && tId) {
                    continue;
                }

                const rId = findRoom(day, p, item.duration, item.isPractice, item.studentCount);
                if (!rId) continue;

                bestIdx = i;
                schedule.push({
                    day_of_week: day,
                    start_period: p,
                    end_period: p + item.duration - 1,
                    subject_id: item.originalSubjectId,
                    teacher_id: tId,
                    room_id: rId
                });
                markUsed(day, p, p + item.duration - 1, rId, tId);
                subjectQueue.splice(i, 1);
                p += item.duration - 1;
                break;
            }

            if (bestIdx === -1) break; // Stick to "No Gaps" rule
        }
    }

    // Sort schedule
    schedule.sort((a, b) => {
        const dayOrder = DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week);
        if (dayOrder !== 0) return dayOrder;
        return a.start_period - b.start_period;
    });

    // Log summary
    console.log("📊 Schedule Summary:");
    let totalMorningDays = 0;
    DAYS.forEach(day => {
        const mCount = dayState[day].morningPeriods.size; // Use .size for Set
        const aCount = dayState[day].afternoonPeriods.size; // Use .size for Set
        const status = mCount >= 4 ? '✓' : '⚠';
        console.log(`  ${day}: เช้า=${mCount}/4, บ่าย=${aCount} ${status}`);
        if (mCount >= MIN_MORNING_PER_DAY) totalMorningDays++;
    });
    console.log(`  📌 วันที่มีครึ่งวันขึ้นไป: ${totalMorningDays}/5`);

    return schedule;
}

export function validateSchedule(schedule) {
    const conflicts = [];

    for (const day of DAYS) {
        const slots = schedule.filter(s => s.day_of_week === day);

        // Count periods
        let morningCount = 0;
        let afternoonCount = 0;

        slots.forEach(s => {
            for (let p = s.start_period; p <= s.end_period; p++) {
                if (p <= 4) morningCount++;
                if (p >= 6) afternoonCount++;
            }
        });

        // Check minimum half day (morning)
        if (slots.length > 0 && morningCount < MIN_MORNING_PER_DAY) {
            conflicts.push(`${day}: เช้าแค่ ${morningCount}/4 (ไม่ถึงครึ่งวัน)`);
        }

        // Check afternoon without full morning
        if (afternoonCount > 0 && morningCount < 4) {
            conflicts.push(`${day}: มีบ่ายแต่เช้าไม่เต็ม!`);
        }
    }

    return conflicts;
}
