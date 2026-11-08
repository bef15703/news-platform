"server-only";
"use server";

import { db, sql } from "@news-platform/db";
import { revalidatePath } from "next/cache";

export interface IngestArticle {
  id: string;
  title: string;
  source_name: string;
  canonical_url: string;
  summary_raw: string;
  published_at: string;
}

export interface IngestCluster {
  event_id: string;
  title: string;
  status: string;
  article_count: number;
  sources: string[];
  latest_published_at: string;
  first_published_at: string;
  is_synthesized: boolean;
  articles: IngestArticle[];
}

export async function getIngestClusters(): Promise<IngestCluster[]> {
  const clusterRows = await sql<{
    event_id: string;
    event_title: string;
    event_status: string;
    is_synthesized: boolean;
    article_count: number;
    sources: string[];
    latest_published_at: string;
    first_published_at: string;
  }>`
    SELECT 
      e.id AS event_id,
      e.title AS event_title,
      e.status AS event_status,
      (jsonb_array_length(e.deck_json) > 0) AS is_synthesized,
      COUNT(ra.id)::int AS article_count,
      ARRAY_AGG(DISTINCT ra.source_name) AS sources,
      MAX(ra.published_at) AS latest_published_at,
      MIN(ra.published_at) AS first_published_at
    FROM events e
    JOIN raw_articles ra ON ra.cluster_id = e.id
    WHERE e.status IN ('draft', 'in_review')
    GROUP BY e.id, e.title, e.status, e.deck_json
    ORDER BY article_count DESC, latest_published_at DESC;
  `.execute(db);

  if (clusterRows.rows.length === 0) return [];

  const eventIds = clusterRows.rows.map((r) => r.event_id);

  const rawArticles = await db
    .selectFrom("raw_articles")
    .select([
      "id",
      "cluster_id",
      "title",
      "source_name",
      "canonical_url",
      "summary_raw",
      "published_at",
    ])
    .where("cluster_id", "in", eventIds)
    .orderBy("published_at", "desc")
    .execute();

  return clusterRows.rows.map((cluster) => {
    const clusterArticles = rawArticles
      .filter((a) => a.cluster_id === cluster.event_id)
      .map((a) => ({
        id: a.id,
        title: a.title,
        source_name: a.source_name,
        canonical_url: a.canonical_url,
        summary_raw: a.summary_raw,
        published_at: new Date(a.published_at).toISOString(),
      }));

    return {
      event_id: cluster.event_id,
      title: cluster.event_title,
      status: cluster.event_status,
      article_count: cluster.article_count,
      sources: cluster.sources || [],
      latest_published_at: cluster.latest_published_at
        ? new Date(cluster.latest_published_at).toISOString()
        : new Date().toISOString(),
      first_published_at: cluster.first_published_at
        ? new Date(cluster.first_published_at).toISOString()
        : new Date().toISOString(),
      is_synthesized: Boolean(cluster.is_synthesized),
      articles: clusterArticles,
    };
  });
}

export async function deleteCluster(eventId: string) {
  await db.transaction().execute(async (trx) => {
    // 1. Find linked entities (if already synthesized)
    const linkedEntities = await trx
      .selectFrom("event_entities")
      .select("entity_id")
      .where("event_id", "=", eventId)
      .execute();

    const entityIds = linkedEntities.map((e) => e.entity_id);

    // 2. Delete raw articles in cluster
    await trx
      .deleteFrom("raw_articles")
      .where("cluster_id", "=", eventId)
      .execute();

    // 3. Delete junction records
    await trx
      .deleteFrom("event_entities")
      .where("event_id", "=", eventId)
      .execute();

    // 4. Delete the event record
    await trx
      .deleteFrom("events")
      .where("id", "=", eventId)
      .execute();

    // 5. Clean up orphan entities
    if (entityIds.length > 0) {
      await sql`
        DELETE FROM entities e
        WHERE e.id = ANY(${entityIds}::uuid[])
          AND NOT EXISTS (
            SELECT 1 FROM event_entities ee WHERE ee.entity_id = e.id
          );
      `.execute(trx);
    }
  });

  revalidatePath("/ingest");
  revalidatePath("/");
  revalidatePath("/entities");
  return { success: true };
}