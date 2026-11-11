"use client";

import { useState } from "react";
import type { CardData } from "@/components/CardPreview";
import type { SDUIBlock } from "@news-platform/db";
import { updateEventDeck } from "../actions";

export interface EditorInitialData {
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
}

export function useEventEditor(initialData: EditorInitialData, eventId: string) {
  const [eventTitle, setEventTitle] = useState(initialData.event.title);
  const [status, setStatus] = useState(initialData.event.status);
  const [lede, setLede] = useState<string>(initialData.event.lede || "");
  const [coverImageUrl, setCoverImageUrl] = useState<string>(
    initialData.event.cover_image_url || ""
  );
  const [cards, setCards] = useState<CardData[]>(
    (initialData.event.deck_json as CardData[]) || []
  );
  const [sduiBlocks, setSduiBlocks] = useState<SDUIBlock[]>(
    (initialData.event.sdui_blocks as SDUIBlock[]) || []
  );
  const [selectedCardIdx, setSelectedCardIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"story" | "cards" | "sources">("story");

  const activeCard = cards[selectedCardIdx] || cards[0];

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

  return {
    state: {
      eventTitle,
      status,
      lede,
      coverImageUrl,
      cards,
      sduiBlocks,
      selectedCardIdx,
      activeTab,
      activeCard,
      isSaving,
      saveSuccess,
    },
    actions: {
      setEventTitle,
      setStatus,
      setLede,
      setCoverImageUrl,
      setCards,
      setSduiBlocks,
      setSelectedCardIdx,
      setActiveTab,
      handleCardUpdate,
      handleTemplateSwap,
      handleSave,
    },
  };
}