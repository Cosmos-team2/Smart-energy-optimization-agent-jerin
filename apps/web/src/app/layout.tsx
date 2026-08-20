import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["500", "600", "700", "800"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

export const metadata: Metadata = {
  title: "OptiGrid | Smart Energy Consumption Optimization Agent",
  description:
    "Autonomous energy optimization and 15-minute demand spike mitigation for Indian industrial campuses & commercial facilities.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${manrope.variable}`}>
      <head>
        <link rel="preconnect" href="http://localhost:5174" />
      </head>
      <body
        className="min-h-screen antialiased font-sans"
        style={{ background: "#0A0A14", color: "#F0F0FF" }}
      >
        <main className="w-full">{children}</main>
        <footer
          className="w-full py-6 text-center text-xs"
          style={{
            borderTop: "1px solid rgba(139,92,246,0.12)",
            color: "#6B6B8A",
            background: "#07070F",
          }}
        >
          OptiGrid Facility Optimization Spine · Contract 1–5 Compliant · DISCOM 15-Min Demand Charge Protection
        </footer>
      </body>
    </html>
  );
}
