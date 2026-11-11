"use client";

import React from "react";
import { useEventEditor, EditorInitialData } from "./hooks/useEventEditor";
import { EventEditorHeader } from "./components/EventEditorHeader";
import { MobileEmulator } from "./components/MobileEmulator";
import { StoryDeckInspector } from "./components/StoryDeckInspector";
import { WireGroundingInspector } from "./components/WireGroundingInspector";
import { EventStoryBlockControls } from "@/components/EventStoryBlockControls";

export default function EventEditorClient({
  initialData,
  eventId,
}: {
  initialData: EditorInitialData;
  eventId: string;
}) {
  const { state, actions } = useEventEditor(initialData, eventId);

  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col">
      <EventEditorHeader
        eventId={eventId}
        status={state.status}
        isSaving={state.isSaving}
        saveSuccess={state.saveSuccess}
        onSave={actions.handleSave}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Context-Aware Live Mobile Viewport */}
        <MobileEmulator
          activeTab={state.activeTab}
          cards={state.cards}
          activeCard={state.activeCard}
          selectedCardIdx={state.selectedCardIdx}
          eventTitle={state.eventTitle}
          coverImageUrl={state.coverImageUrl}
          lede={state.lede}
          sduiBlocks={state.sduiBlocks}
          sources={initialData.sources}
          onSelectCard={(idx) => {
            actions.setSelectedCardIdx(idx);
            actions.setActiveTab("cards");
          }}
        />

        {/* Right Column: High-Speed Editorial Inspector */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-4xl">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-content-secondary">
              Story Event Headline
            </label>
            <input
              type="text"
              value={state.eventTitle}
              onChange={(e) => actions.setEventTitle(e.target.value)}
              className="w-full bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-base font-semibold text-content-primary focus:outline-none focus:border-border-strong"
            />
          </div>

          {/* Inspector Tabs */}
          <div className="flex items-center gap-1 border-b border-border-subtle pb-3">
            <button
              onClick={() => actions.setActiveTab("story")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                state.activeTab === "story"
                  ? "bg-brand text-white"
                  : "text-content-secondary hover:text-content-primary hover:bg-elevated"
              }`}
            >
              Story & SDUI Blocks
            </button>
            <button
              onClick={() => actions.setActiveTab("cards")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                state.activeTab === "cards"
                  ? "bg-brand text-white"
                  : "text-content-secondary hover:text-content-primary hover:bg-elevated"
              }`}
            >
              Key Points Deck ({state.cards.length})
            </button>
            <button
              onClick={() => actions.setActiveTab("sources")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                state.activeTab === "sources"
                  ? "bg-brand text-white"
                  : "text-content-secondary hover:text-content-primary hover:bg-elevated"
              }`}
            >
              Wire Sources & Entities
            </button>
          </div>

          {/* TAB 1: Story Prose & Modular SDUI Blocks */}
          {state.activeTab === "story" && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                  Cover Photo URL
                </label>
                <input
                  type="text"
                  value={state.coverImageUrl}
                  placeholder="https://..."
                  onChange={(e) => actions.setCoverImageUrl(e.target.value)}
                  className="w-full bg-elevated border border-border-subtle rounded-xl px-4 py-2 text-xs font-mono text-content-primary focus:outline-none focus:border-border-strong"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                  Executive Lede (1–2 Sentences)
                </label>
                <textarea
                  rows={3}
                  value={state.lede}
                  placeholder="A quick line conveying the essential points..."
                  onChange={(e) => actions.setLede(e.target.value)}
                  className="w-full bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-content-primary focus:outline-none focus:border-border-strong leading-relaxed"
                />
              </div>

              <EventStoryBlockControls
                blocks={state.sduiBlocks}
                onChange={actions.setSduiBlocks}
              />
            </div>
          )}

          {/* TAB 2: Key Points Deck */}
          {state.activeTab === "cards" && state.activeCard && (
            <StoryDeckInspector
              cards={state.cards}
              activeCard={state.activeCard}
              selectedCardIdx={state.selectedCardIdx}
              onSelectCard={actions.setSelectedCardIdx}
              onUpdateCard={actions.handleCardUpdate}
              onSwapTemplate={actions.handleTemplateSwap}
            />
          )}

          {/* TAB 3: Wire Sources & Entities */}
          {state.activeTab === "sources" && (
            <WireGroundingInspector
              entities={initialData.entities}
              sources={initialData.sources}
            />
          )}
        </div>
      </div>
    </div>
  );
}