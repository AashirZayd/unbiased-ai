import { NextResponse } from "next/server";
import { db } from "../../../lib/firebaseAdmin";
import { generateAIReport } from "../../../lib/gemini";
import { sendReportEmail } from "../../../lib/email";

// 🔥 CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// 🔥 ADVANCED COLUMN DETECTION
function detectColumns(data: any[]) {
  if (!data || data.length === 0) {
    return { sensitiveCols: [], targetCol: "" };
  }

  const cols = Object.keys(data[0] || {});

  // Expanded sensitive keywords with fuzzy matching
  const sensitiveKeywords = [
    // gender
    "gender", "sex", "male", "female", "woman", "man",
    
    // race / ethnicity
    "race", "ethnicity", "ethnic", "caste", "religion", "community", "nationality",
    
    // age
    "age", "age_group", "dob", "birth", "birthday", "born",
    
    // location / region
    "region", "location", "country", "city", "state", "province", "zip", "postal",
    
    // socio-economic
    "income", "salary", "economic", "class", "wealth", "poverty",
    
    // education
    "education", "degree", "qualification", "school", "college", "university",
    
    // disability
    "disability", "disabled", "handicap", "special_needs",
    
    // other fairness-related
    "minority", "group", "protected", "demographic"
  ];

  const targetKeywords = [
    // selection outcomes
    "selected", "selection", "select",
    "shortlisted", "shortlist", "short_listed",
    "hired", "hire", "hiring",
    "approved", "approval", "approve",
    "accepted", "acceptance", "accept",
    "passed", "pass", "passing",
    "qualified", "qualification", "qualify",
    "promoted", "promotion",
    
    // ML labels
    "label", "target", "output", "result", "prediction", "predicted",
    
    // binary outcomes
    "status", "decision", "outcome", "response",
    
    // finance / risk
    "loan", "credit", "default", "risk",
    
    // generic fallback names
    "y", "class", "flag", "score", "rating"
  ];

  // Find ALL sensitive columns (not just first)
  const sensitiveCols = cols.filter((col) =>
    sensitiveKeywords.some((keyword) => 
      col.toLowerCase().includes(keyword)
    )
  );

  // Find target column with priority order
  let targetCol = cols.find((col) =>
    targetKeywords.some((keyword) => 
      col.toLowerCase().includes(keyword)
    )
  );

  // Fallback: use last column if no target found
  if (!targetCol && cols.length > 0) {
    targetCol = cols[cols.length - 1];
  }

  return { 
    sensitiveCols: sensitiveCols.length > 0 ? sensitiveCols : [cols[0] || ""], 
    targetCol: targetCol || cols[0] || "" 
  };
}

// 🔥 ROBUST VALUE NORMALIZATION
function normalizeValue(val: any): number {
  // Handle null/undefined
  if (val === null || val === undefined || val === "") {
    return 0;
  }

  // Convert to string and normalize
  const str = String(val).toLowerCase().trim();

  // Positive values
  const positiveValues = [
    "1", "yes", "y", "true", "t",
    "selected", "approved", "hired", "accepted", "passed",
    "qualified", "shortlisted", "positive", "success"
  ];

  // Negative values
  const negativeValues = [
    "0", "no", "n", "false", "f",
    "rejected", "denied", "failed", "declined",
    "not selected", "negative", "fail"
  ];

  if (positiveValues.includes(str)) return 1;
  if (negativeValues.includes(str)) return 0;

  // Try numeric conversion
  const num = Number(val);
  if (!isNaN(num)) {
    return num > 0 ? 1 : 0;
  }

  // Default: treat as negative
  return 0;
}

// 🔥 NORMALIZE GROUP VALUES
function normalizeGroup(val: any): string {
  if (val === null || val === undefined || val === "") {
    return "unknown";
  }

  return String(val).toLowerCase().trim();
}

// 🔥 DATA NORMALIZATION
function normalizeData(data: any[], targetCol: string, sensitiveCol: string) {
  return data
    .map((row: any) => {
      const group = normalizeGroup(row[sensitiveCol]);
      const target = normalizeValue(row[targetCol]);

      return {
        ...row,
        group,
        target,
        _originalGroup: row[sensitiveCol],
        _originalTarget: row[targetCol]
      };
    })
    .filter((row) => {
      // Keep all rows, including "unknown" - important for real datasets
      return true;
    });
}

// 🔥 ADVANCED BIAS CALCULATION
function calculateBias(data: any[]) {
  const groups: Record<string, { total: number; positive: number }> = {};

  // Count by group
  data.forEach((row) => {
    const g = row.group;
    if (!groups[g]) {
      groups[g] = { total: 0, positive: 0 };
    }

    groups[g].total++;
    if (row.target === 1) {
      groups[g].positive++;
    }
  });

  // Calculate selection rates
  const rates: Record<string, number> = {};
  Object.keys(groups).forEach((g) => {
    const { total, positive } = groups[g];
    rates[g] = total > 0 ? positive / total : 0;
  });

  // Calculate bias metrics
  const rateValues = Object.values(rates);
  
  let biasScore = 0;
  let maxRate = 0;
  let minRate = 0;

  if (rateValues.length > 1) {
    maxRate = Math.max(...rateValues);
    minRate = Math.min(...rateValues);
    biasScore = maxRate - minRate; // Statistical parity difference
  }

  return {
    biasScore: (biasScore * 10).toFixed(2), // Scale to 0-10
    groups: rates,
    groupCounts: groups,
    metrics: {
      maxRate: (maxRate * 100).toFixed(1) + "%",
      minRate: (minRate * 100).toFixed(1) + "%",
      difference: (biasScore * 100).toFixed(1) + "%"
    }
  };
}

// 🚀 MAIN HANDLER
export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { data } = body;

    // Validate input
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { 
          status: "error",
          error: "Invalid dataset: must be non-empty array" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Detect columns
    const { sensitiveCols, targetCol } = detectColumns(data);

    if (!targetCol) {
      return NextResponse.json(
        { 
          status: "error",
          error: "Could not detect target column" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use first detected sensitive column
    const sensitiveCol = sensitiveCols[0];

    if (!sensitiveCol) {
      return NextResponse.json(
        { 
          status: "error",
          error: "Could not detect sensitive column" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Normalize data
    const normalized = normalizeData(data, targetCol, sensitiveCol);

    if (normalized.length === 0) {
      return NextResponse.json(
        { 
          status: "error",
          error: "No valid rows after normalization" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Calculate bias
    const biasResult = calculateBias(normalized);

    // Generate AI report (with fallback)
    let aiReport = {
      report: "AI analysis unavailable",
      issues: [] as string[],
      recommendations: [] as string[]
    };

    try {
      const reportData = {
        biasScore: biasResult.biasScore,
        groups: biasResult.groups,
        metrics: biasResult.metrics,
        sensitiveColumn: sensitiveCol,
        targetColumn: targetCol,
        totalRows: normalized.length
      };

      aiReport = await generateAIReport(JSON.stringify(reportData));
    } catch (aiError: any) {
      console.error("AI Report generation failed:", aiError);
      // Fallback already set above
    }

    // Prepare final document
    const finalDoc = {
      timestamp: new Date().toISOString(),
      rows_analyzed: normalized.length,
      detected: { 
        sensitive: sensitiveCol, 
        target: targetCol,
        allSensitiveColumns: sensitiveCols
      },
      ...biasResult,
      report: aiReport.report,
      issues: aiReport.issues,
      recommendations: aiReport.recommendations
    };

    // Try to save to Firestore (non-blocking)
    try {
      await db.collection("analysis_results").add(finalDoc);
    } catch (dbError) {
      console.error("Firestore save failed:", dbError);
      // Don't fail the request
    }

    // Try to send email (non-blocking)
    try {
      await sendReportEmail(finalDoc);
    } catch (emailError) {
      console.error("Email send failed:", emailError);
      // Don't fail the request
    }

    // Return success response
    return NextResponse.json(
      { 
        status: "success", 
        data: finalDoc 
      },
      { headers: corsHeaders }
    );

  } catch (err: any) {
    console.error("Analysis error:", err);
    
    return NextResponse.json(
      { 
        status: "error",
        error: err.message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
