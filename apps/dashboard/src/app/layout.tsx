import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GlobalNav } from "@/components/GlobalNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NewsDesk HQ",
  description: "Editorial Intelligence & SDUI Living Dossiers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-slate-950">
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-950 text-slate-100`}>
        <GlobalNav />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}