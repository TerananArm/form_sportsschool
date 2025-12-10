// app/api/ai-assistant/route.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request) {
    const { prompt } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Fallback to gemini-pro (1.0) as 1.5 models are returning 404 for this key
        const model = genAI.getGenerativeModel({
            model: "gemini-pro",
            systemInstruction: "คุณคือผู้ช่วยอัจฉริยะ..." // (อย่าลืมใส่ systemInstruction ตามที่แนะนำไปก่อนหน้า)
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({
            answer: text
        });

    } catch (error) {
        console.error("AI Assistant Error:", error);
        return NextResponse.json({ error: 'AI Error: ' + error.message }, { status: 500 });
    }
}