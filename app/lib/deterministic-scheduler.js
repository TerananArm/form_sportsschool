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
        }
    });

    // Track this class's schedule
    const dayState = {};
    DAYS.forEach(day => dayState[day] = {
        morningPeriods: [],
        afternoonPeriods: [],
        skipMorning: false
    });

    // Sort rooms
    const labRooms = rooms.filter(r =>
        r.type?.toLowerCase().includes('lab') ||
        r.type?.toLowerCase().includes('workshop') ||
        r.type?.toLowerCase().includes('ปฏิบัติ')
    );
    const regularRooms = rooms.filter(r => !labRooms.includes(r));

    // Helper: Check if room is free
    function isRoomFree(day, start, end, roomId) {
        for (let p = start; p <= end; p++) {
            if (p === LUNCH_PERIOD || p > MAX_PERIOD) return false;
            const key = `${day}-${p}`;
            if (globalOccupied[key]?.rooms.has(roomId)) return false;
        }
        return true;
    }

    // Helper: Check if teacher is available (not in their unavailable times)
    function isTeacherAvailable(day, start, end, teacherId) {
        if (!teacherId) return true;
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher || !teacher.unavailableTimes) return true;

        // Parse unavailableTimes JSON if it's a string
        let unavailable = teacher.unavailableTimes;
        if (typeof unavailable === 'string') {
            try {
                unavailable = JSON.parse(unavailable);
            } catch { return true; }
        }
        if (!Array.isArray(unavailable)) return true;

        // Get day index (1=จันทร์, 5=ศุกร์)
        const dayIndex = DAYS.indexOf(day) + 1;

        // Check if any period overlaps with unavailable times
        for (const slot of unavailable) {
            if (slot.day === dayIndex && Array.isArray(slot.periods)) {
                for (let p = start; p <= end; p++) {
                    if (slot.periods.includes(p)) return false;
                }
            }
        }
        return true;
    }

    // Helper: Check if teacher is free (both schedule-wise and availability-wise)
    function isTeacherFree(day, start, end, teacherId) {
        if (!teacherId) return true;
        // First check unavailable times
        if (!isTeacherAvailable(day, start, end, teacherId)) return false;
        // Then check existing schedules
        for (let p = start; p <= end; p++) {
            if (p === LUNCH_PERIOD || p > MAX_PERIOD) return false;
            const key = `${day}-${p}`;
            if (globalOccupied[key]?.teachers.has(teacherId)) return false;
        }
        return true;
    }

    // Helper: Find any available room (with capacity check if studentCount is provided)
    function findFreeRoom(day, start, end, isPractice, studentCount = 0) {
        const list = isPractice ? [...labRooms, ...regularRooms] : [...regularRooms, ...labRooms];
        for (const room of list) {
            // Check capacity if studentCount is provided
            if (studentCount > 0 && room.capacity && room.capacity < studentCount) {
                continue; // Skip rooms that are too small
            }
            if (isRoomFree(day, start, end, room.id)) return room.id;
        }
        // Fallback: if no room with enough capacity, just find any free room
        for (const room of list) {
            if (isRoomFree(day, start, end, room.id)) return room.id;
        }
        return null;
    }

    // Helper: Find any available teacher (fallback when assigned teacher is busy)
    function findAnyFreeTeacher(day, start, end) {
        for (const teacher of teachers) {
            if (isTeacherFree(day, start, end, teacher.id)) return teacher.id;
        }
        return null;
    }

    // Helper: Mark period as used
    function markUsed(day, start, end, roomId, teacherId) {
        for (let p = start; p <= end; p++) {
            const key = `${day}-${p}`;
            if (!globalOccupied[key]) globalOccupied[key] = { rooms: new Set(), teachers: new Set() };
            if (roomId) globalOccupied[key].rooms.add(roomId);
            if (teacherId) globalOccupied[key].teachers.add(teacherId);

            if (p <= 4) dayState[day].morningPeriods.push(p);
            else if (p >= 6) dayState[day].afternoonPeriods.push(p);
        }
    }

    // Helper: Get next morning period
    function getNextMorning(day) {
        for (let p = 1; p <= 4; p++) {
            if (!dayState[day].morningPeriods.includes(p)) return p;
        }
        return null;
    }

    // Helper: Get next afternoon period
    function getNextAfternoon(day) {
        if (dayState[day].morningPeriods.length < 4) return null; // Morning must be full!
        for (let p = 6; p <= 9; p++) {
            if (!dayState[day].afternoonPeriods.includes(p)) return p;
        }
        return null;
    }

    // Helper: Find day with least morning periods (for even distribution)
    function findDayWithLeastMorning() {
        let bestDay = null;
        let minPeriods = 5;

        for (const day of DAYS) {
            if (dayState[day].skipMorning) continue;
            const count = dayState[day].morningPeriods.length;
            if (count < 4 && count < minPeriods) {
                minPeriods = count;
                bestDay = day;
            }
        }
        return bestDay;
    }

    // Helper: Find day with least afternoon periods (for even distribution)
    function findDayWithLeastAfternoon() {
        let bestDay = null;
        let minPeriods = 5;

        for (const day of DAYS) {
            // Morning must be full before using afternoon!
            if (dayState[day].morningPeriods.length < 4) continue;

            const count = dayState[day].afternoonPeriods.length;
            if (count < 4 && count < minPeriods) {
                minPeriods = count;
                bestDay = day;
            }
        }
        return bestDay;
    }

    // Prepare subject queue
    const shuffledSubjects = [...subjects].sort(() => Math.random() - 0.5);
    const queue = [];

    for (const subject of shuffledSubjects) {
        const totalHours = (subject.theoryHours || 0) + (subject.practiceHours || 0);
        const assignedTeacherId = subject.teacherId || null;

        for (let i = 0; i < totalHours; i++) {
            queue.push({
                subject,
                isPractice: i >= (subject.theoryHours || 0),
                teacherId: assignedTeacherId
            });
        }
    }

    // Shuffle queue
    for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    // PHASE 1: Fill mornings - ROUND ROBIN across all days!
    let queueIndex = 0;
    let dayIndex = 0;
    let morningAttempts = 0;
    const MAX_ATTEMPTS = queue.length * 10;

    while (queueIndex < queue.length && morningAttempts < MAX_ATTEMPTS) {
        morningAttempts++;

        // Round-robin: pick each day in turn for even distribution
        let foundDay = false;
        for (let tries = 0; tries < 5; tries++) {
            const day = DAYS[(dayIndex + tries) % 5];
            if (!dayState[day].skipMorning && dayState[day].morningPeriods.length < 4) {
                foundDay = true;
                dayIndex = (dayIndex + tries + 1) % 5;

                const item = queue[queueIndex];
                const start = getNextMorning(day);

                if (!start) {
                    dayState[day].skipMorning = true;
                    continue;
                }

                // Schedule 1-2 hours
                let hoursToFit = Math.min(2, 4 - dayState[day].morningPeriods.length);
                let end = start + hoursToFit - 1;

                // Check teacher - try assigned first, then fallback to any free teacher
                let teacherToUse = item.teacherId;
                if (!isTeacherFree(day, start, end, teacherToUse)) {
                    // Fallback: find any free teacher
                    teacherToUse = findAnyFreeTeacher(day, start, end);
                    if (!teacherToUse) {
                        // No teacher available, skip this day
                        dayState[day].skipMorning = true;
                        break;
                    }
                }

                // Find room
                const roomId = findFreeRoom(day, start, end, item.isPractice);
                if (!roomId) {
                    dayState[day].skipMorning = true;
                    break;
                }

                // Schedule!
                schedule.push({
                    day_of_week: day,
                    start_period: start,
                    end_period: end,
                    subject_id: item.subject.subjectId,
                    teacher_id: teacherToUse,
                    room_id: roomId
                });

                markUsed(day, start, end, roomId, teacherToUse);
                queueIndex += hoursToFit;
                break;
            }
        }

        if (!foundDay) break; // All days full or skipped
    }

    // PHASE 2: Fill afternoons - ROUND ROBIN across all days!
    dayIndex = 0;
    let afternoonAttempts = 0;

    while (queueIndex < queue.length && afternoonAttempts < MAX_ATTEMPTS) {
        afternoonAttempts++;

        // Round-robin for even distribution
        let foundDay = false;
        for (let tries = 0; tries < 5; tries++) {
            const day = DAYS[(dayIndex + tries) % 5];

            // Morning must be full!
            if (dayState[day].morningPeriods.length < 4) continue;
            if (dayState[day].afternoonPeriods.length >= 4) continue;

            foundDay = true;
            dayIndex = (dayIndex + tries + 1) % 5;

            const item = queue[queueIndex];
            const start = getNextAfternoon(day);

            if (!start) continue;

            // Schedule 1-2 hours
            let hoursToFit = Math.min(2, 9 - start + 1);
            let end = start + hoursToFit - 1;

            // Check teacher - try assigned first, then fallback
            let teacherToUse = item.teacherId;
            if (!isTeacherFree(day, start, end, teacherToUse)) {
                teacherToUse = findAnyFreeTeacher(day, start, end);
                if (!teacherToUse) {
                    dayState[day].afternoonPeriods.push(start);
                    break;
                }
            }

            // Find room
            const roomId = findFreeRoom(day, start, end, item.isPractice);
            if (!roomId) {
                dayState[day].afternoonPeriods.push(start);
                break;
            }

            // Schedule!
            schedule.push({
                day_of_week: day,
                start_period: start,
                end_period: end,
                subject_id: item.subject.subjectId,
                teacher_id: teacherToUse,
                room_id: roomId
            });

            markUsed(day, start, end, roomId, teacherToUse);
            queueIndex += hoursToFit;
            break;
        }

        if (!foundDay) break;
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
        const mCount = dayState[day].morningPeriods.length;
        const aCount = dayState[day].afternoonPeriods.length;
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
