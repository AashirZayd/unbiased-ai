import { NextResponse } from "next/server";

type ExportRequest = {
  data: Record<string, any>[];
  filename?: string;
  delimiter?: "," | "\t";
};

export async function POST(req: Request) {
  try {
    const body: ExportRequest = await req.json();

    const { data, filename = "hardened_data.csv", delimiter = "," } = body;

    // 🔒 Validation
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "No data provided to export." },
        { status: 400 }
      );
    }

    // 🧠 Extract headers safely
    const headers = Object.keys(data[0] || {});

    if (headers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid data format." },
        { status: 400 }
      );
    }

    const csvRows: string[] = [];

    // 🧾 Add header row
    csvRows.push(headers.join(delimiter));

    // 🔄 Convert rows
    for (const row of data) {
      const values = headers.map((header) => {
        let value = row[header];

        // Handle null/undefined
        if (value === null || value === undefined) value = "";

        // Convert objects to string
        if (typeof value === "object") {
          value = JSON.stringify(value);
        }

        // Escape quotes
        const escaped = String(value).replace(/"/g, '""');

        return `"${escaped}"`;
      });

      csvRows.push(values.join(delimiter));
    }

    const csvString = csvRows.join("\n");

    // 📦 Return downloadable file
    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Export API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to export CSV",
      },
      { status: 500 }
    );
  }
}