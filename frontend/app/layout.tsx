import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartSort AI — Intelligent Waste Sorting & Recycling",
  description:
    "Snap your waste. Know where it goes. Multi-object waste recognition and disposal guidance powered by Gemini Vision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
