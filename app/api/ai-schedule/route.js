// app/api/ai-schedule/route.js
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateDeterministicSchedule } from '@/app/lib/fallback-scheduler';

function cleanJson(text) {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

export async function POST(request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ message: 'ไม่พบ GEMINI_API_KEY' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using gemini-flash-latest
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const { term, department, classLevel } = await request.json();

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

        // 1. Fetch Subjects for this Class Level
        let sqlSubjects = `
            SELECT cs.subjectId, s.code, s.name, s.theoryHours, s.practiceHours, 
                   s.teacherId, t.name as teacher_name
            FROM class_subjects cs
            JOIN subjects s ON cs.subjectId = s.id
            LEFT JOIN teachers t ON s.teacherId = t.id 
            WHERE cs.classLevelId = ?
        `;
        const [subjects] = await db.execute(sqlSubjects, [classLevelId]);

        // Shuffle subjects to prevent identical schedules across classes
        for (let i = subjects.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [subjects[i], subjects[j]] = [subjects[j], subjects[i]];
        }

        if (subjects.length === 0) {
            return NextResponse.json({ message: 'ไม่พบรายวิชาที่ลงทะเบียนไว้ในหลักสูตร' }, { status: 400 });
        }

        // 2. Fetch Resources
        const [rooms] = await db.execute("SELECT id, name, type FROM rooms");
        const [teachers] = await db.execute("SELECT id, name FROM teachers");

        // 3. Agentic Loop
        let attempts = 0;
        let maxAttempts = 3;
        let scheduleJson = [];
        let conflicts = [];

        // Prompt Construction
        let currentPrompt = `
            Act as a School Scheduler. Create a weekly class schedule in JSON format.
            
            Inputs:
            - Class Level: "${classLevel}"
            - Subjects to Schedule: ${JSON.stringify(subjects)}
            - Available Rooms: ${JSON.stringify(rooms)}
            - All Teachers: ${JSON.stringify(teachers)}
            
            Constraints & Rules:
            1. **LUNCH BREAK**: Period 5 (12:00-13:00) IS RESERVED. DO NOT SCHEDULE ANYTHING.
            2. **VALID PERIODS**: Use integers 1 to 10. (Morning: 1-4, Afternoon: 6-9/10).
            3. **MORNING PRIORITY**: STRICTLY fill morning periods (1-4) FIRST. Ideally, 80% of classes should start in the morning. Use Afternoon (6-10) ONLY when morning is full.
            4. **FULL WEEK & BALANCED**: 
               - **NO EMPTY DAYS**: Every day (Mon-Fri) MUST have at least 4 periods of class.
               - **DISTRIBUTE**: Spread subjects evenly across the week. Do not stack everything on Monday/Tuesday.
            5. **CONSECUTIVE BLOCKS**: 
               - If a subject has practiceHours > 0, it MUST be a single block of (theoryHours + practiceHours).
               - If practiceHours > 0, assign a Room with type 'Lab' or 'Workshop' if available.
               - If theory only, assign 'Lecture' or 'Classroom'.
            6. **TEACHER ASSIGNMENT**:
               - Use 'teacherId' from input if present.
               - If null, RANDOMLY assign a teacher from 'All Teachers'.
            7. **NO OVERLAP**: 
               - The same teacher cannot teach two classes at the same time.
               - The same room cannot be used twice at the same time.
               - THIS CLASS GROUP ("${classLevel}") cannot have two subjects at the same time.
            
            Output Format (Strict JSON Array):
            [
              {
                "day_of_week": "วันจันทร์",
                "start_period": 1,
                "end_period": 3,
                "subject_id": 101, 
                "teacher_id": 5, 
                "room_id": 2
              }
            ]
        `;

        while (attempts < maxAttempts) {
            attempts++;
            console.log(`🤖 Agent Attempt ${attempts}/${maxAttempts}...`);

            let text = '';
            try {
                const result = await model.generateContent(currentPrompt);
                const response = await result.response;
                text = response.text();
            } catch (apiError) {
                console.warn(`Attempt ${attempts} API Error:`, apiError.message);

                // Fallback Logic: If Quota Exceeded (429) or Service Unavailable (503)
                if (apiError.message.includes('429') || apiError.message.includes('Quota') || apiError.message.includes('503')) {
                    console.log("⚠️ Fallback Triggered: Switching to Deterministic Scheduler...");
                    try {
                        scheduleJson = await generateDeterministicSchedule(subjects, rooms, teachers, term, classLevelId, db);
                        console.log(`✅ Fallback generated ${scheduleJson.length} slots.`);
                        break; // Exit loop, we have a schedule
                    } catch (fallbackError) {
                        console.error("Fallback Failed:", fallbackError);
                        throw fallbackError;
                    }
                }

                if (attempts === maxAttempts) throw apiError;
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            try {
                scheduleJson = JSON.parse(cleanJson(text));
            } catch (e) {
                console.error("JSON Parse Error", e);
                continue;
            }

            // 3.1 Validate Internal & External Conflicts
            conflicts = [];

            // 3.1.1 Internal Overlap Check
            for (let i = 0; i < scheduleJson.length; i++) {
                for (let j = i + 1; j < scheduleJson.length; j++) {
                    const A = scheduleJson[i];
                    const B = scheduleJson[j];
                    if (A.day_of_week === B.day_of_week) {
                        if (Math.max(A.start_period, B.start_period) <= Math.min(A.end_period, B.end_period)) {
                            conflicts.push(`- Internal Conflict: ID ${A.subject_id} and ${B.subject_id} overlap on ${A.day_of_week}.`);
                        }
                    }
                }
            }

            // 3.1.2 External Checks (Teacher & Room) against DB
            for (const item of scheduleJson) {
                if (item.start_period === 5 || (item.start_period < 5 && item.end_period > 5)) {
                    conflicts.push(`- Period 5 is Lunch.`);
                }

                // Exclude current classLevelId from check? Ideally yes, but we delete later.
                // Assuming "term" match.

                if (item.teacher_id) {
                    const [teacherBusy] = await db.execute(
                        `SELECT * FROM schedule 
                         WHERE term = ? AND day_of_week = ? AND teacherId = ? 
                         AND classLevelId != ?
                         AND ((start_period <= ? AND end_period >= ?) OR (start_period <= ? AND end_period >= ?))`,
                        [term, item.day_of_week, item.teacher_id, classLevelId, item.end_period, item.start_period, item.end_period, item.start_period]
                    );
                    if (teacherBusy.length > 0) conflicts.push(`- Teacher ${item.teacher_id} is busy on ${item.day_of_week}.`);
                }

                if (item.room_id) {
                    const [roomBusy] = await db.execute(
                        `SELECT * FROM schedule 
                         WHERE term = ? AND day_of_week = ? AND roomId = ? 
                         AND classLevelId != ?
                         AND ((start_period <= ? AND end_period >= ?) OR (start_period <= ? AND end_period >= ?))`,
                        [term, item.day_of_week, item.room_id, classLevelId, item.end_period, item.start_period, item.end_period, item.start_period]
                    );
                    if (roomBusy.length > 0) conflicts.push(`- Room ${item.room_id} is occupied on ${item.day_of_week}.`);
                }
            }

            if (conflicts.length === 0) {
                console.log("✅ Zero Conflicts Found!");
                break;
            } else {
                console.warn("⚠️ Conflicts:", conflicts);
                currentPrompt += `\n\nERROR: Previous attempt had conflicts:\n${conflicts.join('\n')}\nFix them and regenerate.`;
            }
        }

        if (conflicts.length > 0) {
            return NextResponse.json({ message: `AI Failed to resolve conflicts: ${conflicts[0]}` }, { status: 409 });
        }

        // 4. Save
        // Delete existing for this Class Level and Term
        await db.execute('DELETE FROM schedule WHERE term = ? AND classLevelId = ?', [term, classLevelId]);

        // Helper to convert period to time
        function getPeriodTimes(start, end) {
            const times = {
                1: "08:00", 2: "09:00", 3: "10:00", 4: "11:00",
                5: "12:00", 6: "13:00", 7: "14:00", 8: "15:00",
                9: "16:00", 10: "17:00", 11: "18:00"
            };
            return {
                start: times[start] || "00:00",
                end: times[end + 1] || "00:00" // End time is start of next period? Or just hour + 1
            };
        }

        // Insert new
        for (const item of scheduleJson) {
            const { start, end } = getPeriodTimes(item.start_period, item.end_period);
            await db.execute(
                `INSERT INTO schedule 
                 (term, day, day_of_week, start_period, end_period, startTime, endTime, subjectId, teacherId, classLevelId, roomId, departmentId)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    term,
                    item.day_of_week, // day
                    item.day_of_week, // day_of_week
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

        return NextResponse.json({ message: `จัดตารางสำเร็จ (${scheduleJson.length} คาบ)` });

    } catch (error) {
        console.error("AI Schedule Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}