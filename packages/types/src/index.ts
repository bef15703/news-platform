// 1. Five-Card Story Deck Schema
export interface StoryCard {
  id: string;
  order: 1 | 2 | 3 | 4 | 5;
  type: "brief" | "dispute" | "context_bridge" | "next_milestone" | "source_deck";
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
export type SDUIBlock =
  | {
      type: "breaking_banner";
      data: {
        id: string;
        title: string;
        severity: "urgent" | "developing" | "update";
        dismissible: boolean;
      };
    }
  | {
      type: "story_deck_preview";
      data: {
        deckId: string;
        title: string;
        cardCount: number;
        leadBrief: string;
      };
    }
  | {
      type: "data_chart";
      data: {
        id: string;
        chartType: "split_bar" | "gauge";
        title: string;
        primaryLabel: string;
        secondaryLabel: string;
        primaryValue: number;
        secondaryValue: number;
        thresholdValue?: number;
      };
    }
  | {
      type: "social_post_embed";
      data: {
        id: string;
        platform: "x" | "bluesky" | "truth_social";
        authorName: string;
        authorHandle: string;
        authorAvatarUrl: string;
        contentText: string;
        sourceUrl: string;
        postedAt: string;
      };
    }
  | {
      type: "direct_quote_callout";
      data: {
        id: string;
        speaker: string;
        role: string;
        quote: string;
        avatarUrl?: string;
      };
    }
  | {
      type: "markdown_text";
      data: {
        id: string;
        body: string;
      };
    };

// 3. Entity Classification
export type EntityCategory =
  | "person"
  | "govt_branch"
  | "govt_agency"
  | "location"
  | "private_company"
  | "genre";

export interface EntityItem {
  id: string;
  slug: string;
  name: string;
  category: EntityCategory;
}