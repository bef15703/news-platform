import type { Metadata } from "next";
import { Merriweather } from "next/font/google";
import "./globals.css";
import { GlobalNav } from "@/components/GlobalNav";

const merriweather = Merriweather({weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "News Platform",
  description: "Editorial Intelligence and dynamic content curration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-slate-950">
      <body className={`${merriweather.className} min-h-screen flex flex-col bg-slate-950 text-slate-100`}>
        <GlobalNav />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}