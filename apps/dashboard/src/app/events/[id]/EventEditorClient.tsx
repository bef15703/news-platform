"use client";

import React, { useState } from "react";
import { CardPreview } from "@/components/CardPreview";
import { TEMPLATE_REGISTRY, CardTemplate } from "@/lib/templates";
import { updateEventDeck } from "./actions";
import { ArrowLeft, Check, ExternalLink, Sparkles, Layers, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function EventEditorClient({
  initialData,
  eventId,
}: {
  initialData: any;
  eventId: string;
}) {
  const [eventTitle, setEventTitle] = useState(initialData.event.title);
  const [status, setStatus] = useState(initialData.event.status);
  const [cards, setCards] = useState<any[]>(initialData.event.deck_json || []);
  const [sduiBlocks, setSduiBlocks] = useState<any[]>(initialData.event.sdui_blocks || []);
  const [selectedCardIdx, setSelectedCardIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeCard = cards[selectedCardIdx] || cards[0];

  const activeTemplate = TEMPLATE_REGISTRY[activeCard?.template_id || ""] || TEMPLATE_REGISTRY.hero_photo_overlay;

  const handleCardUpdate = (field: string, val: any) => {
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
            href="/"
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
            onClick={() => handleSave(status === "published" ? "in_review" : "published")}
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
        {/* Left Column: Live Mobile Viewport Emulator */}
        <div className="w-[480px] border-r border-slate-800/80 bg-slate-900/20 flex flex-col items-center justify-start py-8 px-6 overflow-y-auto">
          <div className="text-xs font-medium text-slate-400 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
            <span>Mobile Feed Preview (Card {selectedCardIdx + 1} of {cards.length})</span>
          </div>

          {/* Interactive Card Canvas */}
          {activeCard && (
            <CardPreview
              card={activeCard}
              isSelected={true}
            />
          )}

          {/* Card Carousel Navigation Bar */}
          <div className="flex items-center gap-2 mt-5 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
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
                {i + 1}
              </button>
            ))}
          </div>

          {/* SDUI Living Dossier Preview Stack */}
          <div className="w-full max-w-[280px] mt-8 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Living Dossier Blocks
              </span>
              <span className="text-[10px] text-slate-500">{sduiBlocks.length} widgets</span>
            </div>

            {sduiBlocks.length === 0 ? (
              <div className="text-center p-4 border border-dashed border-slate-800 rounded-xl text-slate-600 text-xs">
                No extra dossier blocks attached.
              </div>
            ) : (
              sduiBlocks.map((blk, i) => (
                <div
                  key={i}
                  className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-sm text-left"
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/50">
                    {blk.blockType}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-200 mt-2">{blk.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {blk.primaryValue}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: High-Speed Editorial Inspector */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-4xl">
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

          {/* Active Card Inspector */}
          {activeCard && (
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

                <span className="text-xs text-slate-400">
                  Switch cards using the carousel under the emulator
                </span>
              </div>

              {/* 1-Click Fast Template Switcher */}
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  Card Visual Template Preset
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(TEMPLATE_REGISTRY).map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => handleTemplateSwap(tpl.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        (activeCard.template_id || "hero_photo_overlay") === tpl.id
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
                {/* Background Color: Swatch + Hex Input */}
                <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Background Color</label>
                <div className="flex items-center gap-2">
                    <input
                    type="color"
                    value={activeCard.style_overrides?.bg || activeTemplate.styles.bg}
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

                {/* Font Color: Swatch + Hex Input */}
                <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Font Color</label>
                <div className="flex items-center gap-2">
                    <input
                    type="color"
                    value={activeCard.style_overrides?.textColor || activeTemplate.styles.textColor}
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
                  <label className="text-xs font-medium text-slate-300">Badge</label>
                  <input
                    type="text"
                    value={activeCard.badge || ""}
                    onChange={(e) => handleCardUpdate("badge", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Headline</label>
                  <input
                    type="text"
                    value={activeCard.headline || ""}
                    onChange={(e) => handleCardUpdate("headline", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>


                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Body Content</label>
                  <textarea
                    rows={4}
                    value={activeCard.body || ""}
                    onChange={(e) => handleCardUpdate("body", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Footer</label>
                  <input
                    type="text"
                    value={activeCard.footer || ""}
                    onChange={(e) => handleCardUpdate("footer", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Background / Portrait Image URL
                  </label>
                  <input
                    type="text"
                    value={activeCard.media_url || ""}
                    placeholder="https://..."
                    onChange={(e) => handleCardUpdate("media_url", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Image Position</label>
                  <input
                    type="text"
                    value={activeCard.media_pos || ""}
                    onChange={(e) => handleCardUpdate("media_pos", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Linked Entities & Wire Corroboration Rail */}
          <div className="grid grid-cols-2 gap-6">
            {/* Entities Box */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Linked Extracted Entities
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {initialData.entities.map((ent: any) => (
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
                {initialData.sources.map((s: any) => (
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
        </div>
      </div>
    </div>
  );
}