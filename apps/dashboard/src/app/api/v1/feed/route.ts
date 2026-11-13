import { NextResponse } from "next/server";
import { db, sql } from "@news-platform/db";

export const dynamic = "force-dynamic";

export interface FeedEventThumbnail {
  id: string;
  title: string;
  lede: string | null;
  cover_image_url: string | null;
  updated_at: string;
  card_count: number;
  source_count: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 20), 50);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    const result = await sql<FeedEventThumbnail>`
      SELECT 
        e.id,
        e.title,
        e.lede,
        e.cover_image_url,
        e.updated_at,
        COALESCE(jsonb_array_length(e.deck_json), 0)::int AS card_count,
        (
          SELECT COUNT(*)::int 
          FROM raw_articles ra 
          WHERE ra.cluster_id = e.id
        ) AS source_count
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