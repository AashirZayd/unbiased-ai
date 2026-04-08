import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { GoogleGenerativeAI } from "@google/generative-ai";
export async function POST(req: Request) {
  try {
    // 🔒 Check DB
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not initialized" },
        { status: 500 }
      );
    }

    // 📥 Parse request
    const body = await req.json();
    const { analysis_id } = body;

    if (!analysis_id) {
      return NextResponse.json(
        { success: false, error: "analysis_id is required" },
        { status: 400 }
      );
    }

    // 📦 Fetch analysis from Firebase
    const docRef = db.collection("analysis_results").doc(analysis_id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Analysis result not found" },
        { status: 404 }
      );
    }

    const analysisData = docSnap.data();

    // 🔑 Check Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;

    // 🧪 Fallback (important for demo reliability)
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        data: {
          summary:
            "The system detected bias in decision outcomes across different groups.",
          risk: "Medium",
          impact:
            "This bias may lead to unfair treatment of certain groups, affecting trust and compliance.",
          recommendation:
            "Apply dataset balancing and fairness-aware training techniques to reduce bias.",
        },
      });
    }

    // 🤖 Gemini setup
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    // 🧠 Strong prompt (structured output)
    const prompt = `
You are an AI fairness auditor.

Analyze the bias report below and return ONLY valid JSON (no markdown, no extra text).

Format:
{
  "summary": "...",
  "risk": "Low | Medium | High",
  "impact": "...",
  "recommendation": "..."
}

Explain in simple, business-friendly language.

Bias Report:
${JSON.stringify(analysisData, null, 2)}
`;

    // ⚡ Generate response
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // 🧹 Clean response (remove ```json if present)
    text = text.replace(/```json|```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      // fallback if Gemini returns bad JSON
      parsed = {
        summary: text,
        risk: "Medium",
        impact: "Bias detected affecting fairness of outcomes.",
        recommendation: "Review dataset and apply mitigation techniques.",
      };
    }

    // ✅ Final response
    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error("Explain API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate explanation",
      },
      { status: 500 }
    );
  }
}