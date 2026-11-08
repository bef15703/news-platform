import { Generated, ColumnType } from "kysely";

export type EventStatus = "draft" | "in_review" | "published" | "archived";

export type EntityCategory =
  | "person"
  | "govt_branch"
  | "govt_agency"
  | "location"
  | "private_company"
  | "genre"
  | "topic";

export type BannerSeverity = "warning" | "info" | "critical";

// --- Entity SDUI Profile Blocks Types ---

export type SocialPlatform =
  | "x"
  | "facebook"
  | "instagram"
  | "youtube"
  | "website"
  | "threads"
  | "bluesky"
  | "tiktok"
  | "snapchat";

export interface TextCardBlock {
  id: string;
  type: "text_card";
  title?: string;
  body: string;
}

export interface BulletListBlock {
  id: string;
  type: "bullet_list";
  title: string;
  items: string[];
}

export interface StatStripBlock {
  id: string;
  type: "stat_strip";
  text: string;
  subtext?: string;
}

export interface FactSheetPair {
  label: string;
  value: string;
}

export interface FactSheetBlock {
  id: string;
  type: "fact_sheet";
  title?: string;
  pairs: FactSheetPair[];
}

export interface SocialLinkItem {
  platform: SocialPlatform;
  url: string;
}

export interface SocialLinksBlock {
  id: string;
  type: "social_links";
  title?: string;
  links: SocialLinkItem[];
}

export interface ImageCaptionBlock {
  id: string;
  type: "image_caption";
  imageUrl: string;
  caption?: string;
  altText?: string;
}

export type EntityProfileBlock =
  | TextCardBlock
  | BulletListBlock
  | StatStripBlock
  | FactSheetBlock
  | SocialLinksBlock
  | ImageCaptionBlock;

// --- Database Table Definitions ---

export interface RawArticlesTable {
  id: Generated<string>;
  source_id: string;
  source_name: string;
  url_hash: string;
  canonical_url: string;
  title: string;
  summary_raw: string;
  published_at: ColumnType<Date, string | Date, string | Date>;
  created_at: Generated<Date>;
  cluster_id: string | null;
  // Vector stored as string representation "[0.1, -0.2, ...]" for pgvector
  embedding: string | null;
}

export interface EntitiesTable {
  id: Generated<string>;
  slug: string;
  name: string;
  category: EntityCategory;

  // Header & Portrait
  title_role: Generated<string>;
  avatar_url: string | null;
  avatar_pos: Generated<string>;

  // Structural Context Warning Banner
  context_banner_title: string | null;
  context_banner_body: string | null;
  context_banner_severity: Generated<BannerSeverity>;
  context_banner_active: Generated<boolean>;

  // Modular Living Dossier Blocks (SDUI)
  profile_blocks: ColumnType<EntityProfileBlock[], string | EntityProfileBlock[], string | EntityProfileBlock[]>;

  // Metadata & Timestamps
  metadata: ColumnType<Record<string, unknown>, string, string>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface EventsTable {
  id: Generated<string>;
  title: string;
  status: Generated<EventStatus>;
  deck_json: ColumnType<Record<string, unknown>[], string, string>;
  article_markdown: Generated<string>;
  sdui_blocks: ColumnType<Record<string, unknown>[], string, string>;
  published_at: ColumnType<Date, string | Date, string | Date> | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface EventEntitiesTable {
  event_id: string;
  entity_id: string;
  created_at: Generated<Date>;
}

// Aggregated Database Interface
export interface Database {
  raw_articles: RawArticlesTable;
  entities: EntitiesTable;
  events: EventsTable;
  event_entities: EventEntitiesTable;
}