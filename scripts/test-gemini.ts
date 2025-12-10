import { generateSchedule } from '../lib/gemini';
import 'dotenv/config';

async function testGemini() {
    console.log('Starting Gemini Schedule Generation Test...');

    if (!process.env.GEMINI_API_KEY) {
        console.error('Error: GEMINI_API_KEY is not set in .env file');
        process.exit(1);
    }

    const mockData = {
        teachers: [
            { id: 't1', name: 'John Doe', email: 'john@example.com' },
            { id: 't2', name: 'Jane Smith', email: 'jane@example.com' }
        ],
        subjects: [
            { id: 's1', code: 'MATH101', name: 'Mathematics', credits: 3 },
            { id: 's2', code: 'ENG101', name: 'English', credits: 3 }
        ],
        rooms: [
            { id: 'r1', name: 'Room 101', capacity: 30 },
            { id: 'r2', name: 'Room 102', capacity: 30 }
        ],
        courses: [
            { id: 'c1', subjectId: 's1', subject: { code: 'MATH101' } },
            { id: 'c2', subjectId: 's2', subject: { code: 'ENG101' } }
        ]
    };

    try {
        console.log('Sending request to Gemini...');
        const schedule = await generateSchedule(mockData);
        console.log('Successfully generated schedule:');
        console.log(JSON.stringify(schedule, null, 2));
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testGemini();
