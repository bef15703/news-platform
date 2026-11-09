"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Radio,
  Layers,
  Sparkles,
  Database,
  ExternalLink,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Desk Overview", icon: Compass },
  { href: "/ingest", label: "Ingest Queue", icon: Radio },
  { href: "/entities", label: "Entities", icon: Layers },
];

export function GlobalNav() {
  const pathname = usePathname();

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
      {/* Brand Identity */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 group">
            <h5 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
              News Platform
            </h5>
        </Link>

        {/* Primary Route Tabs */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? "bg-slate-800 text-blue-400 border border-slate-700/60 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}