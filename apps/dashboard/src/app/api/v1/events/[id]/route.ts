import { NextResponse } from "next/server";
import { db, sql, StoryCard, SDUIBlock } from "@news-platform/db";

export const dynamic = "force-dynamic";

export interface EventDetailEntity {
  id: string;
  name: string;
  slug: string;
  title_role: string | null;
  category: string;
  avatar_url: string | null;
  avatar_pos: string | null;
}

export interface EventGroundingSource {
  id: string;
  source_name: string;
  title: string;
  canonical_url: string;
  published_at: string;
}

export interface EventDetailPayload {
  id: string;
  title: string;
  lede: string | null;
  cover_image_url: string | null;
  status: string;
  updated_at: string;
  deck_json: StoryCard[];
  sdui_blocks: SDUIBlock[];
  entities: EventDetailEntity[];
  sources: EventGroundingSource[];
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Validate UUID format up front so malformed IDs return 400 instead of a Postgres syntax error
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { status: "error", message: "Invalid event ID format" },
        { status: 400 }
      );
    }

    const result = await sql<EventDetailPayload>`
      SELECT 
        e.id,
        e.title,
        e.lede,
        e.cover_image_url,
        e.status,
        e.updated_at,
        COALESCE(e.deck_json, '[]'::jsonb) AS deck_json,
        COALESCE(e.sdui_blocks, '[]'::jsonb) AS sdui_blocks,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', ent.id,
                'name', ent.name,
                'slug', ent.slug,
                'title_role', ent.title_role,
                'category', ent.category,
                'avatar_url', ent.avatar_url,
                'avatar_pos', ent.avatar_pos
              )
              ORDER BY ent.name ASC
            )
            FROM event_entities ee
            JOIN entities ent ON ent.id = ee.entity_id
            WHERE ee.event_id = e.id
          ),
          '[]'::jsonb
        ) AS entities,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', ra.id,
                'source_name', ra.source_name,
                'title', ra.title,
                'canonical_url', ra.canonical_url,
                'published_at', ra.published_at
              )
              ORDER BY ra.published_at DESC
            )
            FROM raw_articles ra
            WHERE ra.cluster_id = e.id
          ),
          '[]'::jsonb
        ) AS sources
      FROM events e
      WHERE e.id = ${id}::uuid
        AND e.status = 'published'
      LIMIT 1;
    `.execute(db);

    const event = result.rows[0];

    if (!event) {
      return NextResponse.json(
        { status: "error", message: "Published event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        status: "ok",
        event,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /api/v1/events/[id]] Error fetching event:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to load event details" },
      { status: 500 }
    );
  }
}