import { NextResponse } from "next/server";

// 🔥 CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 🔥 OPTIONS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// 🔥 AUTO DETECT COLUMNS
function detectColumns(data: any[]) {
  const cols = Object.keys(data[0]);

  const sensitiveKeywords = ["gender", "sex", "race", "age", "ethnicity"];
  const targetKeywords = ["selected", "approved", "label", "hired"];

  const sensitiveCols = cols.filter((col) =>
    sensitiveKeywords.some((k) => col.toLowerCase().includes(k))
  );

  const targetCol = cols.find((col) =>
    targetKeywords.some((k) => col.toLowerCase().includes(k))
  );

  return { sensitiveCols, targetCol };
}

// 🔥 GENERIC BIAS CALCULATION
function calculateBias(data: any[], col: string, target: string) {
  const groups: any = {};

  data.forEach((row) => {
    const g = row[col];
    if (!g) return;

    if (!groups[g]) groups[g] = { total: 0, positive: 0 };

    groups[g].total++;
    if (row[target] == 1) groups[g].positive++;
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

// 🔥 MITIGATE SINGLE COLUMN
function mitigateColumn(data: any[], col: string, target: string) {
  const groups: any = {};

  data.forEach((row) => {
    const g = row[col];
    if (!groups[g]) groups[g] = [];
    groups[g].push(row);
  });

  // calculate rates
  const rates: any = {};
  Object.keys(groups).forEach((g) => {
    const total = groups[g].length;
    const positive = groups[g].filter((r: any) => r[target] == 1).length;
    rates[g] = positive / total;
  });

 const targetRate = Math.min(...(Object.values(rates) as number[]));

  let fixed: any[] = [];

  Object.keys(groups).forEach((g) => {
    const group = groups[g];

    const positives = group.filter((r: any) => r[target] == 1);
    const negatives = group.filter((r: any) => r[target] == 0);

    const total = group.length;
    const allowedPositives = Math.floor(targetRate * total);

    fixed.push(
      ...positives.slice(0, allowedPositives),
      ...negatives.slice(0, total - allowedPositives)
    );
  });

  return fixed;
}

// 🔥 FULL MITIGATION (MULTI COLUMN)
function mitigateBias(data: any[]) {
  const { sensitiveCols, targetCol } = detectColumns(data);

  if (!targetCol || sensitiveCols.length === 0) {
    console.log("No valid columns detected, skipping mitigation");
    return data;
  }

  let fixedData = data;

  sensitiveCols.forEach((col) => {
    fixedData = mitigateColumn(fixedData, col, targetCol);
  });

  return fixedData;
}

// 🚀 MAIN API
export async function POST(req: Request) {
  try {
    const { data } = await req.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Invalid dataset" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 🔥 DETECT COLUMNS
    const { sensitiveCols, targetCol } = detectColumns(data);

    if (!targetCol || sensitiveCols.length === 0) {
      return NextResponse.json(
        { error: "Could not detect target or sensitive columns" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 🔥 BEFORE (use first sensitive column for score display)
    const before = calculateBias(data, sensitiveCols[0], targetCol);

    // 🔥 FIX
    const fixedData = mitigateBias(data);

    // 🔥 AFTER
    const after = calculateBias(fixedData, sensitiveCols[0], targetCol);

    console.log("BEFORE:", before.biasScore);
    console.log("AFTER:", after.biasScore);

    return NextResponse.json(
      {
        status: "success",
        detected: {
          target: targetCol,
          sensitive: sensitiveCols,
        },
        before,
        after,
        fixedData,
      },
      { headers: corsHeaders }
    );

  } catch (err: any) {
    console.error("MITIGATE ERROR:", err);

    return NextResponse.json(
      { error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}