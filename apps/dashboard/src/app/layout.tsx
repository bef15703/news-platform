import type { Metadata } from "next";
import { sansFont, editorialFont } from "./fonts";
import "./globals.css";
import { GlobalNav } from "@/components/GlobalNav";

export const metadata: Metadata = {
  title: "News Platform",
  description: "Editorial Intelligence and Dynamic Content Curration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-canvas">
      <body className={`${sansFont.variable} ${editorialFont.variable} min-h-screen flex flex-col bg-canvas text-content-primary`}>
        <GlobalNav />
        <div className="font-sans bg-canvas text-content-primary flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}