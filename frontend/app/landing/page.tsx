"use client";

import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-black">

      {/* Navbar */}
      <div className="flex justify-between items-center px-8 py-4 border-b">
        <h1 className="font-semibold text-lg">Unbiased AI</h1>

        <div className="flex gap-4 items-center">
          <Link href="/login">
            <button className="text-sm text-gray-600">Login</button>
          </Link>

          <Link href="/login">
            <button className="bg-black text-white px-4 py-2 rounded-lg text-sm">
              Open Dashboard
            </button>
          </Link>
        </div>
      </div>

      {/* HERO */}
      <div className="flex flex-col items-center text-center px-6 py-20">

        <p className="text-sm text-gray-500 mb-4">
          AI Security Auditor Platform
        </p>

        <h1 className="text-5xl font-bold mb-6 leading-tight max-w-3xl">
          Detect and Fix <span className="text-red-500">AI Bias</span>
          <br />
          Like a <span className="text-blue-500">Security Vulnerability</span>
        </h1>

        <p className="text-gray-600 max-w-xl mb-8">
          Analyze AI systems for bias, assign risk scores, and improve fairness instantly.
        </p>

        <Link href="/login">
          <button className="bg-black text-white px-6 py-3 rounded-xl shadow-md hover:scale-105 transition">
            Get Started
          </button>
        </Link>

        <p className="text-sm text-gray-400 mt-6">
          Built for ethical AI • Real-time bias detection • Instant mitigation
        </p>

      </div>

      {/* FEATURES */}
      <div className="px-6 py-20 bg-gray-50 text-center">
        <h2 className="text-3xl font-bold mb-4">Built for Fair AI</h2>
        <p className="text-gray-600 mb-12">
          Comprehensive tools to detect, analyze, and fix bias in your AI models
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">

          <div className="border rounded-xl p-6 bg-white shadow-sm">
            <h3 className="font-semibold mb-2">Bias Risk Scoring</h3>
            <p className="text-sm text-gray-600">
              CVSS-style scoring for AI fairness across demographic groups.
            </p>
          </div>

          <div className="border rounded-xl p-6 bg-white shadow-sm">
            <h3 className="font-semibold mb-2">Vulnerability Reports</h3>
            <p className="text-sm text-gray-600">
              Insights into affected groups and bias patterns.
            </p>
          </div>

          <div className="border rounded-xl p-6 bg-white shadow-sm">
            <h3 className="font-semibold mb-2">One-Click Mitigation</h3>
            <p className="text-sm text-gray-600">
              Automatically rebalance and improve fairness instantly.
            </p>
          </div>

        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">How It Works</h2>
        <p className="text-gray-600 mb-12">
          Three simple steps to ensure your AI is fair and unbiased
        </p>

        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">

          <div>
            <div className="bg-black text-white w-10 h-10 flex items-center justify-center rounded-lg mx-auto mb-4">1</div>
            <h3 className="font-semibold">Upload Dataset</h3>
            <p className="text-sm text-gray-600 mt-2">
              Upload your AI model or dataset for analysis.
            </p>
          </div>

          <div>
            <div className="bg-black text-white w-10 h-10 flex items-center justify-center rounded-lg mx-auto mb-4">2</div>
            <h3 className="font-semibold">Detect Bias</h3>
            <p className="text-sm text-gray-600 mt-2">
              Our system scans and assigns bias risk scores.
            </p>
          </div>

          <div>
            <div className="bg-black text-white w-10 h-10 flex items-center justify-center rounded-lg mx-auto mb-4">3</div>
            <h3 className="font-semibold">Fix and Improve</h3>
            <p className="text-sm text-gray-600 mt-2">
              Apply automated fixes and improve fairness instantly.
            </p>
          </div>

        </div>
      </div>

      {/* BEFORE AFTER */}
      <div className="px-6 py-20 bg-gray-50 text-center">
        <h2 className="text-3xl font-bold mb-4">Real Impact, Real Results</h2>
        <p className="text-gray-600 mb-12">
          Transform biased models into fair, trustworthy systems
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">

          <div className="border rounded-xl p-8 bg-white shadow-sm">
            <p className="text-red-500 text-sm mb-2">Before</p>
            <h1 className="text-5xl font-bold text-red-500">8.2</h1>
            <p className="text-red-500 mt-2">High Risk</p>

            <ul className="text-sm text-gray-600 mt-4 space-y-2 text-left">
              <li>⚠ 34% lower acceptance for female candidates</li>
              <li>⚠ Significant ethnic bias detected</li>
              <li>⚠ Age discrimination patterns found</li>
            </ul>
          </div>

          <div className="border rounded-xl p-8 bg-white shadow-sm">
            <p className="text-green-600 text-sm mb-2">After</p>
            <h1 className="text-5xl font-bold text-green-600">2.1</h1>
            <p className="text-green-600 mt-2">Low Risk</p>

            <ul className="text-sm text-gray-600 mt-4 space-y-2 text-left">
              <li>✔ Equal acceptance rates achieved</li>
              <li>✔ Ethnic bias reduced significantly</li>
              <li>✔ Fair decision-making restored</li>
            </ul>
          </div>

        </div>

        <div className="mt-8">
          <button className="bg-green-600 text-white px-6 py-3 rounded-xl">
            ↑ 74% Overall Improvement
          </button>
        </div>
      </div>

      {/* FINAL CTA SECTION */}
      <div className="bg-black text-white text-center py-20 px-6">
        <h2 className="text-4xl font-bold mb-4">
          Start Building Fair AI Today
        </h2>

        <p className="text-gray-300 mb-8">
          Join the movement towards ethical and unbiased artificial intelligence
        </p>

        <Link href="/login">
          <button className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:scale-105 transition">
            Launch Dashboard
          </button>
        </Link>
      </div>

      {/* FOOTER */}
      <div className="text-center py-6 text-sm text-gray-500">
        <p className="font-medium">Unbiased AI by HackTillDawn</p>
        <p>Built for BuildWithAI - Innovation Hackathon 2026 | Making AI Fair and Trustworthy</p>
      </div>

    </div>
  );
}