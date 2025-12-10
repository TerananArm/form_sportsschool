const { GoogleGenerativeAI } = require('@google/generative-ai');
const mysql = require('mysql2/promise');
require('dotenv').config();

function cleanJson(text) {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nextjs_login'
    });

    try {
        console.log('🤖 Testing AI Curriculum...');

        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY not found');
            return;
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const department = 'เทคโนโลยีสารสนเทศ';
        const classLevel = 'ปวช. 1/1';

        // 1. Get Subjects
        const [allSubjects] = await connection.execute("SELECT id, code, name, credit, theory_hours, practice_hours FROM subjects ORDER BY code ASC");
        console.log(`📚 Found ${allSubjects.length} subjects.`);

        // 2. Prompt
        const prompt = `
            Act as an Academic Advisor for a Vocational College in Thailand.
            Recommend suitable subjects for the Class Level: "${classLevel}" and Department: "${department}".
            
            Available Subjects in Database:
            ${JSON.stringify(allSubjects)}
            
            Task:
            1. Select subjects from the "Available Subjects" list that are most appropriate for this specific class and department.
            2. If a subject is highly recommended (Core subject for this major), mark it as "recommended".
            3. Return a JSON array of the recommended subject IDs.
            
            Output Format (Strict JSON Array of IDs):
            ["subject_id_1", "subject_id_2", ...]
        `;

        console.log('⏳ Generating content...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log('📝 AI Response:', text);

        let recommendedIds;
        try {
            recommendedIds = JSON.parse(cleanJson(text));
            console.log('✅ Parsed JSON:', recommendedIds);
        } catch (e) {
            console.error('❌ JSON Parse Error:', e);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await connection.end();
    }
}

main();
