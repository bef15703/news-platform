"server-only";
"use server";

import { db, sql } from "@news-platform/db";
import { revalidatePath } from "next/cache";
import { EntityProfileBlock } from "@/lib/entityBlocks";

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
    },
    linkedEvents: linkedEvents.rows,
  };
}

export async function updateEntity(
  entityId: string,
  payload: {
    name: string;
    title_role: string;
    category: string;
    avatar_url: string | null;
    avatar_pos: string;
    context_banner_active: boolean;
    context_banner_severity: string;
    context_banner_title: string;
    context_banner_body: string;
    profile_blocks: EntityProfileBlock[];
  }
) {
  await db
    .updateTable("entities")
    .set({
      name: payload.name,
      title_role: payload.title_role,
      category: payload.category,
      avatar_url: payload.avatar_url,
      avatar_pos: payload.avatar_pos,
      context_banner_active: payload.context_banner_active,
      context_banner_severity: payload.context_banner_severity,
      context_banner_title: payload.context_banner_title,
      context_banner_body: payload.context_banner_body,
      profile_blocks: JSON.stringify(payload.profile_blocks) as any,
    })
    .where("id", "=", entityId)
    .execute();

  revalidatePath(`/entities/${entityId}`);
  return { success: true };
}