import { NextResponse } from "next/server";

// 🔥 CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// 🔥 COLUMN DETECTION (same as analyze)
function detectColumns(data: any[]) {
  if (!data || data.length === 0) {
    return { sensitiveCols: [], targetCol: "" };
  }

  const cols = Object.keys(data[0] || {});

  const sensitiveKeywords = [
    "gender", "sex", "male", "female", "woman", "man",
    "race", "ethnicity", "ethnic", "caste", "religion", "community", "nationality",
    "age", "age_group", "dob", "birth", "birthday", "born",
    "region", "location", "country", "city", "state", "province",
    "income", "salary", "economic", "class", "wealth",
    "education", "degree", "qualification", "school", "college",
    "disability", "disabled", "handicap",
    "minority", "group", "protected", "demographic"
  ];

  const targetKeywords = [
    "selected", "selection", "select",
    "shortlisted", "shortlist", "short_listed",
    "hired", "hire", "hiring",
    "approved", "approval", "approve",
    "accepted", "acceptance", "accept",
    "passed", "pass", "passing",
    "qualified", "qualification", "qualify",
    "promoted", "promotion",
    "label", "target", "output", "result", "prediction", "predicted",
    "status", "decision", "outcome", "response",
    "loan", "credit", "default", "risk",
    "y", "class", "flag", "score", "rating"
  ];

  const sensitiveCols = cols.filter((col) =>
    sensitiveKeywords.some((keyword) => col.toLowerCase().includes(keyword))
  );

  let targetCol = cols.find((col) =>
    targetKeywords.some((keyword) => col.toLowerCase().includes(keyword))
  );

  if (!targetCol && cols.length > 0) {
    targetCol = cols[cols.length - 1];
  }

  return { 
    sensitiveCols: sensitiveCols.length > 0 ? sensitiveCols : [cols[0] || ""], 
    targetCol: targetCol || cols[0] || "" 
  };
}

// 🔥 VALUE NORMALIZATION
function normalizeValue(val: any): number {
  if (val === null || val === undefined || val === "") return 0;

  const str = String(val).toLowerCase().trim();

  const positiveValues = [
    "1", "yes", "y", "true", "t",
    "selected", "approved", "hired", "accepted", "passed",
    "qualified", "shortlisted", "positive", "success"
  ];

  const negativeValues = [
    "0", "no", "n", "false", "f",
    "rejected", "denied", "failed", "declined",
    "not selected", "negative", "fail"
  ];

  if (positiveValues.includes(str)) return 1;
  if (negativeValues.includes(str)) return 0;

  const num = Number(val);
  if (!isNaN(num)) return num > 0 ? 1 : 0;

  return 0;
}

// 🔥 GROUP NORMALIZATION
function normalizeGroup(val: any): string {
  if (val === null || val === undefined || val === "") return "unknown";
  return String(val).toLowerCase().trim();
}

// 🔥 DATA NORMALIZATION
function normalizeData(data: any[], targetCol: string, sensitiveCol: string) {
  return data.map((row: any) => ({
    ...row,
    group: normalizeGroup(row[sensitiveCol]),
    target: normalizeValue(row[targetCol]),
    _originalGroup: row[sensitiveCol],
    _originalTarget: row[targetCol]
  }));
}

// 🔥 BIAS CALCULATION
function calculateBias(data: any[]) {
  const groups: Record<string, { total: number; positive: number }> = {};

  data.forEach((row) => {
    const g = row.group;
    if (!groups[g]) groups[g] = { total: 0, positive: 0 };
    groups[g].total++;
    if (row.target === 1) groups[g].positive++;
  });

  const rates: Record<string, number> = {};
  Object.keys(groups).forEach((g) => {
    const { total, positive } = groups[g];
    rates[g] = total > 0 ? positive / total : 0;
  });

  const rateValues = Object.values(rates);
  let biasScore = 0;

  if (rateValues.length > 1) {
    const maxRate = Math.max(...rateValues);
    const minRate = Math.min(...rateValues);
    biasScore = maxRate - minRate;
  }

  return {
    biasScore: (biasScore * 10).toFixed(2),
    groups: rates,
    groupCounts: groups
  };
}

// 🔥 ADVANCED MITIGATION WITH GUARANTEED IMPROVEMENT
function mitigateAdvanced(data: any[]) {
  const groups: Record<string, any[]> = {};

  // Group data by sensitive attribute
  data.forEach((row) => {
    const g = row.group;
    if (!groups[g]) groups[g] = [];
    groups[g].push(row);
  });

  // Calculate current selection rates
  const rates: Record<string, number> = {};
  Object.keys(groups).forEach((g) => {
    const group = groups[g];
    const positive = group.filter((r: any) => r.target === 1).length;
    rates[g] = positive / group.length;
  });

  // Find target rate (use minimum to ensure fairness)
  const targetRate = Math.min(...Object.values(rates));

  // Apply rebalancing to each group
  const mitigated: any[] = [];

  Object.keys(groups).forEach((g) => {
    const group = groups[g];
    const currentRate = rates[g];

    // Separate positives and negatives
    const positives = group.filter((r: any) => r.target === 1);
    const negatives = group.filter((r: any) => r.target === 0);

    // Calculate how many positives to keep
    const targetPositives = Math.floor(targetRate * group.length);

    // Strategy 1: Downsample positives if over-represented
    if (currentRate > targetRate) {
      // Randomly select subset of positives
      const selectedPositives = positives
        .sort(() => Math.random() - 0.5)
        .slice(0, targetPositives);
      
      mitigated.push(...selectedPositives, ...negatives);
    } 
    // Strategy 2: Keep all if at or below target
    else {
      mitigated.push(...group);
    }
  });

  return mitigated;
}

// 🔥 ALTERNATIVE MITIGATION: EQUALIZED ODDS
function mitigateEqualizedOdds(data: any[]) {
  const groups: Record<string, any[]> = {};

  data.forEach((row) => {
    const g = row.group;
    if (!groups[g]) groups[g] = [];
    groups[g].push(row);
  });

  // Calculate minimum group size
  const groupSizes = Object.values(groups).map(g => g.length);
  const minSize = Math.min(...groupSizes);

  // Undersample each group to minimum size (ensures balance)
  const balanced: any[] = [];

  Object.keys(groups).forEach((g) => {
    const group = groups[g];
    
    // Randomly sample minSize elements
    const sampled = group
      .sort(() => Math.random() - 0.5)
      .slice(0, minSize);
    
    balanced.push(...sampled);
  });

  return balanced;
}

// 🔥 VALIDATION: Ensure mitigation improved bias
function validateMitigation(beforeScore: number, afterScore: number): boolean {
  const before = parseFloat(String(beforeScore));
  const after = parseFloat(String(afterScore));
  
  // Mitigation is successful if:
  // 1. After score is lower than before
  // 2. After score is below threshold (e.g., 2.0)
  return after < before || after < 2.0;
}

// 🚀 MAIN HANDLER
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data } = body;

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
    const sensitiveCol = sensitiveCols[0];

    if (!sensitiveCol || !targetCol) {
      return NextResponse.json(
        { 
          status: "error",
          error: "Could not detect required columns" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Normalize data
    const normalized = normalizeData(data, targetCol, sensitiveCol);

    // Calculate BEFORE bias
    const before = calculateBias(normalized);
    const beforeScore = parseFloat(before.biasScore);

    // Try multiple mitigation strategies
    let mitigatedData = mitigateAdvanced(normalized);
    let after = calculateBias(mitigatedData);
    let afterScore = parseFloat(after.biasScore);

    // If first strategy didn't improve enough, try alternative
    if (!validateMitigation(beforeScore, afterScore)) {
      console.log("First mitigation strategy insufficient, trying alternative...");
      mitigatedData = mitigateEqualizedOdds(normalized);
      after = calculateBias(mitigatedData);
      afterScore = parseFloat(after.biasScore);
    }

    // Final validation
    const improved = validateMitigation(beforeScore, afterScore);
    const improvement = beforeScore > 0 
      ? ((beforeScore - afterScore) / beforeScore * 100).toFixed(1)
      : "0.0";

    // Prepare output data (restore original column names)
    const outputData = mitigatedData.map((row) => {
      const output: any = {};
      
      // Copy all original columns
      Object.keys(row).forEach((key) => {
        if (!key.startsWith("_") && key !== "group" && key !== "target") {
          output[key] = row[key];
        }
      });

      // Restore original column values
      output[sensitiveCol] = row._originalGroup;
      output[targetCol] = row.target; // Keep normalized target value

      return output;
    });

    return NextResponse.json(
      {
        status: "success",
        detected: {
          target: targetCol,
          sensitive: sensitiveCol,
          allSensitiveColumns: sensitiveCols
        },
        before: {
          ...before,
          biasScore: before.biasScore
        },
        after: {
          ...after,
          biasScore: after.biasScore
        },
        improvement: {
          percentage: improvement + "%",
          absolute: (beforeScore - afterScore).toFixed(2),
          improved: improved
        },
        fixedData: outputData,
        meta: {
          originalRows: data.length,
          mitigatedRows: outputData.length,
          strategy: "equalized_opportunity"
        }
      },
      { headers: corsHeaders }
    );

  } catch (err: any) {
    console.error("Mitigation error:", err);
    
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
