import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 🧠 Safe defaults
    const disparateImpact = Number(body.disparate_impact ?? 1);
    const demographicParity = Number(body.demographic_parity_difference ?? 0);
    const equalizedOdds = Number(body.equalized_odds_difference ?? 0);

    let score = 0;

    // ⚔️ CVSS-like scoring
    if (disparateImpact < 0.8 || disparateImpact > 1.25) {
      score += 4;
    }

    if (demographicParity > 0.1) {
      score += 3;
    }

    if (equalizedOdds > 0.1) {
      score += 3;
    }

    // Clamp score
    score = Math.min(Math.max(score, 0), 10);

    // 🔥 Severity classification
    let severity = "Low";
    let risk_color = "green";

    if (score >= 7) {
      severity = "High";
      risk_color = "red";
    } else if (score >= 4) {
      severity = "Medium";
      risk_color = "yellow";
    }

    return NextResponse.json({
      status: "success",
      bias_score: score,
      severity,
      risk_color,

      // 🔥 breakdown (VERY USEFUL FOR UI)
      breakdown: {
        disparate_impact: disparateImpact,
        demographic_parity_difference: demographicParity,
        equalized_odds_difference: equalizedOdds
      }
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}