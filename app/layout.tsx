import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SkillSprint - Micro-Hackathons",
  description: "Competitive coding challenges and micro-hackathons for developers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased pt-16">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
