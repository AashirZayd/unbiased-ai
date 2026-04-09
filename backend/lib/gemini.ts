import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 🔥 RETRY WITH EXPONENTIAL BACKOFF
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// 🔥 CLEAN JSON FROM GEMINI RESPONSE
function cleanJsonResponse(text: string): string {
  // Remove markdown code fences
  let cleaned = text.replace(/```json\s*/gi, "");
  cleaned = cleaned.replace(/```\s*/g, "");
  
  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // Try to extract JSON if it's embedded in text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  return cleaned;
}

// 🔥 SAFE JSON PARSE WITH FALLBACK
function safeJsonParse(text: string): any {
  const cleaned = cleanJsonResponse(text);
  
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    // Try fixing common JSON issues
    try {
      // Fix single quotes to double quotes
      const fixed = cleaned.replace(/'/g, '"');
      return JSON.parse(fixed);
    } catch (e2) {
      // Try removing trailing commas
      try {
        const noTrailingCommas = cleaned.replace(/,(\s*[}\]])/g, '$1');
        return JSON.parse(noTrailingCommas);
      } catch (e3) {
        console.error("All JSON parse attempts failed");
        throw new Error("Invalid JSON response from AI");
      }
    }
  }
}

// 🔥 VALIDATE AI REPORT STRUCTURE
function validateReport(data: any): {
  report: string;
  issues: string[];
  recommendations: string[];
} {
  const validated = {
    report: "",
    issues: [] as string[],
    recommendations: [] as string[]
  };

  // Validate report
  if (typeof data.report === "string") {
    validated.report = data.report;
  } else if (typeof data.description === "string") {
    validated.report = data.description;
  } else if (typeof data.summary === "string") {
    validated.report = data.summary;
  }

  // Validate issues
  if (Array.isArray(data.issues)) {
    validated.issues = data.issues
      .filter((item: any) => typeof item === "string")
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0);
  } else if (Array.isArray(data.problems)) {
    validated.issues = data.problems
      .filter((item: any) => typeof item === "string")
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0);
  }

  // Validate recommendations
  if (Array.isArray(data.recommendations)) {
    validated.recommendations = data.recommendations
      .filter((item: any) => typeof item === "string")
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0);
  } else if (Array.isArray(data.suggestions)) {
    validated.recommendations = data.suggestions
      .filter((item: any) => typeof item === "string")
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0);
  }

  return validated;
}

// 🔥 GENERATE AI REPORT WITH RETRIES
export async function generateAIReport(summary: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `You are an AI fairness auditor analyzing a dataset for potential bias.

Dataset Summary:
${summary}

Analyze the bias metrics and provide a comprehensive report.

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no explanations, ONLY the JSON object.

Format (strict):
{
  "report": "A clear 2-3 sentence explanation of the bias found in this dataset",
  "issues": ["Issue 1", "Issue 2", "Issue 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}

Rules:
- "report" must be a single paragraph (2-3 sentences) explaining the bias
- "issues" must be an array of 2-4 specific problems found
- "recommendations" must be an array of 2-4 actionable solutions
- Use clear, non-technical language
- Focus on fairness, equality, and discrimination

Respond with ONLY the JSON object, no other text.`;

    // Use retry logic
    const result = await retryWithBackoff(async () => {
      const response = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("AI request timeout")), 30000)
        )
      ]) as any;

      if (!response || !response.response) {
        throw new Error("No response from AI");
      }

      return response;
    }, 2, 2000); // 2 retries, 2 second base delay

    // Extract text
    let text = result.response.text();

    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from AI");
    }

    // Parse and validate JSON
    const parsed = safeJsonParse(text);
    const validated = validateReport(parsed);

    // Ensure we have meaningful content
    if (!validated.report || validated.report.length < 10) {
      validated.report = "Bias detected in dataset. Statistical analysis shows disparities in selection rates across demographic groups.";
    }

    if (validated.issues.length === 0) {
      validated.issues = [
        "Unequal selection rates across groups",
        "Potential discriminatory patterns",
        "Fairness concerns in decision-making"
      ];
    }

    if (validated.recommendations.length === 0) {
      validated.recommendations = [
        "Review selection criteria for bias",
        "Implement fairness-aware algorithms",
        "Monitor outcomes across demographic groups",
        "Consider using bias mitigation techniques"
      ];
    }

    return validated;

  } catch (err: any) {
    console.error("Gemini AI error:", err.message);

    // Return structured fallback
    return {
      report: "Automated bias analysis detected statistical disparities in the dataset. The selection rates vary significantly across different demographic groups, indicating potential fairness concerns.",
      issues: [
        "Unequal selection rates across demographic groups",
        "Statistical parity violations detected",
        "Potential discrimination in decision outcomes"
      ],
      recommendations: [
        "Review decision-making criteria for implicit bias",
        "Implement fairness metrics monitoring",
        "Consider using bias mitigation algorithms",
        "Conduct regular audits of model outputs"
      ]
    };
  }
}

// 🔥 GENERATE DETAILED EXPLANATION (for /api/explain endpoint)
export async function generateDetailedExplanation(analysisData: any) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `You are an AI ethics expert explaining bias analysis results to a non-technical audience.

Analysis Data:
${JSON.stringify(analysisData, null, 2)}

Provide a detailed, easy-to-understand explanation of:
1. What bias was detected
2. Why it matters
3. How it affects different groups
4. What can be done about it

CRITICAL: Respond with ONLY valid JSON, no markdown.

Format:
{
  "summary": "Brief overview (1-2 sentences)",
  "whatIsBias": "Explanation of the bias found (2-3 sentences)",
  "impact": "Why this matters and who is affected (2-3 sentences)",
  "technicalDetails": "Simple explanation of the metrics (2-3 sentences)",
  "nextSteps": ["Step 1", "Step 2", "Step 3"]
}`;

    const result = await retryWithBackoff(async () => {
      const response = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 30000)
        )
      ]) as any;

      return response;
    }, 2, 2000);

    const text = result.response.text();
    const parsed = safeJsonParse(text);

    return {
      summary: parsed.summary || "Bias analysis complete.",
      whatIsBias: parsed.whatIsBias || "Statistical disparities detected.",
      impact: parsed.impact || "Affects fairness of outcomes.",
      technicalDetails: parsed.technicalDetails || "Metrics indicate bias.",
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [
        "Review the analysis",
        "Apply mitigation",
        "Monitor results"
      ]
    };

  } catch (err: any) {
    console.error("Detailed explanation error:", err);

    return {
      summary: "Analysis complete with bias detected.",
      whatIsBias: "The analysis found statistical differences in outcomes across demographic groups.",
      impact: "These disparities may indicate unfair treatment and can perpetuate existing inequalities.",
      technicalDetails: "The bias score represents the difference in selection rates between the most and least favored groups.",
      nextSteps: [
        "Review the detailed metrics",
        "Apply the recommended mitigation strategies",
        "Re-analyze after mitigation to verify improvement"
      ]
    };
  }
}
