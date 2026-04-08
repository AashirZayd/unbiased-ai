"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    // simple hardcoded auth
    if (password === "admin123") {
      router.push("/dashboard");
    } else {
      alert("Wrong password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">

      <div className="border rounded-2xl p-8 shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-black">Access Dashboard</h1>

        <input
          type="password"
          placeholder="Enter password"
          className="border p-2 rounded w-full mb-4 text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="bg-black text-white px-6 py-2 rounded w-full"
        >
          Enter
        </button>

        <p className="text-xs text-gray-400 mt-3">
          (Hint: admin123)
        </p>
      </div>

    </div>
  );
}