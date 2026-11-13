import { NextResponse } from "next/server";
import { db, sql } from "@news-platform/db";

export const dynamic = "force-dynamic";

export interface SearchEventResult {
  id: string;
  title: string;
  lede: string | null;
  cover_image_url: string | null;
  updated_at: string;
  card_count: number;
  similarity_score: number;
}

export interface SearchEntityResult {
  id: string;
  name: string;
  slug: string;
  title_role: string | null;
  category: string;
  avatar_url: string | null;
  avatar_pos: string | null;
  similarity_score: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = (searchParams.get("q") || "").trim();
    const limit = Math.min(Number(searchParams.get("limit") || 10), 25);

    // Returns empty results immediately if query is empty or under 2 chars
    if (rawQuery.length < 2) {
      return NextResponse.json(
        {
          status: "ok",
          query: rawQuery,
          entities: [],
          events: [],
        },
        { status: 200 }
      );
    }

    const pattern = `%${rawQuery}%`;

    const [entitiesResult, eventsResult] = await Promise.all([
      // Searches entities using trigram similarity + substring match
      sql<SearchEntityResult>`
        SELECT 
          ent.id,
          ent.name,
          ent.slug,
          ent.title_role,
          ent.category,
          ent.avatar_url,
          ent.avatar_pos,
          similarity(ent.name, ${rawQuery}) AS similarity_score
        FROM entities ent
        WHERE ent.name ILIKE ${pattern}
           OR COALESCE(ent.title_role, '') ILIKE ${pattern}
           OR similarity(ent.name, ${rawQuery}) > 0.2
        ORDER BY 
          (ent.name ILIKE ${ `${rawQuery}%` }) DESC,
          similarity_score DESC,
          ent.name ASC
        LIMIT ${limit};
      `.execute(db),

      // Searches published events by title and lede
      sql<SearchEventResult>`
        SELECT 
          e.id,
          e.title,
          e.lede,
          e.cover_image_url,
          e.updated_at,
          COALESCE(jsonb_array_length(e.deck_json), 0)::int AS card_count,
          GREATEST(
            similarity(e.title, ${rawQuery}),
            similarity(COALESCE(e.lede, ''), ${rawQuery})
          ) AS similarity_score
        FROM events e
        WHERE e.status = 'published'
          AND (
            e.title ILIKE ${pattern}
            OR COALESCE(e.lede, '') ILIKE ${pattern}
            OR similarity(e.title, ${rawQuery}) > 0.15
          )
        ORDER BY 
          similarity_score DESC,
          e.updated_at DESC
        LIMIT ${limit};
      `.execute(db),
    ]);

    return NextResponse.json(
      {
        status: "ok",
        query: rawQuery,
        entities: entitiesResult.rows,
        events: eventsResult.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /api/v1/search] Error executing search:", error);
    return NextResponse.json(
      { status: "error", message: "Search query failed" },
      { status: 500 }
    );
  }
}