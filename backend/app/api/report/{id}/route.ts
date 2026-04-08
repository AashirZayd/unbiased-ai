import { NextResponse } from 'next/server';
import { db } from "@/lib/firebaseAdmin";
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 Check DB
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const report_id = params.id;

    // 📦 Fetch from Firebase
    const docRef = db.collection("analysis_results").doc(report_id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const data = doc.data();

    // 🧠 Gemini Enhancement
    let enhancedReport = data?.report || "";

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && enhancedReport) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash"
        });

        const prompt = `
You are an AI fairness expert.

Rewrite this bias report in a professional and clear format.

Original Report:
${enhancedReport}

Return a structured explanation with:
- Summary
- Key Issues
- Impact
- Recommendations
`;

        const result = await model.generateContent(prompt);
        enhancedReport = result.response.text();
      } catch (err) {
        console.log("Gemini enhancement failed:", err);
      }
    }

    // 🧾 FINAL RESPONSE
    return NextResponse.json({
      status: "success",
      data: {
        id: doc.id,
        filename: data?.filename || null,
        timestamp: data?.timestamp || null,

        // 🔴 BEFORE FIX DATA
        score: data?.score || 0,
        groups: data?.groups || [],
        issues: data?.issues || [],

        // 📊 REPORT
        report: enhancedReport,
        recommendations: data?.recommendations || [],

        // 📈 META
        rows_analyzed: data?.rows_analyzed || 0
      }
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}