"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CardPreview, CardData } from "@/components/CardPreview";
import { EventStoryBlockControls } from "@/components/EventStoryBlockControls";
import { TEMPLATE_REGISTRY } from "@/lib/templates";
import { updateEventDeck } from "./actions";
import type { SDUIBlock } from "@news-platform/db";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  ShieldCheck,
  Newspaper,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function EventEditorClient({
  initialData,
  eventId,
}: {
  initialData: {
    event: {
      title: string;
      status: string;
      lede?: string | null;
      cover_image_url?: string | null;
      deck_json?: Record<string, unknown>[];
      sdui_blocks?: SDUIBlock[];
    };
    entities: Array<{ id: string; name: string; category: string }>;
    sources: Array<{
      id: string;
      source_name: string;
      title: string;
      canonical_url: string;
    }>;
  };
  eventId: string;
}) {
  const [eventTitle, setEventTitle] = useState(initialData.event.title);
  const [status, setStatus] = useState(initialData.event.status);
  const [lede, setLede] = useState<string>(initialData.event.lede || "");
  const [coverImageUrl, setCoverImageUrl] = useState<string>(
    initialData.event.cover_image_url || "",
  );
  const [cards, setCards] = useState<CardData[]>(
    (initialData.event.deck_json as CardData[]) || [],
  );
  const [sduiBlocks, setSduiBlocks] = useState<SDUIBlock[]>(
    (initialData.event.sdui_blocks as SDUIBlock[]) || [],
  );
  const [selectedCardIdx, setSelectedCardIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeCard = cards[selectedCardIdx] || cards[0];

  const activeTemplate =
    TEMPLATE_REGISTRY[activeCard?.template_id || ""] ||
    TEMPLATE_REGISTRY.hero_photo_overlay;

  const backHref = status === "draft" ? "/ingest" : "/";

  const [activeTab, setActiveTab] = useState<"story" | "cards" | "sources">(
    "story",
  );

  const handleCardUpdate = (field: string, val: unknown) => {
    const updated = [...cards];
    updated[selectedCardIdx] = {
      ...updated[selectedCardIdx],
      [field]: val,
    };
    setCards(updated);
  };

  const handleTemplateSwap = (templateId: string) => {
    handleCardUpdate("template_id", templateId);
  };

  const handleSave = async (overrideStatus?: string) => {
    setIsSaving(true);
    setSaveSuccess(false);
    const targetStatus = overrideStatus || status;

    await updateEventDeck(eventId, {
      title: eventTitle,
      status: targetStatus,
      lede,
      cover_image_url: coverImageUrl,
      deck_json: cards,
      sdui_blocks: sduiBlocks,
    });

    if (overrideStatus) setStatus(overrideStatus);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation & Status Bar */}
      <header className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {eventId.slice(0, 8)}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                status === "published"
                  ? "bg-emerald-400"
                  : status === "in_review"
                    ? "bg-amber-400"
                    : "bg-slate-400"
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}

          <button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            Save Draft
          </button>

          <button
            onClick={() =>
              handleSave(status === "published" ? "in_review" : "published")
            }
            disabled={isSaving}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              status === "published"
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
            }`}
          >
            {status === "published" ? "Unpublish to Review" : "Publish to App"}
          </button>
        </div>
      </header>

      {/* Main Split-View Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Context-Aware Live Mobile Viewport Emulator */}
        <div className="w-[440px] border-r border-slate-800/80 bg-slate-900/30 flex flex-col items-center py-6 px-4 overflow-y-auto">
          {activeTab === "cards" ? (
            /* ========================================================= */
            /* MODE A: Full-Screen Story Card View (Instagram Story Mode) */
            /* ========================================================= */
            <div className="flex flex-col items-center w-full">
              <div className="text-[11px] font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  Full-Screen Card Preview ({selectedCardIdx + 1} of{" "}
                  {cards.length})
                </span>
              </div>

              {activeCard && (
                <CardPreview card={activeCard} isSelected={true} />
              )}

              {/* Card Carousel Navigation Bar under the single card */}
              <div className="flex items-center gap-2 mt-5 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
                {cards.map((c, i) => (
                  <button
                    key={c.id ? `card-select-${c.id}-${i}` : `card-select-${i}`}
                    onClick={() => setSelectedCardIdx(i)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      selectedCardIdx === i
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-3 text-center max-w-[260px]">
                Full-screen modal representation as seen when users tap into a
                card from the article header in the iOS app.
              </p>
            </div>
          ) : (
            /* ========================================================= */
            /* MODE B: Full Article Feed Emulator (Mockup Layout)         */
            /* ========================================================= */
            <div className="flex flex-col items-center w-full">
              <div className="text-[11px] font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5 text-blue-400" />
                <span>Live Article Emulator</span>
              </div>

              <div className="w-full max-w-[360px] bg-slate-950 rounded-[32px] border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-100">
                {/* Cover Photo Header */}
                <div className="relative w-full aspect-[4/3] bg-slate-900 overflow-hidden shrink-0">
                  {coverImageUrl ? (
                    <Image
                      src={coverImageUrl}
                      alt={eventTitle}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                      <span className="text-xs">No cover image assigned</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end p-4">
                    <h1 className="text-base font-extrabold text-white leading-tight line-clamp-3">
                      {eventTitle || "Untitled Story Event"}
                    </h1>
                  </div>
                </div>

                {/* Scrollable Story Container */}
                <div className="p-4 space-y-5 text-left max-h-[640px] overflow-y-auto">
                  {/* Executive Lede */}
                  {lede && (
                    <p className="text-xs text-slate-300 font-serif leading-relaxed border-b border-slate-800/80 pb-3">
                      {lede}
                    </p>
                  )}

                  {/* Key Points Micro-Card Strip */}
                  {cards.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" /> Key
                          Points
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {cards.length} cards · Tap to inspect
                        </span>
                      </div>

                      <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-4 px-4 snap-x">
                        {cards.map((c, i) => (
                          <button
                            key={
                              c.id
                                ? `card-strip-${c.id}-${i}`
                                : `card-strip-${i}`
                            }
                            type="button"
                            onClick={() => {
                              setSelectedCardIdx(i);
                              setActiveTab("cards");
                            }}
                            className={`w-[110px] h-[150px] shrink-0 rounded-xl p-2.5 text-left border flex flex-col justify-between transition-all snap-start ${
                              selectedCardIdx === i
                                ? "ring-2 ring-blue-500 border-blue-400"
                                : "border-slate-800 hover:border-slate-700"
                            }`}
                            style={{
                              backgroundColor:
                                c.style_overrides?.bg || "#1e293b",
                              color: c.style_overrides?.textColor || "#f8fafc",
                            }}
                          >
                            {c.badge && (
                              <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-black/40 text-slate-200 w-fit truncate max-w-full">
                                {c.badge}
                              </span>
                            )}
                            <p className="text-[10px] font-bold leading-snug line-clamp-4">
                              {c.headline || c.body || "Card Summary"}
                            </p>
                            <span className="text-[8px] opacity-60">
                              #{i + 1}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rendered SDUI Story Blocks */}
                  <div className="space-y-4 pt-2">
                    {sduiBlocks
                      .filter((b): b is SDUIBlock =>
                        Boolean(b && typeof b === "object" && "type" in b),
                      )
                      .map((blk, idx) => (
                        <div
                          key={
                            blk.id ? `${blk.id}-${idx}` : `article-block-${idx}`
                          }
                        >
                          {blk.type === "heading" && (
                            <h3 className="text-sm font-bold text-white tracking-tight mt-3">
                              {blk.text || "Untitled Section"}
                            </h3>
                          )}

                          {blk.type === "paragraph" && (
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {blk.text}
                            </p>
                          )}

                          {blk.type === "image" && blk.url && (
                            <div className="space-y-1 my-2">
                              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                                <Image
                                  src={blk.url}
                                  alt={blk.caption || "Story inline"}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                              {blk.caption && (
                                <p className="text-[10px] text-slate-400 italic">
                                  {blk.caption}{" "}
                                  {blk.credit && (
                                    <span className="not-italic text-slate-500">
                                      ({blk.credit})
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          )}

                          {blk.type === "direct_quote_callout" && (
                            <div className="border-l-2 border-amber-400 pl-3 py-1 my-2">
                              <p className="text-xs italic text-slate-200">
                                &quot;{blk.quote}&quot;
                              </p>
                              {blk.speaker && (
                                <span className="text-[10px] font-semibold text-slate-400 block mt-1">
                                  — {blk.speaker} {blk.role && `(${blk.role})`}
                                </span>
                              )}
                            </div>
                          )}

                          {blk.type === "data_chart" && (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                              <h4 className="text-[11px] font-bold text-slate-200">
                                {blk.title}
                              </h4>
                              <div className="h-2 w-full bg-slate-800 rounded-full flex overflow-hidden">
                                <div
                                  style={{
                                    width: `${(blk.primaryValue / (blk.primaryValue + blk.secondaryValue || 1)) * 100}%`,
                                  }}
                                  className="bg-blue-500 h-full"
                                />
                                <div
                                  style={{
                                    width: `${(blk.secondaryValue / (blk.primaryValue + blk.secondaryValue || 1)) * 100}%`,
                                  }}
                                  className="bg-purple-500 h-full"
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400">
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
                                  : "border-blue-500/40 bg-blue-950/30 text-blue-300"
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

                  {/* Articles that Cover This (Grounding Sources) */}
                  <div className="border-t border-slate-800 pt-4 space-y-2 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Articles that Cover This
                    </span>
                    <div className="space-y-1.5">
                      {initialData.sources.map((s, idx) => (
                        <a
                          key={
                            s.id
                              ? `emulator-source-${s.id}-${idx}`
                              : `emulator-source-${idx}`
                          }
                          href={s.canonical_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] hover:border-slate-700 transition-colors"
                        >
                          <div className="truncate pr-2">
                            <p className="font-medium text-slate-200 truncate">
                              {s.title}
                            </p>
                            <span className="text-[9px] text-slate-500 uppercase">
                              {s.source_name}
                            </span>
                          </div>
                          <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: High-Speed Editorial Inspector */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-4xl">
          {/* Main Headline Control */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Story Event Headline
            </label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Inspector Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab("story")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === "story"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Story & SDUI Blocks
            </button>
            <button
              onClick={() => setActiveTab("cards")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === "cards"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Key Points Deck ({cards.length})
            </button>
            <button
              onClick={() => setActiveTab("sources")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === "sources"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Wire Sources & Entities
            </button>
          </div>

          {/* TAB 1: Story Prose & Modular SDUI Blocks */}
          {activeTab === "story" && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Cover Photo URL
                </label>
                <input
                  type="text"
                  value={coverImageUrl}
                  placeholder="https://..."
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Executive Lede (1–2 Sentences)
                </label>
                <textarea
                  rows={3}
                  value={lede}
                  placeholder="A quick line conveying the essential points..."
                  onChange={(e) => setLede(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <EventStoryBlockControls
                blocks={sduiBlocks}
                onChange={setSduiBlocks}
              />
            </div>
          )}

          {/* TAB 2: Key Points Deck (Single Card Inspector) */}
          {activeTab === "cards" && activeCard && (
            <div className="space-y-6">
              {/* Card Carousel Navigation Bar */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
                <span className="text-xs font-bold text-slate-400 mr-2">
                  Select Card:
                </span>
                {cards.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedCardIdx(i)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      selectedCardIdx === i
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    Card {i + 1}
                  </button>
                ))}
              </div>

              {/* Active Card Inspector Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      Inspecting Card {selectedCardIdx + 1}:
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-semibold uppercase">
                      {activeCard.cardType}
                    </span>
                  </div>
                </div>

                {/* 1-Click Fast Template Switcher */}
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-wider text-slate-400">
                    Card Visual Template Preset
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(TEMPLATE_REGISTRY).map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => handleTemplateSwap(tpl.id)}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          (activeCard.template_id || "hero_photo_overlay") ===
                          tpl.id
                            ? "bg-blue-950/60 border-blue-500 text-white ring-1 ring-blue-500"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{tpl.name}</span>
                          <span
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: tpl.styles.bg }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          Variant: {tpl.layoutVariant}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Copy Inputs */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={
                          activeCard.style_overrides?.bg ||
                          activeTemplate.styles.bg
                        }
                        onChange={(e) =>
                          handleCardUpdate("style_overrides", {
                            ...activeCard.style_overrides,
                            bg: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded-lg border border-slate-800 bg-transparent cursor-pointer shrink-0 p-0.5"
                      />
                      <input
                        type="text"
                        placeholder={activeTemplate.styles.bg}
                        value={activeCard.style_overrides?.bg || ""}
                        onChange={(e) =>
                          handleCardUpdate("style_overrides", {
                            ...activeCard.style_overrides,
                            bg: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Font Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={
                          activeCard.style_overrides?.textColor ||
                          activeTemplate.styles.textColor
                        }
                        onChange={(e) =>
                          handleCardUpdate("style_overrides", {
                            ...activeCard.style_overrides,
                            textColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded-lg border border-slate-800 bg-transparent cursor-pointer shrink-0 p-0.5"
                      />
                      <input
                        type="text"
                        placeholder={activeTemplate.styles.textColor}
                        value={activeCard.style_overrides?.textColor || ""}
                        onChange={(e) =>
                          handleCardUpdate("style_overrides", {
                            ...activeCard.style_overrides,
                            textColor: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Badge
                    </label>
                    <input
                      type="text"
                      value={activeCard.badge || ""}
                      onChange={(e) =>
                        handleCardUpdate("badge", e.target.value)
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Headline
                    </label>
                    <input
                      type="text"
                      value={activeCard.headline || ""}
                      onChange={(e) =>
                        handleCardUpdate("headline", e.target.value)
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Body Content
                    </label>
                    <textarea
                      rows={4}
                      value={activeCard.body || ""}
                      onChange={(e) => handleCardUpdate("body", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Background Image URL
                    </label>
                    <input
                      type="text"
                      value={activeCard.media_url || ""}
                      placeholder="https://..."
                      onChange={(e) =>
                        handleCardUpdate("media_url", e.target.value)
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Wire Sources & Extracted Entities */}
          {activeTab === "sources" && (
            <div className="grid grid-cols-2 gap-6">
              {/* Entities Box */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Linked Extracted Entities
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {initialData.entities.map((ent) => (
                    <span
                      key={ent.id}
                      className="text-xs px-2.5 py-1 bg-slate-800 text-slate-200 rounded-md border border-slate-700/60 flex items-center gap-1.5"
                    >
                      <span>{ent.name}</span>
                      <span className="text-[10px] text-slate-500">
                        ({ent.category})
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Source Articles Box */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />{" "}
                  Corroborated Wire Sources
                </h4>
                <div className="space-y-1.5">
                  {initialData.sources.map((s) => (
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
          )}
        </div>
      </div>
    </div>
  );
}
