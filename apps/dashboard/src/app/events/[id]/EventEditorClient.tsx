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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
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
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Story Event Headline
            </label>
            <input
              type="text"
              value={state.eventTitle}
              onChange={(e) => actions.setEventTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Inspector Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-800 pb-3">
            <button
              onClick={() => actions.setActiveTab("story")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                state.activeTab === "story"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Story & SDUI Blocks
            </button>
            <button
              onClick={() => actions.setActiveTab("cards")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                state.activeTab === "cards"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Key Points Deck ({state.cards.length})
            </button>
            <button
              onClick={() => actions.setActiveTab("sources")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                state.activeTab === "sources"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Wire Sources & Entities
            </button>
          </div>

          {/* TAB 1: Story Prose & Modular SDUI Blocks */}
          {state.activeTab === "story" && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Cover Photo URL
                </label>
                <input
                  type="text"
                  value={state.coverImageUrl}
                  placeholder="https://..."
                  onChange={(e) => actions.setCoverImageUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Executive Lede (1–2 Sentences)
                </label>
                <textarea
                  rows={3}
                  value={state.lede}
                  placeholder="A quick line conveying the essential points..."
                  onChange={(e) => actions.setLede(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
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