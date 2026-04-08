import { NextResponse } from "next/server";

// 🔥 CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 🔥 Handle OPTIONS preflight request
export async function OPTIONS(req: Request) {
  return NextResponse.json({}, { headers: corsHeaders });
}

function calculateBias(data: any[]) {
  const groups: any = {};

  data.forEach((row) => {
    const g = row.gender;
    if (!groups[g]) groups[g] = { total: 0, positive: 0 };

    groups[g].total++;
    if (row.selected === 1) groups[g].positive++;
  });

  const rates: any = {};
  Object.keys(groups).forEach((g) => {
    rates[g] = groups[g].positive / groups[g].total;
  });

  const values = Object.values(rates) as number[];
  const bias = Math.max(...values) - Math.min(...values);

  return {
    biasScore: (bias * 10).toFixed(2),
    groups: rates,
  };
}

function mitigateBias(data: any[]) {
  const males = data.filter((d) => d.gender === "male");
  const females = data.filter((d) => d.gender === "female");

  const min = Math.min(males.length, females.length);

  return [
    ...males.slice(0, min),
    ...females.slice(0, min),
  ];
}

export async function POST(req: Request) {
  try {
    const { data } = await req.json();

    const before = calculateBias(data);
    const fixedData = mitigateBias(data);
    const after = calculateBias(fixedData);

    return NextResponse.json(
      {
        status: "success",
        before,
        after,
        fixedData,
      },
      { headers: corsHeaders }  // 🔥 ADDED CORS HEADERS
    );

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500, headers: corsHeaders }  // 🔥 ADDED CORS HEADERS
    );
  }
}