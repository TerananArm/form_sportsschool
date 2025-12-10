import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to clean Gemini output
function cleanJson(text) {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

export async function POST(request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ message: 'ไม่พบ GEMINI_API_KEY' }, { status: 500 });
        }

        const { question } = await request.json();
        if (!question) return NextResponse.json({ message: 'กรุณาระบุคำถาม' }, { status: 400 });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // 1. Schema Definition for AI
        const schemaContext = `
            You are a helpful AI Assistant for a School Management System and also an expert in SQL.
            
            Tables:
            - teachers (id, name, department)
            - subjects (id, code, name, credit, theoryHours, practiceHours, teacher_id)
            - rooms (id, name, type)
            - class_levels (id, name)
            - schedule (id, term, day_of_week, start_period, end_period, subject_id, teacher_id, room_id, class_level)
            - students (id, code, name, class_level, department)
            - departments (id, name)
            - users (id, username, role, name)
            - class_subjects (id, class_level, subject_id, department)
            
            Relationships:
            - schedule.teacher_id -> teachers.id
            - schedule.subject_id -> subjects.id
            - schedule.room_id -> rooms.id
            - students.department -> departments.name (or join on similar name)
            - students.class_level -> schedule.class_level (To find what a student studies)
            
            Rules:
            1. Return a JSON object: { "sql": "...", "message": "..." }
            2. If the user asks for DATA from the database, return "sql".
            3. If the user asks a GENERAL question (e.g., "Hi", "How are you?", "What is physics?"), return "message" with a helpful answer and set "sql" to null.
            4. If the user asks for advice or explanation, return "message".
            5. Use ONLY SELECT statements for SQL.
            6. Use JOINs to get names.
            7. Use LIKE %keyword% for flexible name matching.
            8. 'day_of_week' values are Thai: 'วันจันทร์', 'วันอังคาร', etc.
            9. LIMIT results to 20 rows.
        `;

        // 2. Generate SQL
        const sqlPrompt = `${schemaContext}\n\nQuestion: "${question}"\nJSON:`;
        const sqlResult = await model.generateContent(sqlPrompt);
        const sqlResponse = cleanJson(sqlResult.response.text());

        let queryData;
        try {
            queryData = JSON.parse(sqlResponse);
        } catch (e) {
            // Fallback if JSON parse fails - return raw text as message
            return NextResponse.json({ answer: sqlResponse });
        }

        // Handle General Chat / Non-SQL responses
        if (queryData.message && !queryData.sql) {
            return NextResponse.json({ answer: queryData.message });
        }

        if (queryData.message && queryData.sql) {
            // If both, we can return message but usually frontend expects one. 
            // Logic below handles SQL execution. We can append message if SQL returns nothing?
            // For now, let SQL take precedence if present.
        }

        if (!queryData.sql) {
            // Should have been caught by message check, but just in case
            return NextResponse.json({ answer: queryData.message || 'ขออภัย ไม่เข้าใจคำถามครับ' });
        }

        // 3. Execute SQL (Safe Check)
        if (!queryData.sql.toLowerCase().trim().startsWith('select')) {
            return NextResponse.json({ answer: queryData.message || 'ระบบอนุญาตเฉพาะการค้นหาข้อมูลเท่านั้น' });
        }

        let dbResults = [];
        try {
            const [rows] = await db.execute(queryData.sql);
            dbResults = rows;
        } catch (dbError) {
            console.error("SQL Error:", dbError, queryData.sql);
            return NextResponse.json({ answer: 'ขออภัยครับ ผมพยายามค้นหาแล้วแต่ไม่พบข้อมูล หรือคำถามซับซ้อนเกินไป ลองระบุชื่อหรือเงื่อนไขให้ชัดเจนขึ้นนะครับ', sql: queryData.sql });
        }

        // 4. Summarize Results
        if (dbResults.length === 0) {
            return NextResponse.json({ answer: 'ไม่พบข้อมูลที่ตรงกับคำถามของคุณครับ' });
        }

        const summaryPrompt = `
            Data: ${JSON.stringify(dbResults)}
            User Question: "${question}"
            
            Task: Summarize this data to answer the user's question in Thai.
            - Be concise and natural.
            - If it's a list, format it nicely.
            - If it's a count, state it clearly.
        `;

        const summaryResult = await model.generateContent(summaryPrompt);
        const finalAnswer = summaryResult.response.text();

        return NextResponse.json({ answer: finalAnswer, sql: queryData.sql });

    } catch (error) {
        console.error("Smart Query Error:", error);
        return NextResponse.json({ message: 'Internal Server Error: ' + error.message, stack: error.stack }, { status: 500 });
    }
}
