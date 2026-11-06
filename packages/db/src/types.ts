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
  // Vector is stored as string representation "[0.1, -0.2, ...]" for pgvector
  embedding: string | null;
}

export interface EntitiesTable {
  id: Generated<string>;
  slug: string;
  name: string;
  category: EntityCategory;
  metadata: ColumnType<Record<string, unknown>, string, string>;
  created_at: Generated<Date>;
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