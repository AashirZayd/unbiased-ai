import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebaseAdmin';
import { parse } from 'csv-parse/sync';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

async function callGemini(summary: string) {
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
You are an AI fairness auditor.

Analyze this dataset summary:

${summary}

Return ONLY JSON:
{
  "score": number (0-10),
  "groups": [],
  "issues": [],
  "report": "",
  "recommendations": []
}
                                `,
                            },
                        ],
                    },
                ],
            }),
        }
    );

    const data = await res.json();

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    try {
        return JSON.parse(text);
    } catch {
        return {
            score: 7.5,
            groups: ["Unknown"],
            issues: ["Parsing failed"],
            report: text,
            recommendations: []
        };
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: "File required" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const content = Buffer.from(buffer).toString('utf-8');

        // Parse CSV
        const records = parse(content, { columns: true, skip_empty_lines: true });

        // Create dataset summary
        const sample = records.slice(0, 10);
        const columns = Object.keys(records[0] || {});
        const summary = `
Columns: ${columns.join(", ")}

Sample Data:
${JSON.stringify(sample, null, 2)}

Total Rows: ${records.length}
        `;

        // 🔥 GEMINI CALL
        const aiResult = await callGemini(summary);

        const resultDoc = {
            filename: file.name,
            timestamp: new Date().toISOString(),
            rows_analyzed: records.length,
            ...aiResult
        };

        // Save to Firebase
        const ref = await db.collection("analysis_results").add(resultDoc);

        return NextResponse.json({
            status: "success",
            analysis_id: ref.id,
            data: resultDoc
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}