"server-only";
"use server";

import { db, sql, EntityCategory, BannerSeverity } from "@news-platform/db";
import { revalidatePath } from "next/cache";
import { EntityProfileBlock } from "@news-platform/db";
import { searchWikipediaCandidates, fetchSummaryByArticleTitle } from "@/lib/wikipedia";

export async function getEntityForEditor(entityId: string) {
  const entity = await db
    .selectFrom("entities")
    .selectAll()
    .where("id", "=", entityId)
    .executeTakeFirst();

  if (!entity) return null;

  // Safely parse profile_blocks JSONB
  const profileBlocks: EntityProfileBlock[] =
    typeof entity.profile_blocks === "string"
      ? JSON.parse(entity.profile_blocks)
      : entity.profile_blocks || [];
  
  const metadata = typeof entity.metadata === "string" 
    ? JSON.parse(entity.metadata) 
    : entity.metadata || {};

  // Fetch recent stories linked to this entity
  const linkedEvents = await sql<{
    id: string;
    title: string;
    status: string;
    updated_at: string;
  }>`
    SELECT e.id, e.title, e.status, e.updated_at
    FROM events e
    JOIN event_entities ee ON ee.event_id = e.id
    WHERE ee.entity_id = ${entityId}::uuid
    ORDER BY e.updated_at DESC
    LIMIT 10;
  `.execute(db);

  return {
    entity: {
      ...entity,
      profile_blocks: profileBlocks,
      metadata: metadata,
    },
    linkedEvents: linkedEvents.rows,
  };
}

export async function updateEntity(
  entityId: string,
  payload: {
    name: string;
    title_role: string;
    category: EntityCategory | string;
    avatar_url: string | null;
    avatar_pos: string;
    context_banner_active: boolean;
    context_banner_severity: BannerSeverity | string;
    context_banner_title: string;
    context_banner_body: string;
    profile_blocks: EntityProfileBlock[];
    metadata?: Record<string, unknown>;
  }
) {
  await db
    .updateTable("entities")
    .set({
      name: payload.name,
      title_role: payload.title_role,
      category: payload.category as EntityCategory,
      avatar_url: payload.avatar_url,
      avatar_pos: payload.avatar_pos,
      context_banner_active: payload.context_banner_active,
      context_banner_severity: payload.context_banner_severity as BannerSeverity,
      context_banner_title: payload.context_banner_title,
      context_banner_body: payload.context_banner_body,
      profile_blocks: JSON.stringify(payload.profile_blocks),
      metadata: JSON.stringify(payload.metadata || {})
    })
    .where("id", "=", entityId)
    .execute();

  revalidatePath(`/entities/${entityId}`);
  return { success: true };
}

export async function findWikipediaCandidates(params: {
  name: string;
  titleRole?: string;
  category?: string;
}) {
  try {
    const candidates = await searchWikipediaCandidates(params);
    return { success: true, candidates };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to search candidates.";
    return { success: false, error: message };
  }
}

export async function applyWikipediaSelection(title: string) {
  try {
    const result = await fetchSummaryByArticleTitle(title);
    if (!result) return { success: false, error: "Could not fetch summary." };
    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load details.";
    return { success: false, error: message};
  }
}