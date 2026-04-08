"use client";

import { useState } from "react";
import Papa from "papaparse";

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [fixedData, setFixedData] = useState<any[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [afterScore, setAfterScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [report, setReport] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const handleFileChange = (e: any) => {
    setFile(e.target.files[0]);
  };

  const safeFetch = async (url: string, body: any) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    return JSON.parse(text);
  };

  const handleAnalyze = async () => {
    if (!file) return alert("Upload CSV");
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          let parsedData: any[] = results.data;

          parsedData = parsedData.map((row: any) => ({
            gender: String(row.gender || row.Gender || "").toLowerCase(),
            selected: Number(row.selected || row.Selected),
          }));

          parsedData = parsedData.filter(
            (r) => r.gender && (r.selected === 0 || r.selected === 1)
          );

          const res = await safeFetch(
            "http://localhost:3000/api/analyze",
            { data: parsedData }
          );

          setData(parsedData);
          setScore(parseFloat(res.data.biasScore));
          setAfterScore(null);
          setFixedData([]);

          setReport(res.data.report || "");
          setIssues(res.data.issues || []);
          setRecommendations(res.data.recommendations || []);

        } catch {
          alert("Analyze failed");
        }

        setLoading(false);
      },
    });
  };

  const handleFix = async () => {
    setLoading(true);

    const res = await safeFetch(
      "http://localhost:3000/api/mitigate",
      { data }
    );

    setAfterScore(parseFloat(res.after.biasScore));
    setFixedData(res.fixedData);

    setLoading(false);
  };

  const improvement =
    score && afterScore
      ? Math.round(((score - afterScore) / score) * 100)
      : null;

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-8">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-semibold text-black">Unbiased AI</h1>
        <div className="w-8 h-8 bg-linear-to-r from-purple-400 to-blue-500 rounded-full"></div>
      </div>

      {/* UPLOAD */}
      <div className="bg-white p-10 rounded-2xl shadow max-w-3xl mx-auto text-center">
        <h2 className="text-lg font-semibold text-black">
          Upload AI Model for Analysis
        </h2>
        <p className="text-black text-sm mb-6">
          Drop your dataset or click to browse
        </p>

        <input type="file" accept=".csv" onChange={handleFileChange} />

        <div className="mt-4">
          <button
            onClick={handleAnalyze}
            className="bg-black text-white px-6 py-2 rounded-lg"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>

      {/* RESULTS */}
      {score !== null && (
        <div className="mt-10 max-w-5xl mx-auto space-y-8">

          {/* TOP CARDS */}
          <div className="grid grid-cols-3 gap-6">

            {/* SCORE */}
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <p className="text-gray-500 text-sm">Bias Risk Score</p>
              <h2 className="text-4xl font-bold text-red-500">{score}</h2>
              <span className="text-xs text-red-500">High Risk</span>
            </div>

            {/* BEFORE */}
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <p className="text-gray-500 text-sm">Before Fix</p>
              <h2 className="text-3xl font-bold text-red-500">{score}</h2>
              <span className="text-xs text-red-500">High Risk</span>
            </div>

            {/* AFTER */}
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <p className="text-gray-500 text-sm">After Fix</p>
              <h2 className="text-3xl font-bold text-green-500">
                {afterScore ?? "-"}
              </h2>
              <span className="text-xs text-green-500">
                {afterScore ? "Low Risk" : ""}
              </span>
            </div>

          </div>

          {/* IMPROVEMENT */}
          {improvement && (
            <div className="text-center">
              <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm">
                ↑ {improvement}% Improvement
              </span>
            </div>
          )}

          {/* AFFECTED GROUPS */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-semibold mb-3">Affected Groups</h3>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(data[0] || {}).map((g, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* AI REPORT */}
          {report && (
            <div className="bg-white p-6 rounded-xl shadow space-y-4">
              <h3 className="font-semibold text-lg">
                Bias Vulnerability Report
              </h3>

              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-sm text-gray-700 mt-1">{report}</p>
              </div>

              {recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-blue-600">
                    Recommendations
                  </p>
                  <ul className="text-sm mt-2 space-y-1">
                    {recommendations.map((r, i) => (
                      <li key={i}>✔ {r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ACTION */}
          <div className="text-center space-y-4">
            <button
              onClick={handleFix}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl"
            >
              {loading ? "Fixing..." : "Fix Bias"}
            </button>

            {fixedData.length > 0 && (
              <button
                onClick={() => {
                  const csv = [
                    "gender,selected",
                    ...fixedData.map((d) => `${d.gender},${d.selected}`),
                  ].join("\n");

                  const blob = new Blob([csv]);
                  const url = URL.createObjectURL(blob);

                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "fixed_dataset.csv";
                  a.click();
                }}
                className="block mx-auto bg-black text-white px-6 py-2 rounded-lg"
              >
                Download Fixed Dataset
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}