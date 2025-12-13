/**
 * Fallback Scheduler with New Rules:
 * 1. ถ้าคาบเกิน 4 ชม. → แบ่งใส่เช้า 4 ชม. + ส่วนที่เหลือไปบ่าย
 * 2. เช้าต้องเต็มทุกวัน (4 คาบ) ห้ามว่างแม้แต่ 1 ชม.
 * 3. บ่ายมีความสำคัญต่ำสุด (ใส่หลังเช้าเต็มแล้ว)
 * 4. ห้ามเรียนเกิน 5 โมงเย็น (Period 9) ถ้าเกินให้ไปใส่วันอื่น
 */

export async function generateDeterministicSchedule(subjects, rooms, teachers, term, classLevelId, db) {
    console.log("⚠️ Switching to DETERMINISTIC Fallback Scheduler (Morning-First Priority)...");

    const days = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์'];
    const schedule = [];

    // Constants
    const MORNING_START = 1;
    const MORNING_END = 4;      // เช้า: คาบ 1-4
    const AFTERNOON_START = 6;
    const AFTERNOON_END = 9;    // บ่าย: คาบ 6-9 (ถึง 5 โมงเย็น)
    const MAX_MORNING_PERIODS = 4;
    const MAX_AFTERNOON_PERIODS = 4;

    // Track usage per day
    const dayUsage = {};
    days.forEach(d => {
        dayUsage[d] = {
            morning: [],      // Array of used periods in morning
            afternoon: [],    // Array of used periods in afternoon
        };
    });

    // Helper: Get available periods count
    const getMorningAvailable = (day) => MAX_MORNING_PERIODS - dayUsage[day].morning.length;
    const getAfternoonAvailable = (day) => MAX_AFTERNOON_PERIODS - dayUsage[day].afternoon.length;
    const isMorningFull = (day) => dayUsage[day].morning.length >= MAX_MORNING_PERIODS;
    const isAfternoonFull = (day) => dayUsage[day].afternoon.length >= MAX_AFTERNOON_PERIODS;
    const areAllMorningsFull = () => days.every(d => isMorningFull(d));

    // Helper: Check if slot is busy in our CURRENT generated schedule
    const isInternalBusy = (day, start, end) => {
        return schedule.some(s =>
            s.day_of_week === day &&
            Math.max(s.start_period, start) <= Math.min(s.end_period, end)
        );
    };

    // Helper: Check database for External Conflicts (Teacher/Room)
    const isExternalBusy = async (day, start, end, teacherId, roomId) => {
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

    // Helper: Find contiguous slot
    const findSlot = (day, hours, periodStart, periodEnd) => {
        for (let start = periodStart; start <= periodEnd - hours + 1; start++) {
            const end = start + hours - 1;
            if (end > periodEnd) continue;

            // Check if all periods are free
            const usedPeriods = periodStart === MORNING_START
                ? dayUsage[day].morning
                : dayUsage[day].afternoon;

            let allFree = true;
            for (let p = start; p <= end; p++) {
                if (usedPeriods.includes(p)) {
                    allFree = false;
                    break;
                }
            }
            if (allFree && !isInternalBusy(day, start, end)) {
                return { start, end };
            }
        }
        return null;
    };

    // Helper: Mark periods as used
    const markUsed = (day, start, end) => {
        for (let p = start; p <= end; p++) {
            if (p >= MORNING_START && p <= MORNING_END) {
                if (!dayUsage[day].morning.includes(p)) dayUsage[day].morning.push(p);
            } else if (p >= AFTERNOON_START && p <= AFTERNOON_END) {
                if (!dayUsage[day].afternoon.includes(p)) dayUsage[day].afternoon.push(p);
            }
        }
    };

    // Helper: Schedule a block
    const scheduleBlock = async (day, start, end, subjectId, teacherId, potentialRooms) => {
        for (const room of potentialRooms) {
            const busy = await isExternalBusy(day, start, end, teacherId, room.id);
            if (!busy) {
                schedule.push({
                    day_of_week: day,
                    start_period: start,
                    end_period: end,
                    subject_id: subjectId,
                    teacher_id: teacherId,
                    room_id: room.id
                });
                markUsed(day, start, end);
                return true;
            }
        }
        return false;
    };

    // Sort subjects: Longer hours first (harder to schedule)
    const sortedSubjects = [...subjects].sort((a, b) => {
        const totalA = (a.theoryHours || 0) + (a.practiceHours || 0);
        const totalB = (b.theoryHours || 0) + (b.practiceHours || 0);
        return totalB - totalA;
    });

    // ==========================================
    // PHASE 1: Fill ALL mornings first
    // ==========================================
    for (const sub of sortedSubjects) {
        let totalHours = (sub.theoryHours || 0) + (sub.practiceHours || 0);
        if (totalHours === 0) continue;

        // Find Teacher
        let teacherId = sub.teacherId;
        if (!teacherId || teacherId === 0) {
            if (teachers.length > 0) {
                teacherId = teachers[Math.floor(Math.random() * teachers.length)].id;
            }
        }

        // Find suitable rooms
        const suitableRooms = rooms.filter(r =>
            sub.practiceHours > 0
                ? (r.type === 'Lab' || r.type === 'Workshop')
                : true
        );
        const potentialRooms = suitableRooms.length > 0 ? suitableRooms : rooms;

        // Store remaining hours to schedule in afternoon phase
        sub._remainingHours = totalHours;
        sub._teacherId = teacherId;
        sub._potentialRooms = potentialRooms;

        // Try to schedule as much as possible in morning
        // Sort days by least used morning first
        const daysByMorningUsage = [...days].sort((a, b) =>
            getMorningAvailable(b) - getMorningAvailable(a) // Most available first
        );

        for (const day of daysByMorningUsage) {
            if (sub._remainingHours <= 0) break;
            if (isMorningFull(day)) continue;

            // Calculate how many hours we can fit in this morning
            const availableMorning = getMorningAvailable(day);
            const hoursForMorning = Math.min(sub._remainingHours, availableMorning);

            if (hoursForMorning <= 0) continue;

            const slot = findSlot(day, hoursForMorning, MORNING_START, MORNING_END);
            if (slot) {
                const scheduled = await scheduleBlock(
                    day, slot.start, slot.end,
                    sub.subjectId, teacherId, potentialRooms
                );
                if (scheduled) {
                    sub._remainingHours -= hoursForMorning;
                }
            }
        }
    }

    // ==========================================
    // PHASE 2: Schedule remaining hours to afternoon (after ALL mornings are filled)
    // ==========================================
    for (const sub of sortedSubjects) {
        if (!sub._remainingHours || sub._remainingHours <= 0) continue;

        const teacherId = sub._teacherId;
        const potentialRooms = sub._potentialRooms;

        // Sort days by least used afternoon first
        const daysByAfternoonUsage = [...days].sort((a, b) =>
            getAfternoonAvailable(b) - getAfternoonAvailable(a)
        );

        for (const day of daysByAfternoonUsage) {
            if (sub._remainingHours <= 0) break;
            if (isAfternoonFull(day)) continue;

            const availableAfternoon = getAfternoonAvailable(day);
            const hoursForAfternoon = Math.min(sub._remainingHours, availableAfternoon);

            if (hoursForAfternoon <= 0) continue;

            const slot = findSlot(day, hoursForAfternoon, AFTERNOON_START, AFTERNOON_END);
            if (slot) {
                const scheduled = await scheduleBlock(
                    day, slot.start, slot.end,
                    sub.subjectId, teacherId, potentialRooms
                );
                if (scheduled) {
                    sub._remainingHours -= hoursForAfternoon;
                }
            }
        }

        if (sub._remainingHours > 0) {
            console.warn(`⚠️ Could not schedule ${sub._remainingHours} hours of Subject ${sub.code} - All slots full.`);
        }
    }

    console.log(`✅ Generated ${schedule.length} schedule entries with Morning-First Priority.`);
    console.log(`📊 Morning usage: ${days.map(d => `${d.substring(3, 5)}:${dayUsage[d].morning.length}`).join(', ')}`);
    console.log(`📊 Afternoon usage: ${days.map(d => `${d.substring(3, 5)}:${dayUsage[d].afternoon.length}`).join(', ')}`);

    return schedule;
}

