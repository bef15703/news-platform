import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Editorial Studio | News Platform",
  description: "Card deck and live dossier editorial dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
