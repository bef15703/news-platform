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
      <div className="bg-surface border border-border-subtle rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-content-secondary">
          Linked Extracted Entities
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {entities.map((ent) => (
            <span
              key={ent.id}
              className="text-xs px-2.5 py-1 bg-elevated text-content-primary rounded-md border border-border-strong flex items-center gap-1.5"
            >
              <span>{ent.name}</span>
              <span className="text-[10px] text-content-muted">({ent.category})</span>
            </span>
          ))}
        </div>
      </div>

      {/* Source Articles Box */}
      <div className="bg-surface border border-border-subtle rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Corroborated Wire Sources
        </h4>
        <div className="space-y-1.5">
          {sources.map((s) => (
            <a
              key={s.id}
              href={s.canonical_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2 bg-canvas hover:bg-elevated rounded-lg border border-border-subtle text-xs transition-colors"
            >
              <span className="font-semibold text-content-secondary truncate max-w-[260px]">
                {s.source_name}: {s.title}
              </span>
              <ExternalLink className="w-3 h-3 text-content-muted shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}