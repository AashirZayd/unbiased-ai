"use client";

import { useState } from "react";
import Papa from "papaparse";

// 🔥 TYPE DEFINITIONS
interface AnalysisResult {
  biasScore: string;
  groups: Record<string, number>;
  report: string;
  issues: string[];
  recommendations: string[];
  detected?: {
    sensitive: string;
    target: string;
  };
}

interface MitigationResult {
  before: {
    biasScore: string;
    groups: Record<string, number>;
  };
  after: {
    biasScore: string;
    groups: Record<string, number>;
  };
  improvement: {
    percentage: string;
    absolute: string;
    improved: boolean;
  };
  fixedData: any[];
  detected?: {
    sensitive: string;
    target: string;
  };
}

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]);
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [mitigationResult, setMitigationResult] = useState<MitigationResult | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔥 SAFE API CALL WITH TIMEOUT
  const safeFetch = async (url: string, body: any, timeoutMs: number = 60000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeout);

      const text = await response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from server");
      }

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Response text:", text);
        throw new Error("Invalid JSON response from server");
      }

      if (!response.ok) {
        throw new Error(parsed.error || `Server error: ${response.status}`);
      }

      return parsed;

    } catch (err: any) {
      clearTimeout(timeout);
      
      if (err.name === "AbortError") {
        throw new Error("Request timeout - please try again");
      }
      
      throw err;
    }
  };

  // 🔥 FILE UPLOAD HANDLER
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      // Reset previous results
      setAnalysisResult(null);
      setMitigationResult(null);
    }
  };

  // 🔥 ANALYZE HANDLER
  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a CSV file first");
      return;
    }

    setLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep as strings for backend processing
      complete: async (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            throw new Error("CSV file is empty or invalid");
          }

          // Store original data (no transformation)
          const rawData = results.data;
          setOriginalData(rawData);

          // Call analyze API (backend handles all normalization)
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
          const response = await safeFetch(
            `${apiUrl}/api/analyze`,
            { data: rawData }
          );

          if (response.status !== "success") {
            throw new Error(response.error || "Analysis failed");
          }

          const analysisData = response.data;

          // Store results
          setAnalysisResult({
            biasScore: analysisData.biasScore,
            groups: analysisData.groups || {},
            report: analysisData.report || "Analysis complete",
            issues: analysisData.issues || [],
            recommendations: analysisData.recommendations || [],
            detected: analysisData.detected
          });

          setParsedData(rawData);

        } catch (err: any) {
          console.error("Analysis error:", err);
          setError(err.message || "Analysis failed. Please check your CSV format and try again.");
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        setError("Failed to parse CSV file. Please check the file format.");
        setLoading(false);
      }
    });
  };

  // 🔥 MITIGATION HANDLER
  const handleFix = async () => {
    if (!parsedData || parsedData.length === 0) {
      setError("Please analyze a dataset first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await safeFetch(
        `${apiUrl}/api/mitigate`,
        { data: parsedData }
      );

      if (response.status !== "success") {
        throw new Error(response.error || "Mitigation failed");
      }

      setMitigationResult(response);

    } catch (err: any) {
      console.error("Mitigation error:", err);
      setError(err.message || "Mitigation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 DOWNLOAD FIXED DATASET
  const handleDownload = () => {
    if (!mitigationResult || !mitigationResult.fixedData) {
      setError("No fixed data available");
      return;
    }

    try {
      // Convert to CSV
      const headers = Object.keys(mitigationResult.fixedData[0] || {});
      const csvRows = [
        headers.join(","),
        ...mitigationResult.fixedData.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape values containing commas
            if (String(value).includes(",")) {
              return `"${value}"`;
            }
            return value;
          }).join(",")
        )
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `fixed_dataset_${Date.now()}.csv`;
      link.click();

      URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error("Download error:", err);
      setError("Failed to download fixed dataset");
    }
  };

  // Calculate scores for display
  const beforeScore = analysisResult?.biasScore 
    ? parseFloat(analysisResult.biasScore) 
    : null;
  
  const afterScore = mitigationResult?.after?.biasScore
    ? parseFloat(mitigationResult.after.biasScore)
    : null;

  const improvement = mitigationResult?.improvement?.percentage || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-black bg-clip-text">
          Unbiased AI
        </h1>
        <div className="w-10 h-10 text-black rounded-full shadow-lg"></div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="max-w-3xl mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <span className="text-xl mr-3">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* UPLOAD SECTION */}
      <div className="bg-white p-10 rounded-2xl shadow-lg max-w-3xl mx-auto text-center border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Upload Dataset for Bias Analysis
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Upload any CSV file with demographic data and outcomes
        </p>

        <div className="mb-6">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-purple-50 file:text-purple-700
              hover:file:bg-purple-100
              cursor-pointer"
          />
          {file && (
            <p className="mt-2 text-sm text-green-600">
              ✓ {file.name} selected ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className={`
            px-8 py-3 rounded-xl font-semibold text-white
            transition-all duration-200 shadow-md
            ${!file || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-linear-to-r from-black to-black hover:from-black hover:to-black hover:shadow-lg"
            }
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </span>
          ) : (
            "Analyze Dataset"
          )}
        </button>

        {analysisResult?.detected && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Detected:</span> Sensitive attribute: <code className="bg-blue-100 px-2 py-1 rounded">{analysisResult.detected.sensitive}</code>, 
              Target: <code className="bg-blue-100 px-2 py-1 rounded ml-2">{analysisResult.detected.target}</code>
            </p>
          </div>
        )}
      </div>

      {/* RESULTS SECTION */}
      {analysisResult && (
        <div className="mt-10 max-w-6xl mx-auto space-y-8">

          {/* SCORE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CURRENT BIAS SCORE */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center">
              <p className="text-gray-500 text-sm font-medium mb-2">Current Bias Score</p>
              <h2 className={`text-5xl font-bold mb-2 ${
                beforeScore && beforeScore > 5 ? "text-red-500" :
                beforeScore && beforeScore > 3 ? "text-yellow-500" :
                "text-green-500"
              }`}>
                {beforeScore?.toFixed(1) || "0.0"}
              </h2>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                beforeScore && beforeScore > 5 ? "bg-red-100 text-red-600" :
                beforeScore && beforeScore > 3 ? "bg-yellow-100 text-yellow-600" :
                "bg-green-100 text-green-600"
              }`}>
                {beforeScore && beforeScore > 5 ? "High Risk" :
                 beforeScore && beforeScore > 3 ? "Medium Risk" :
                 "Low Risk"}
              </span>
            </div>

            {/* BEFORE FIX */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center">
              <p className="text-gray-500 text-sm font-medium mb-2">Before Mitigation</p>
              <h2 className="text-4xl font-bold text-red-500 mb-2">
                {beforeScore?.toFixed(1) || "—"}
              </h2>
              <span className="text-xs text-gray-500">Original dataset</span>
            </div>

            {/* AFTER FIX */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center">
              <p className="text-gray-500 text-sm font-medium mb-2">After Mitigation</p>
              <h2 className="text-4xl font-bold text-green-500 mb-2">
                {afterScore !== null ? afterScore.toFixed(1) : "—"}
              </h2>
              {afterScore !== null && (
                <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full font-semibold">
                  ↓ Improved
                </span>
              )}
            </div>
          </div>

          {/* IMPROVEMENT BADGE */}
          {improvement && (
            <div className="text-center">
              <span className="inline-block bg-linear-to-r from-green-400 to-green-600 text-white px-6 py-3 rounded-full text-lg font-bold shadow-lg">
                🎉 {improvement} Improvement
              </span>
            </div>
          )}

          {/* GROUP STATISTICS */}
          {analysisResult.groups && Object.keys(analysisResult.groups).length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h3 className="font-semibold text-lg mb-4 text-gray-800">Selection Rates by Group</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(analysisResult.groups).map(([group, rate]) => (
                  <div key={group} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1 capitalize">{group}</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {(rate * 100).toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI REPORT */}
          {analysisResult.report && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-4">
              <h3 className="font-semibold text-xl text-gray-800 flex items-center">
                <span className="text-2xl mr-2">🤖</span>
                AI Bias Analysis Report
              </h3>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700 leading-relaxed">{analysisResult.report}</p>
              </div>

              {analysisResult.issues && analysisResult.issues.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-red-600 mb-2">⚠️ Issues Identified</p>
                  <ul className="space-y-2">
                    {analysisResult.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-green-600 mb-2">✅ Recommendations</p>
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start">
                        <span className="text-green-500 mr-2">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex flex-col items-center space-y-4">
            {!mitigationResult && (
              <button
                onClick={handleFix}
                disabled={loading}
                className={`
                  px-10 py-4 rounded-xl font-bold text-white text-lg
                  transition-all duration-200 shadow-lg
                  ${loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-linear-to-r from-black to-black hover:from-black hover:to-black hover:shadow-xl transform hover:scale-105"
                  }
                `}
              >
                {loading ? "Applying Mitigation..." : "🔧 Fix Bias Now"}
              </button>
            )}

            {mitigationResult && mitigationResult.fixedData && (
              <button
                onClick={handleDownload}
                className="px-8 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
              >
                ⬇️ Download Fixed Dataset
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
