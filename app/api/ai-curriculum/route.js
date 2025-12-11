import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
        const { department, classLevel } = await request.json();

        // 1. ดึงข้อมูลวิชาที่มีอยู่ทั้งหมดในระบบเพื่อเป็นตัวเลือก
        const [allSubjects] = await db.execute("SELECT id, code, name, credit, theoryHours, practiceHours FROM subjects ORDER BY code ASC");

        // 2. Prompt
        // 2. Prompt
        const prompt = `
            Act as an Academic Advisor for a Vocational College in Thailand.
            Recommend suitable subjects for the Class Level: "${classLevel}" and Department: "${department}".
            
            Available Subjects (JSON):
            ${JSON.stringify(allSubjects)}
            
            Task:
            1. Analyze the subjects and the student's level/department.
            2. Select subjects that fit the curriculum best.
            3. Return a JSON object with a single key "recommendedIds" containing an array of subject IDs.
            
            Output Example:
            { "recommendedIds": ["SUBJ001", "SUBJ002"] }
        `;

        // Use generation config for JSON
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });
        const response = await result.response;
        const text = response.text();

        let recommendedIds;
        try {
            recommendedIds = JSON.parse(cleanJson(text));
        } catch (e) {
            return NextResponse.json({ message: 'AI ตอบกลับผิดพลาด' }, { status: 500 });
        }

        return NextResponse.json({ ...recommendedIds });

    } catch (error) {
        console.error("AI Curriculum Error:", error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาด: ' + error.message }, { status: 500 });
    }
}
