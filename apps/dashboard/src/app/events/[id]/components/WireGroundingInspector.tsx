"use client";

import React from "react";
import { ShieldCheck, ExternalLink } from "lucide-react";

interface WireGroundingInspectorProps {
  entities: Array<{ id: string; name: string; category: string }>;
  sources: Array<{ id: string; source_name: string; title: string; canonical_url: string }>;
}

export function WireGroundingInspector({
  entities,
  sources,
}: WireGroundingInspectorProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Entities Box */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Linked Extracted Entities
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {entities.map((ent) => (
            <span
              key={ent.id}
              className="text-xs px-2.5 py-1 bg-slate-800 text-slate-200 rounded-md border border-slate-700/60 flex items-center gap-1.5"
            >
              <span>{ent.name}</span>
              <span className="text-[10px] text-slate-500">({ent.category})</span>
            </span>
          ))}
        </div>
      </div>

      {/* Source Articles Box */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Corroborated Wire Sources
        </h4>
        <div className="space-y-1.5">
          {sources.map((s) => (
            <a
              key={s.id}
              href={s.canonical_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2 bg-slate-950/60 hover:bg-slate-800/60 rounded-lg border border-slate-800/80 text-xs transition-colors"
            >
              <span className="font-semibold text-slate-300 truncate max-w-[260px]">
                {s.source_name}: {s.title}
              </span>
              <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}