import { GoogleGenAI, Type } from "@google/genai";
import { Student, Payment } from "../types";

export const getPaymentInsights = async (students: Student[], payments: Payment[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const currentMonth = new Date().toISOString().slice(0, 7);
  const dataSummary = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.isActive).length,
    totalPayments: payments.length,
    paymentsThisMonth: payments.filter(p => p.month === currentMonth).length,
    studentsList: students.map(s => ({ 
      name: s.englishName, 
      id: s.id,
      phone: s.parentPhone,
      category: s.category,
      dayType: s.dayType,
      paidThisMonth: payments.some(p => p.studentId === s.id && p.month === currentMonth)
    }))
  };

  const prompt = `
    Analyze this student payment data for ${currentMonth}. Currency is Myanmar Kyat (MMK).
    Identify students who haven't paid. Group them by their Level and Day Type.
    Summarize total revenue (Ks).
    Data: ${JSON.stringify(dataSummary)}
    
    Provide a professional summary:
    1. Financial Status (Paid vs Unpaid count)
    2. Defaulter List (List English names, Levels, Day Type, and phone numbers)
    3. Specific recommendations for contacting parents.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Unable to generate insights at this time.";
  }
};

export const extractStudentsFromText = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Extract student details from this text. Look for English Name, any Burmese Name, and Phone Number. 
    Return a clean JSON array of objects. 
    Format: [{"englishName": "...", "burmeseName": "...", "parentPhone": "..."}]
    Text: ${text}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              englishName: { type: Type.STRING },
              burmeseName: { type: Type.STRING },
              parentPhone: { type: Type.STRING },
            },
            required: ["englishName", "burmeseName", "parentPhone"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Extraction Error:", error);
    throw new Error("Unable to parse student list.");
  }
};