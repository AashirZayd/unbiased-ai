import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateAIReport(summary: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
You are an AI fairness auditor.

Analyze this dataset summary:

${summary}

Return STRICT JSON:
{
  "report": "",
  "issues": [],
  "recommendations": []
}
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // 🔥 CLEAN JSON (VERY IMPORTANT)
    text = text.replace(/```json|```/g, "").trim();

    return JSON.parse(text);

  } catch (err) {
    console.error("Gemini error:", err);

    return {
      report: "AI analysis unavailable",
      issues: [],
      recommendations: [],
    };
  }
}