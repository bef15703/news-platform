"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { CardPreview, CardData } from "@/components/CardPreview";

interface StoryCardPreviewPaneProps {
  cards: CardData[];
  activeCard: CardData;
  selectedCardIdx: number;
  onSelectCard: (idx: number) => void;
}

export function StoryCardPreviewPane({
  cards,
  activeCard,
  selectedCardIdx,
  onSelectCard,
}: StoryCardPreviewPaneProps) {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="text-[11px] font-semibold text-content-secondary mb-3 uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-brand" />
        <span>
          Full-Screen Card Preview ({selectedCardIdx + 1} of {cards.length})
        </span>
      </div>

      {activeCard && <CardPreview card={activeCard} isSelected={true} />}

      <div className="flex items-center gap-2 mt-5 bg-surface border border-border-subtle p-1.5 rounded-xl">
        {cards.map((c, i) => (
          <button
            key={c.id ? `card-select-${c.id}-${i}` : `card-select-${i}`}
            onClick={() => onSelectCard(i)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              selectedCardIdx === i
                ? "bg-brand text-white shadow-sm"
                : "text-content-secondary hover:text-content-primary hover:bg-elevated"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-content-muted mt-3 text-center max-w-[260px]">
        Full-screen modal representation as seen when users tap into a card from the article header in the iOS app.
      </p>
    </div>
  );
}