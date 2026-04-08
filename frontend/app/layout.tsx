import "./globals.css";

export const metadata = {
  title: "Unbiased AI",
  description: "AI Security Auditor Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}