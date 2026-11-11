// Client & Kysely Exports
export * from "./client.js";
export * from "./types.js";
export { sql } from "kysely";

// 1. Five-Card Story Deck Schema
export interface StoryCard {
  id: string;
  order: 1 | 2 | 3 | 4 | 5;
  type:
    | "brief"
    | "dispute"
    | "context_bridge"
    | "next_milestone"
    | "source_deck";
  headline: string;
  body: string;
  metadata?: {
    pro_argument?: string;
    con_argument?: string;
    timeline?: Array<{ label: string; date: string }>;
    sources?: Array<{ name: string; url: string; faviconUrl?: string }>;
  };
}

// 2. Polymorphic SDUI Content Blocks
export interface BaseBlock {
  id: string; // Deterministic UUID
}

export type SDUIBlock = BaseBlock & (
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; url: string; caption?: string; credit?: string }
  | { type: "breaking_banner"; title: string; severity: "urgent" | "developing" | "update"; dismissible?: boolean }
  | { type: "data_chart"; chartType: "split_bar" | "gauge"; title: string; primaryLabel: string; primaryValue: number; secondaryLabel: string; secondaryValue: number; thresholdValue?: number }
  | { type: "direct_quote_callout"; speaker: string; role?: string; quote: string; avatarUrl?: string }
  | { type: "social_post_embed"; platform: "x" | "bluesky" | "truth_social"; authorName: string; authorHandle: string; authorAvatarUrl?: string; contentText: string; sourceUrl: string; postedAt: string }
  | { type: "story_deck_preview"; deckId: string; title: string; cardCount: number; leadBrief: string }
  | { type: "markdown_text"; body: string }
);