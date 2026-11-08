"server-only";
"use server";

import { db, sql } from "@news-platform/db";
import { EntityCategory } from "@news-platform/db";
import { revalidatePath } from "next/cache";

export interface EntityListItem {
  id: string;
  slug: string;
  name: string;
  category: EntityCategory;
  title_role: string;
  avatar_url: string | null;
  context_banner_active: boolean;
  context_banner_severity: string;
  profile_blocks_count: number;
  metadata: Record<string, any>;
  linked_events_count: number;
  updated_at: string;
}

/**
 * Fetch entities with optional search query and category filter.
 */
export async function getEntitiesList(params: {
  search?: string;
  category?: string;
}): Promise<EntityListItem[]> {
  const { search, category } = params;

  let query = db
    .selectFrom("entities as e")
    .select([
      "e.id",
      "e.slug",
      "e.name",
      "e.category",
      "e.title_role",
      "e.avatar_url",
      "e.context_banner_active",
      "e.context_banner_severity",
      "e.profile_blocks",
      "e.metadata",
      "e.updated_at",
      // Subquery to get total linked events
      (eb) =>
        eb
          .selectFrom("event_entities as ee")
          .select(eb.fn.count("ee.event_id").as("count"))
          .whereRef("ee.entity_id", "=", "e.id")
          .as("linked_events_count"),
    ]);

  if (category && category !== "all") {
    query = query.where("e.category", "=", category as EntityCategory);
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    query = query.where((eb) =>
      eb.or([
        eb(sql`lower(e.name)`, "like", term),
        eb(sql`lower(e.slug)`, "like", term),
        eb(sql`lower(e.title_role)`, "like", term),
      ])
    );
  }

  const rows = await query.orderBy("linked_events_count", "desc").limit(50).execute();

  return rows.map((row) => {
    // Determine profile blocks length safely
    let blocksCount = 0;
    if (Array.isArray(row.profile_blocks)) {
      blocksCount = row.profile_blocks.length;
    } else if (typeof row.profile_blocks === "string") {
      try {
        blocksCount = JSON.parse(row.profile_blocks).length;
      } catch {
        blocksCount = 0;
      }
    }

    let meta = {};
    if (typeof row.metadata === "string") {
      try {
        meta = JSON.parse(row.metadata);
      } catch {
        meta = {};
      }
    } else if (row.metadata) {
      meta = row.metadata;
    }

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
      title_role: row.title_role || "",
      avatar_url: row.avatar_url,
      context_banner_active: Boolean(row.context_banner_active),
      context_banner_severity: row.context_banner_severity || "warning",
      profile_blocks_count: blocksCount,
      metadata: meta,
      linked_events_count: Number(row.linked_events_count) || 0,
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : "",
    };
  });
}