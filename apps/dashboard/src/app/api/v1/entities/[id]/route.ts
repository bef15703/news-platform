import { NextResponse } from "next/server";
import { db, sql, EntityProfileBlock } from "@news-platform/db";

export const dynamic = "force-dynamic";

export interface EntityRecentEvent {
  id: string;
  title: string;
  lede: string | null;
  cover_image_url: string | null;
  updated_at: string;
}

export interface EntityDossierPayload {
  id: string;
  name: string;
  slug: string;
  title_role: string | null;
  category: string;
  avatar_url: string | null;
  avatar_pos: string | null;
  context_banner_active: boolean;
  context_banner_severity: string | null;
  context_banner_title: string | null;
  context_banner_body: string | null;
  profile_blocks: EntityProfileBlock[];
  metadata: Record<string, unknown>;
  recent_events: EntityRecentEvent[];
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { status: "error", message: "Invalid entity ID format" },
        { status: 400 }
      );
    }

    const result = await sql<EntityDossierPayload>`
      SELECT 
        ent.id,
        ent.name,
        ent.slug,
        ent.title_role,
        ent.category,
        ent.avatar_url,
        ent.avatar_pos,
        ent.context_banner_active,
        ent.context_banner_severity,
        ent.context_banner_title,
        ent.context_banner_body,
        COALESCE(ent.profile_blocks, '[]'::jsonb) AS profile_blocks,
        COALESCE(ent.metadata, '{}'::jsonb) AS metadata,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', e.id,
                'title', e.title,
                'lede', e.lede,
                'cover_image_url', e.cover_image_url,
                'updated_at', e.updated_at
              )
              ORDER BY e.updated_at DESC
            )
            FROM event_entities ee
            JOIN events e ON e.id = ee.event_id
            WHERE ee.entity_id = ent.id
              AND e.status = 'published'
          ),
          '[]'::jsonb
        ) AS recent_events
      FROM entities ent
      WHERE ent.id = ${id}::uuid
      LIMIT 1;
    `.execute(db);

    const entity = result.rows[0];

    if (!entity) {
      return NextResponse.json(
        { status: "error", message: "Entity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        status: "ok",
        entity,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /api/v1/entities/[id]] Error fetching entity:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to load entity dossier" },
      { status: 500 }
    );
  }
}