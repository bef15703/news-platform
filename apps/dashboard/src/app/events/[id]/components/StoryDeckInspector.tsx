"use client";

import React from "react";
import type { CardData } from "@/components/CardPreview";
import { TEMPLATE_REGISTRY } from "@/lib/templates";

interface StoryDeckInspectorProps {
  cards: CardData[];
  activeCard: CardData;
  selectedCardIdx: number;
  onSelectCard: (idx: number) => void;
  onUpdateCard: (field: string, val: unknown) => void;
  onSwapTemplate: (templateId: string) => void;
}

export function StoryDeckInspector({
  cards,
  activeCard,
  selectedCardIdx,
  onSelectCard,
  onUpdateCard,
  onSwapTemplate,
}: StoryDeckInspectorProps) {
  const activeTemplate =
    TEMPLATE_REGISTRY[activeCard?.template_id || ""] ||
    TEMPLATE_REGISTRY.hero_photo_overlay;

  return (
    <div className="space-y-6">
      {/* Card Selector Bar */}
      <div className="flex items-center gap-2 bg-surface border border-border-subtle p-2 rounded-xl">
        <span className="text-xs font-bold text-content-secondary mr-2">Select Card:</span>
        {cards.map((c, i) => (
          <button
            key={i}
            onClick={() => onSelectCard(i)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              selectedCardIdx === i
                ? "bg-brand text-white shadow-sm"
                : "text-content-secondary hover:text-content-primary hover:bg-elevated"
            }`}
          >
            Card {i + 1}
          </button>
        ))}
      </div>

      {/* Card Editor Box */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-content-primary">
              Inspecting Card {selectedCardIdx + 1}:
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/30 font-semibold uppercase">
              {activeCard.cardType}
            </span>
          </div>
        </div>

        {/* Template Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold tracking-wider text-content-secondary">
            Card Visual Template Preset
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(TEMPLATE_REGISTRY).map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => onSwapTemplate(tpl.id)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  (activeCard.template_id || "hero_photo_overlay") === tpl.id
                    ? "bg-brand/10 border-brand text-brand ring-1 ring-brand"
                    : "bg-surface border-border-subtle text-content-secondary hover:border-border-strong"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{tpl.name}</span>
                  <span
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: tpl.styles.bg }}
                  />
                </div>
                <span className="text-[10px] text-content-muted mt-0.5 block">
                  Variant: {tpl.layoutVariant}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Copy & Styling Inputs */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-secondary">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={activeCard.style_overrides?.bg || activeTemplate.styles.bg}
                onChange={(e) =>
                  onUpdateCard("style_overrides", {
                    ...activeCard.style_overrides,
                    bg: e.target.value,
                  })
                }
                className="w-10 h-10 rounded-lg border border-border-subtle bg-transparent cursor-pointer shrink-0 p-0.5"
              />
              <input
                type="text"
                placeholder={activeTemplate.styles.bg}
                value={activeCard.style_overrides?.bg || ""}
                onChange={(e) =>
                  onUpdateCard("style_overrides", {
                    ...activeCard.style_overrides,
                    bg: e.target.value,
                  })
                }
                className="w-full bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm font-mono text-content-primary focus:outline-none focus:border-border-strong"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-secondary">Font Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={activeCard.style_overrides?.textColor || activeTemplate.styles.textColor}
                onChange={(e) =>
                  onUpdateCard("style_overrides", {
                    ...activeCard.style_overrides,
                    textColor: e.target.value,
                  })
                }
                className="w-10 h-10 rounded-lg border border-border-subtle bg-transparent cursor-pointer shrink-0 p-0.5"
              />
              <input
                type="text"
                placeholder={activeTemplate.styles.textColor}
                value={activeCard.style_overrides?.textColor || ""}
                onChange={(e) =>
                  onUpdateCard("style_overrides", {
                    ...activeCard.style_overrides,
                    textColor: e.target.value,
                  })
                }
                className="w-full bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm font-mono text-content-primary focus:outline-none focus:border-border-strong"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-secondary">Badge</label>
            <input
              type="text"
              value={activeCard.badge || ""}
              onChange={(e) => onUpdateCard("badge", e.target.value)}
              className="w-full bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-content-primary focus:outline-none focus:border-border-strong"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-secondary">Headline</label>
            <input
              type="text"
              value={activeCard.headline || ""}
              onChange={(e) => onUpdateCard("headline", e.target.value)}
              className="w-full bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-content-primary focus:outline-none focus:border-border-strong"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-secondary">Body Content</label>
            <textarea
              rows={4}
              value={activeCard.body || ""}
              onChange={(e) => onUpdateCard("body", e.target.value)}
              className="w-full bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-content-primary focus:outline-none focus:border-border-strong leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-content-secondary">Background Image URL</label>
            <input
              type="text"
              value={activeCard.media_url || ""}
              placeholder="https://..."
              onChange={(e) => onUpdateCard("media_url", e.target.value)}
              className="w-full bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs font-mono text-content-primary focus:outline-none focus:border-border-strong"
            />
          </div>
        </div>
      </div>
    </div>
  );
}