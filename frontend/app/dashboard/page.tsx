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

        } catch (err) {
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
      <h1 className="text-2xl font-semibold mb-6">Unbiased AI</h1>

      {/* UPLOAD CARD */}
      <div className="bg-white p-8 rounded-2xl shadow max-w-3xl mx-auto text-center">
        <h2 className="text-lg font-semibold mb-2">
          Upload AI Model for Analysis
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Detect bias vulnerabilities in seconds
        </p>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="mb-4"
        />

        <br />

        <button
          onClick={handleAnalyze}
          className="bg-black text-white px-6 py-2 rounded-lg"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {/* RESULTS */}
      {score !== null && (
        <div className="mt-10 max-w-4xl mx-auto space-y-6">

          {/* SCORE */}
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <p className="text-gray-500">Bias Risk Score</p>
            <h2 className="text-5xl font-bold text-red-500">{score}</h2>
            <p className="text-red-500">High Risk</p>
          </div>

          {/* COMPARISON */}
          <div className="grid grid-cols-2 gap-6">

            <div className="bg-red-100 p-6 rounded-xl text-center">
              <p className="text-red-500 text-sm">Before Fix</p>
              <h2 className="text-4xl font-bold text-red-600">{score}</h2>
              <p className="text-red-500">High Risk</p>
            </div>

            <div className="bg-green-100 p-6 rounded-xl text-center">
              <p className="text-green-600 text-sm">After Fix</p>
              <h2 className="text-4xl font-bold text-green-600">
                {afterScore ?? "-"}
              </h2>
              <p className="text-green-600">
                {afterScore ? "Low Risk" : ""}
              </p>
            </div>

          </div>

          {/* IMPROVEMENT */}
          {improvement && (
            <div className="text-center">
              <span className="bg-green-200 text-green-800 px-4 py-1 rounded-full text-sm">
                ↑ {improvement}% Improvement
              </span>
            </div>
          )}

          {/* GROUP TAGS */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-semibold mb-3">Affected Groups</h3>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-red-200 text-red-700 px-3 py-1 rounded-full text-sm">Gender</span>
              <span className="bg-orange-200 text-orange-700 px-3 py-1 rounded-full text-sm">Ethnicity</span>
              <span className="bg-yellow-200 text-yellow-700 px-3 py-1 rounded-full text-sm">Age</span>
            </div>
          </div>

          {/* FIX BUTTON */}
          <div className="text-center">
            <button
              onClick={handleFix}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl"
            >
              {loading ? "Fixing..." : "✨ Fix Bias"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}