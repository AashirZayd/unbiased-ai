import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebaseAdmin';

export async function GET(req: Request) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const snapshot = await db
      .collection("analysis_results")
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    const history = snapshot.docs.map(doc => {
      const data = doc.data();

      return {
        id: doc.id,
        filename: data?.filename || "Unknown",
        timestamp: data?.timestamp || null,

        // 🔥 Important fields only
        score: data?.score || 0,
        groups: data?.groups || [],
        issues_count: data?.issues?.length || 0,

        // 🔥 UI helpers
        risk_level:
          data?.score >= 7 ? "High" :
          data?.score >= 4 ? "Medium" :
          "Low"
      };
    });

    return NextResponse.json({
      status: "success",
      count: history.length,
      history
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}