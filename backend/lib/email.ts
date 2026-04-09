import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReportEmail(reportData: any) {
  try {
    // 🔥 Check API key
    if (!process.env.RESEND_API_KEY) {
      console.warn("⚠️ RESEND_API_KEY not set. Skipping email.");
      return null;
    }

    // 🔥 FORCE SAFE EMAIL (demo-safe)
    const recipientEmail = "aashirzayd@gmail.com";

    // 🔥 SAFE TIMESTAMP
    const safeDate = reportData?.timestamp
      ? new Date(reportData.timestamp).toLocaleString()
      : new Date().toLocaleString();

    // 🔥 BUILD EMAIL HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f6f9; }
          .container { max-width: 600px; margin: auto; padding: 20px; }
          .header { background: #667eea; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; }
          .score { font-size: 32px; font-weight: bold; color: #667eea; }
          .section { margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Unbiased AI Report</h2>
          </div>

          <div class="content">

            <div class="section">
              <p><strong>Bias Score:</strong></p>
              <div class="score">${reportData?.biasScore || "N/A"}</div>
            </div>

            <div class="section">
              <p><strong>Rows Analyzed:</strong> ${reportData?.rows_analyzed || "N/A"}</p>
              <p><strong>Sensitive Column:</strong> ${reportData?.detected?.sensitive || "N/A"}</p>
              <p><strong>Target Column:</strong> ${reportData?.detected?.target || "N/A"}</p>
            </div>

            ${
              reportData?.report
                ? `
            <div class="section">
              <h3>AI Report</h3>
              <p>${reportData.report}</p>
            </div>
            `
                : ""
            }

            ${
              reportData?.issues?.length
                ? `
            <div class="section">
              <h3>Issues</h3>
              <ul>
                ${reportData.issues.map((i: string) => `<li>${i}</li>`).join("")}
              </ul>
            </div>
            `
                : ""
            }

            ${
              reportData?.recommendations?.length
                ? `
            <div class="section">
              <h3>Recommendations</h3>
              <ul>
                ${reportData.recommendations.map((r: string) => `<li>${r}</li>`).join("")}
              </ul>
            </div>
            `
                : ""
            }

            <div class="section">
              <p style="font-size: 12px; color: gray;">
                Generated on ${safeDate}
              </p>
            </div>

          </div>
        </div>
      </body>
      </html>
    `;

    // 🔥 SEND EMAIL
    const result = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: recipientEmail,
      subject: `Bias Report - Score: ${reportData?.biasScore || "N/A"}`,
      html: emailHtml,
    });

    console.log("📧 Email sent successfully:", result);

    return result;

  } catch (error: any) {
    console.error("❌ Email failed:", error?.message || error);

    // 🔥 DO NOT BREAK APP
    return null;
  }
}