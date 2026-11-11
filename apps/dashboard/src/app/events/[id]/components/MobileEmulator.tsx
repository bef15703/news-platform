"use client";

import React from "react";
import type { CardData } from "@/components/CardPreview";
import type { SDUIBlock } from "@news-platform/db";
import { StoryCardPreviewPane } from "./StoryCardPreviewPane";
import { ArticleFeedPreview } from "./ArticleFeedPreview";

interface MobileEmulatorProps {
  activeTab: "story" | "cards" | "sources";
  cards: CardData[];
  activeCard: CardData;
  selectedCardIdx: number;
  eventTitle: string;
  coverImageUrl: string;
  lede: string;
  sduiBlocks: SDUIBlock[];
  sources: Array<{ id: string; source_name: string; title: string; canonical_url: string }>;
  onSelectCard: (idx: number) => void;
}

export function MobileEmulator({
  activeTab,
  cards,
  activeCard,
  selectedCardIdx,
  eventTitle,
  coverImageUrl,
  lede,
  sduiBlocks,
  sources,
  onSelectCard,
}: MobileEmulatorProps) {
  return (
    <div className="w-[440px] border-r border-slate-800/80 bg-slate-900/30 flex flex-col items-center py-6 px-4 overflow-y-auto">
      {activeTab === "cards" ? (
        <StoryCardPreviewPane
          cards={cards}
          activeCard={activeCard}
          selectedCardIdx={selectedCardIdx}
          onSelectCard={onSelectCard}
        />
      ) : (
        <ArticleFeedPreview
          eventTitle={eventTitle}
          coverImageUrl={coverImageUrl}
          lede={lede}
          cards={cards}
          selectedCardIdx={selectedCardIdx}
          sduiBlocks={sduiBlocks}
          sources={sources}
          onSelectCard={onSelectCard}
        />
      )}
    </div>
  );
}