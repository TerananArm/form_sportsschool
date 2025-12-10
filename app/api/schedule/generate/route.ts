import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSchedule } from '@/lib/gemini';

export async function POST() {
    try {
        // Fetch all necessary data
        // Fetch all necessary data
        const getRows = async (table: string) => {
            const [rows] = await db.execute(`SELECT * FROM ${table}`);
            return rows as any[];
        };

        const [teachers, subjects, rooms, courses] = await Promise.all([
            getRows('teachers'),
            getRows('subjects'),
            getRows('rooms'),
            getRows('courses'),
        ]);

        if (teachers.length === 0 || rooms.length === 0 || courses.length === 0) {
            return NextResponse.json(
                { error: 'Insufficient data. Please add teachers, rooms, and courses first.' },
                { status: 400 }
            );
        }

        // Generate schedule using Gemini
        console.log(`Generating schedule for ${teachers.length} teachers, ${subjects.length} subjects, ${rooms.length} rooms, ${courses.length} courses`);
        const schedule = await generateSchedule({
            teachers,
            subjects,
            rooms,
            courses,
        });

        return NextResponse.json({ schedule });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate schedule' },
            { status: 500 }
        );
    }
}
