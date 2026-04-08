import { NextResponse } from "next/server";
import { db } from "../../../lib/firebaseAdmin";
import { generateAIReport } from "../../../lib/gemini";
import { sendReportEmail } from "../../../lib/email";

// 🔥 CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 🔥 OPTIONS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
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
    const { data } = await req.json();

    // 🔥 VALIDATION
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty dataset" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 🔥 CLEAN DATA
    const cleaned = data
      .map((row: any) => ({
        gender: String(row.gender || "").toLowerCase().trim(),
        selected: Number(row.selected),
      }))
      .filter(
        (r: any) =>
          r.gender && (r.selected === 0 || r.selected === 1)
      );

    if (cleaned.length === 0) {
      return NextResponse.json(
        { error: "No valid rows after cleaning" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 🔥 CALCULATE BIAS
    const result = calculateBias(cleaned);

    // 🔥 GEMINI AI REPORT (CLEAN + SAFE)
    let ai;
    try {
      ai = await generateAIReport(JSON.stringify(result));
      console.log("AI OUTPUT:", ai);
    } catch (err) {
      console.error("Gemini failed:", err);

      ai = {
        report: "AI temporarily unavailable",
        issues: [],
        recommendations: [],
      };
    }

    const doc = {
      timestamp: new Date().toISOString(),
      rows_analyzed: cleaned.length,
      ...result,
      ...ai,
    };

    // 🔥 SAVE TO FIREBASE (SAFE)
    try {
      await db.collection("analysis_results").add(doc);
    } catch (err) {
      console.error("Firebase failed:", err);
    }

    // 🔥 SEND EMAIL (CHANGE EMAIL HERE)
    try {
      await sendReportEmail(doc);
    } catch (err) {
      console.error("Email failed:", err);
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