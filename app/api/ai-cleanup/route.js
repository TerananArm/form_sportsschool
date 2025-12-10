import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { data, type } = await request.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
        }

        if (!data || !Array.isArray(data) || data.length === 0) {
            return NextResponse.json({ error: 'No data provided' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Construct a prompt based on the data type
        let instructions = "";
        if (type === 'students' || type === 'teachers' || type === 'users') {
            instructions = `
            Format the following JSON data according to Thai database standards:
            1. Name Formatting:
               - Remove prefixes like "นาย", "นาง", "น.ส.", "ด.ช.", "ด.ญ.", "Mr.", "Mrs.", "Miss" FROM the 'name' or 'fullname' field if they exist. We only want the first name and last name.
               - Ensure there is exactly one space between First Name and Last Name.
               - Fix any obvious spacing issues (e.g., "Som chai" -> "Somchai").
               - Correct common Thai typos if obvious.
            2. Date Formatting:
               - If there is a 'birthdate' field, ensure it is in 'YYYY-MM-DD' format.
            3. General:
               - Do not change IDs, Codes, or Usernames.
               - Return ONLY the cleaned JSON array. Do not include markdown formatting or explanations.
            `;
        } else {
            instructions = `
            Format the following JSON data according to standard database practices:
            1. Fix spacing issues in text fields.
            2. Return ONLY the cleaned JSON array.
            `;
        }

        const prompt = `${instructions}\n\nData to clean:\n${JSON.stringify(data)}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown code blocks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const cleanedData = JSON.parse(text);

        return NextResponse.json(cleanedData);

    } catch (error) {
        console.error("AI Cleanup Error:", error);
        return NextResponse.json({ error: 'AI Error: ' + error.message }, { status: 500 });
    }
}
