"use client";

import React from "react";
import Image from "next/image";
import { Newspaper, Sparkles, ExternalLink } from "lucide-react";
import type { CardData } from "@/components/CardPreview";
import type { SDUIBlock } from "@news-platform/db";

interface ArticleFeedPreviewProps {
  eventTitle: string;
  coverImageUrl: string;
  lede: string;
  cards: CardData[];
  selectedCardIdx: number;
  sduiBlocks: SDUIBlock[];
  sources: Array<{ id: string; source_name: string; title: string; canonical_url: string }>;
  onSelectCard: (idx: number) => void;
}

export function ArticleFeedPreview({
  eventTitle,
  coverImageUrl,
  lede,
  cards,
  selectedCardIdx,
  sduiBlocks,
  sources,
  onSelectCard,
}: ArticleFeedPreviewProps) {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="text-[11px] font-semibold text-content-secondary mb-3 uppercase tracking-wider flex items-center gap-1.5">
        <Newspaper className="w-3.5 h-3.5 text-brand" />
        <span>Live Article Emulator</span>
      </div>

      <div className="w-full max-w-[360px] bg-canvas rounded-[32px] border-4 border-border-subtle shadow-2xl overflow-hidden flex flex-col text-content-primary">
        {/* Cover Photo Header */}
        <div className="relative w-full aspect-[4/3] bg-surface overflow-hidden shrink-0">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={eventTitle}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-content-muted">
              <span className="text-xs">No cover image assigned</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex items-end p-4">
            <h1 className="text-lg font-black text-white leading-tight line-clamp-3">
              {eventTitle || "Untitled Story Event"}
            </h1>
          </div>
        </div>

        {/* Scrollable Story Container */}
        <div className="p-4 space-y-5 text-left max-h-[640px] overflow-y-auto">
          {lede && (
            <p className="text-xs text-content-primary leading-relaxed border-b border-border-subtle pb-3">
              {lede}
            </p>
          )}

          {/* Key Points Micro-Card Strip */}
          {cards.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1">
                  Key Points
                </span>
                <span className="text-[10px] text-content-muted">
                  {cards.length} cards · Tap to inspect
                </span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-4 px-4">
                {cards.map((c, i) => (
                  <button
                    key={c.id ? `card-strip-${c.id}-${i}` : `card-strip-${i}`}
                    type="button"
                    onClick={() => onSelectCard(i)}
                    className={`w-[110px] h-[150px] shrink-0 rounded-xl p-2.5 text-left border flex flex-col justify-between transition-all snap-start ${
                      selectedCardIdx === i
                        ? "ring-2 ring-brand border-brand"
                        : "border-border-subtle hover:border-border-strong"
                    }`}
                    style={{
                      backgroundColor: c.style_overrides?.bg || "#1e293b",
                      color: c.style_overrides?.textColor || "#f8fafc",
                    }}
                  >
                    {c.badge && (
                      <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-black/40 text-content-primary w-fit truncate max-w-full">
                        {c.badge}
                      </span>
                    )}
                    <p className="text-[10px] font-bold leading-snug line-clamp-4">
                      {c.headline || c.body || "Card Summary"}
                    </p>
                    <span className="text-[8px] opacity-60">#{i + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rendered SDUI Story Blocks */}
          <div className="space-y-4 pt-2">
            {sduiBlocks
              .filter((b): b is SDUIBlock => Boolean(b && typeof b === "object" && "type" in b))
              .map((blk, idx) => (
                <div key={blk.id ? `${blk.id}-${idx}` : `article-block-${idx}`}>
                  {blk.type === "heading" && (
                    <h3 className="text-sm font-bold text-content-primary tracking-tight mt-3">
                      {blk.text || "Untitled Section"}
                    </h3>
                  )}

                  {blk.type === "paragraph" && (
                    <p className="text-xs text-content-secondary leading-relaxed">
                      {blk.text}
                    </p>
                  )}

                  {blk.type === "image" && blk.url && (
                    <div className="space-y-1 my-2">
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-surface border border-border-subtle">
                        <Image
                          src={blk.url}
                          alt={blk.caption || "Story inline"}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      {blk.caption && (
                        <p className="text-[10px] text-content-secondary italic">
                          {blk.caption}{" "}
                          {blk.credit && (
                            <span className="not-italic text-content-muted">
                              ({blk.credit})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {blk.type === "direct_quote_callout" && (
                    <div className="border-l-2 border-amber-400 pl-3 py-1 my-2">
                      <p className="text-xs italic text-content-primary">
                        &quot;{blk.quote}&quot;
                      </p>
                      {blk.speaker && (
                        <span className="text-[10px] font-semibold text-content-secondary block mt-1">
                          — {blk.speaker} {blk.role && `(${blk.role})`}
                        </span>
                      )}
                    </div>
                  )}

                  {blk.type === "data_chart" && (
                    <div className="bg-surface border border-border-subtle rounded-xl p-3 space-y-2">
                      <h4 className="text-[11px] font-bold text-content-primary">
                        {blk.title}
                      </h4>
                      <div className="h-2 w-full bg-elevated rounded-full flex overflow-hidden">
                        <div
                          style={{
                            width: `${(blk.primaryValue / (blk.primaryValue + blk.secondaryValue || 1)) * 100}%`,
                          }}
                          className="bg-brand h-full"
                        />
                        <div
                          style={{
                            width: `${(blk.secondaryValue / (blk.primaryValue + blk.secondaryValue || 1)) * 100}%`,
                          }}
                          className="bg-purple-500 h-full"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-content-secondary">
                        <span>
                          {blk.primaryLabel}: {blk.primaryValue}
                        </span>
                        <span>
                          {blk.secondaryLabel}: {blk.secondaryValue}
                        </span>
                      </div>
                    </div>
                  )}

                  {blk.type === "breaking_banner" && (
                    <div
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                        blk.severity === "urgent"
                          ? "border-red-500/40 bg-red-950/30 text-red-300"
                          : blk.severity === "developing"
                          ? "border-amber-500/40 bg-amber-950/30 text-amber-300"
                          : "border-brand/40 bg-brand/10 text-brand"
                      }`}
                    >
                      <span>{blk.title || "Developing Update"}</span>
                      <span className="text-[9px] uppercase tracking-wider opacity-75">
                        {blk.severity || "urgent"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* Corroborating Source Links */}
          <div className="border-t border-border-subtle pt-4 space-y-2 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">
              Articles that Cover This
            </span>
            <div className="space-y-1.5">
              {sources.map((s, idx) => (
                <a
                  key={s.id ? `emulator-source-${s.id}-${idx}` : `emulator-source-${idx}`}
                  href={s.canonical_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border-subtle text-[11px] hover:border-border-strong transition-colors"
                >
                  <div className="truncate pr-2">
                    <p className="font-medium text-content-primary truncate">
                      {s.title}
                    </p>
                    <span className="text-[9px] text-content-muted uppercase">
                      {s.source_name}
                    </span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-content-muted shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}