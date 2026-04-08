import { NextResponse } from "next/server";
import { db } from "../../../lib/firebaseAdmin";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

// 🔥 CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // or "http://localhost:3001" for more security
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 🔥 Handle OPTIONS preflight request
export async function OPTIONS(req: Request) {
  return NextResponse.json({}, { headers: corsHeaders });
}

// 🔥 SAFE AI CALL (NO CRASH GUARANTEE)
async function callAI(summary: string) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
Return ONLY valid JSON. No markdown.

Analyze this dataset:

${summary}
                  `,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await res.json();

    let text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    console.log("Gemini RAW:", text);

    // 🔥 CLEAN MARKDOWN IF EXISTS
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(text);

  } catch (err) {
    console.error("Gemini failed:", err);

    return {
      score: 5,
      issues: ["AI unavailable"],
      report: "Fallback analysis (AI failed)",
      recommendations: [],
    };
  }
}

// 🔥 BIAS CALCULATION
function calculateBias(data: any[]) {
  const groups: any = {};

  data.forEach((row) => {
    const g = row.gender;

    if (!g) return;

    if (!groups[g]) {
      groups[g] = { total: 0, positive: 0 };
    }

    groups[g].total++;

    if (row.selected === 1) {
      groups[g].positive++;
    }
  });

  const rates: any = {};

  Object.keys(groups).forEach((g) => {
    rates[g] =
      groups[g].total > 0
        ? groups[g].positive / groups[g].total
        : 0;
  });

  const values = Object.values(rates) as number[];

  const bias =
    values.length > 1
      ? Math.max(...values) - Math.min(...values)
      : 0;

  return {
    biasScore: (bias * 10).toFixed(2),
    groups: rates,
  };
}

// 🚀 MAIN API
export async function POST(req: Request) {
  try {
    const body = await req.json();
    let data = body.data;

    // 🔥 VALIDATION
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty dataset" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 🔥 CLEAN DATA
    data = data.map((row: any) => ({
      gender: String(row.gender || "").toLowerCase().trim(),
      selected: Number(row.selected),
    }));

    data = data.filter(
      (r: any) =>
        r.gender &&
        (r.selected === 0 || r.selected === 1)
    );

    if (data.length === 0) {
      return NextResponse.json(
        { error: "No valid rows after cleaning" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 🔥 BIAS CALCULATION
    const result = calculateBias(data);

    // 🔥 GEMINI (SAFE)
    let ai;
    try {
      ai = await callAI(JSON.stringify(result));
    } catch (err) {
      console.error("AI failed:", err);

      ai = {
        report: "AI temporarily unavailable",
        issues: [],
        recommendations: [],
      };
    }

    const doc = {
      timestamp: new Date().toISOString(),
      rows_analyzed: data.length,
      ...result,
      ...ai,
    };

    // 🔥 SAVE (OPTIONAL SAFE)
    try {
      await db.collection("analysis_results").add(doc);
    } catch (err) {
      console.error("Firebase failed:", err);
    }

    return NextResponse.json(
      {
        status: "success",
        data: doc,
      },
      { headers: corsHeaders }
    );

  } catch (e: any) {
    console.error("ANALYZE ERROR:", e);

    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}