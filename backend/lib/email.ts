import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReportEmail(reportData: any) {
  try {
    await resend.emails.send({
      from: "Unbiased AI <onboarding@resend.dev>",
      to: "aashirzayd@gmail.com", // 🔥 HARDCODED EMAIL
      subject: "Your Bias Analysis Report",
      html: `
        <h2>Bias Analysis Report</h2>

        <p><b>Bias Score:</b> ${reportData.biasScore}</p>

        <h3>AI Report</h3>
        <p>${reportData.report}</p>

        <h3>Issues</h3>
        <ul>
          ${(reportData.issues || [])
            .map((i: string) => `<li>${i}</li>`)
            .join("")}
        </ul>

        <h3>Recommendations</h3>
        <ul>
          ${(reportData.recommendations || [])
            .map((r: string) => `<li>${r}</li>`)
            .join("")}
        </ul>

        <p>— Unbiased AI 🚀</p>
      `,
    });

    console.log("📧 Email sent to aashirzayd@gmail.com");
  } catch (err) {
    console.error("Email failed:", err);
  }
}