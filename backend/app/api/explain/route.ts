import { NextResponse } from "next/server";
import { generateDetailedExplanation } from "../../../lib/gemini";

// 🔥 CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// 🚀 MAIN HANDLER
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { analysisData } = body;

    if (!analysisData) {
      return NextResponse.json(
        { 
          status: "error",
          error: "Missing analysis data" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate detailed explanation
    const explanation = await generateDetailedExplanation(analysisData);

    return NextResponse.json(
      { 
        status: "success", 
        data: explanation 
      },
      { headers: corsHeaders }
    );

  } catch (err: any) {
    console.error("Explain error:", err);
    
    // Fallback explanation
    const fallback = {
      summary: "Bias analysis completed successfully.",
      whatIsBias: "The analysis detected statistical differences in selection rates across different demographic groups in your dataset.",
      impact: "These disparities can lead to unfair treatment and may perpetuate existing inequalities. It's important to address these issues to ensure fair outcomes for all groups.",
      technicalDetails: "The bias score represents the maximum difference in selection rates between groups. A score closer to 0 indicates more fairness.",
      nextSteps: [
        "Review the bias metrics for each demographic group",
        "Apply the mitigation strategy to reduce bias",
        "Re-analyze the mitigated dataset to verify improvement",
        "Monitor outcomes regularly to ensure continued fairness"
      ]
    };
    
    return NextResponse.json(
      { 
        status: "success",
        data: fallback,
        note: "Using fallback explanation due to AI service unavailability"
      },
      { headers: corsHeaders }
    );
  }
}
