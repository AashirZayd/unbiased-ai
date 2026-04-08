"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [afterScore, setAfterScore] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const router = useRouter();

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out?")) {
      localStorage.removeItem("auth");
      router.push("/login");
    }
  };

  // 🔥 ANALYZE
  const handleAnalyze = async () => {
    if (!file) return alert("Upload a file");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    setScore(result.data.score);
    setAfterScore(null);
  };

  // 🔥 FIX
  const handleFix = async () => {
    if (!file || score === null) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("score", String(score));

    const res = await fetch("/api/mitigate", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setAfterScore(data.after_score);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-gray-800">

      {/* Navbar */}
      <div className="flex justify-between items-center px-8 py-4 border-b bg-white shadow-sm">
        <h1 className="font-semibold text-lg">Unbiased AI</h1>

        <div className="flex items-center gap-4 relative">
          <span className="text-sm text-gray-500">Demo Mode</span>

          <div
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 cursor-pointer"
          />

          {menuOpen && (
            <div className="absolute right-0 top-14 w-48 bg-white border rounded-xl shadow-lg p-2">
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100">
                ⚙ Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-500"
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto space-y-8">

        {/* Upload */}
        <div className="bg-white p-10 rounded-2xl border text-center shadow-sm">
          <h2 className="font-semibold text-lg mb-2">
            Upload AI Model for Analysis
          </h2>

          <p className="text-gray-500 text-sm mb-6">
            Detect bias vulnerabilities in seconds
          </p>

          <div className="flex justify-center gap-4">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="border rounded-lg p-2"
            />

            <button
              onClick={handleAnalyze}
              className="bg-black text-white px-6 py-2 rounded-lg"
            >
              Analyze
            </button>
          </div>
        </div>

        {/* AFTER ANALYZE */}
        {score !== null && (
          <>
            {/* Before / After */}
            <div className="grid md:grid-cols-2 gap-6">

              {/* BEFORE */}
              <div className="bg-white border border-red-200 p-6 rounded-2xl">
                <p className="text-red-500 text-sm mb-2">● Before Fix</p>
                <h1 className="text-5xl font-bold text-red-500">{score}</h1>
                <p className="text-red-500">High Risk Level</p>
              </div>

              {/* AFTER */}
              <div className="bg-white border border-green-200 p-6 rounded-2xl">
                <p className="text-green-600 text-sm mb-2">● After Fix</p>
                <h1 className="text-5xl font-bold text-green-600">
                  {afterScore ?? "-"}
                </h1>
                <p className="text-green-600">
                  {afterScore ? "Low Risk Level" : ""}
                </p>
              </div>
            </div>

            {/* FIX BUTTON */}
            <div className="text-center">
              <button
                onClick={handleFix}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl"
              >
                ✨ Fix Bias Now
              </button>
            </div>

            {/* AFTER FIX CONTENT */}
            {afterScore !== null && (
              <>
                <div className="text-center">
                  <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm">
                    Improvement Achieved
                  </span>
                </div>

                <div className="bg-white p-6 rounded-2xl border">
                  <p className="font-medium mb-3">Affected Groups</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs">Female</span>
                    <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-xs">Age 45+</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border">
                  <h2 className="font-semibold mb-2">Bias Report</h2>
                  <p className="text-sm text-gray-600">
                    Bias reduced after mitigation. System is now more fair.
                  </p>
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}