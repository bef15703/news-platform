import { NextResponse } from "next/server";
import { db, sql, StoryCard, SDUIBlock } from "@news-platform/db";

export const dynamic = "force-dynamic";

export interface FeedEntityBadge {
    id: string;
    name: string;
    slug: string;
    category: string;
    avatar_url: string | null;
    context_banner_active: boolean;
    context_banner_severity: string | null;
}

export interface FeedEventItem {
    id: string;
    title: string;
    lede: string | null;
    hero_image_url: string | null;
    updated_at: string;
    source_count: number;
    deck_json: StoryCard[];
    sdui_blocks: SDUIBlock[];
    entities: FeedEntityBadge[];
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(Number(searchParams.get("limit") || 20), 50);
        const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

        const result = await sql<FeedEventItem>`
            SELECT
                e.id,
                e.title,
                e.lede,
                e.cover_image_url,
                e.updated_at,
                COALESCE(e.deck_json, '[]'::jsonb) AS deck_json,
                COALESCE(e.sdui_blocks, '[]'::jsonb) AS sdui_blocks,
                (
                    SELECT COUNT(*)::int
                    FROM raw_articles ra
                    WHERE ra.cluster_id = e.id
                ) AS source_count,
                COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                            'id', ent.id,
                            'name', ent.name,
                            'slug', ent.slug,
                            'category', ent.category,
                            'avatar_url', ent.avatar_url,
                            'context_banner_active', ent.context_banner_active,
                            'context_banner_severity', ent.context_banner_severity
                            )
                            ORDER BY ent.name ASC
                        )
                        FROM event_entities ee
                        JOIN entities ent ON ent.id = ee.entity_id
                        WHERE ee.event_id = e.id
                    ),
                    '[]'::jsonb
                ) AS entities
            FROM events e
            WHERE e.status = 'published'
            ORDER BY e.updated_at DESC
            LIMIT ${limit}
            OFFSET ${offset};
        `.execute(db);

        return NextResponse.json(
            {
                status: "ok",
                count: result.rows.length,
                events: result.rows,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[API /api/v1/feed] Error fetching feed:", error);
        return NextResponse.json(
            { status: "error", message: "Failed to load published feed" },
            { status: 500 }
        );
    }
}