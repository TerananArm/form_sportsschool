import { GoogleGenAI } from "@google/genai";

interface ScheduleInput {
  teachers: any[];
  subjects: any[];
  rooms: any[];
  courses: any[];
}

export async function generateSchedule(data: ScheduleInput) {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  
  // Initialize GoogleGenAI with the new library pattern
  const ai = new GoogleGenAI({ apiKey });

  // List of models to try in order of preference/speed
  const models = [
    "gemini-2.0-flash", 
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ];

  for (const modelName of models) {
    try {
      console.log(`Attempting to generate schedule with model: ${modelName}`);
      
      const prompt = `
        You are an expert school scheduler. Create a conflict-free schedule for the following data:
        
        Teachers: ${JSON.stringify(data.teachers)}
        Subjects: ${JSON.stringify(data.subjects)}
        Rooms: ${JSON.stringify(data.rooms)}
        Courses: ${JSON.stringify(data.courses)}

        Constraints:
        1. No teacher can be in two places at once.
        2. No room can be used by two courses at once.
        3. Room capacity must meet or exceed course enrollment (assume 30 if not specified).
        4. Schedule classes between 8:00 and 16:00.
        5. Return ONLY a JSON array of schedule objects.
        
        Output Format (JSON Array):
        [
          {
            "courseId": "...",
            "teacherId": "...",
            "roomId": "...",
            "dayOfWeek": 1, // 1=Monday, 5=Friday
            "startTime": "09:00",
            "endTime": "10:30"
          }
        ]
        
        Do not include markdown formatting like \`\`\`json. Just the raw JSON.
      `;

      // Call API using the new structure
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      // Access text directly from the response object
      const text = response.text;

      console.log(`Model ${modelName} response:`, text?.substring(0, 100) + "...");

      // Clean up potential markdown code blocks
      const cleanText = text?.replace(/```json/g, "").replace(/```/g, "").trim();
      
      if (!cleanText) throw new Error("Empty response received from AI");

      return JSON.parse(cleanText);

    } catch (error: any) {
      console.error(`Error with model ${modelName}:`, error.message);
      // If this was the last model, throw the error
      if (modelName === models[models.length - 1]) {
        throw new Error(`Failed to generate schedule after trying all models. Last error: ${error.message}`);
      }
      // Otherwise continue to next model
      console.log("Switching to fallback model...");
    }
  }
}