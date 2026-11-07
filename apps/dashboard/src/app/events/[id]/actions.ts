"server-only";
"use server";

import { db, sql } from "@news-platform/db";
import { revalidatePath } from "next/cache";

export async function getEventForEditor(eventId: string) {
    const event = await db
        .selectFrom("events")
        .selectAll()
        .where("id", "=", eventId)
        .executeTakeFirst();

    if (!event) return null;

    // Fetch linked media sources
    const sources = await db
        .selectFrom("raw_articles")
        .select(["id", "source_name", "title", "canonical_url", "published_at"])
        .where("cluster_id", "=", eventId)
        .execute()
    
    // Fetch linked entities
    const linkedEntities = await sql<{ id: string, name: string, category: string, role: string }>`
        SELECT e.id, e.name, e.category, (e.metadata->>'role') AS role
        FROM entities e
        JOIN event_entities ee ON ee.entity_id = e.id
        WHERE ee.event_id = ${eventId}::uuid;
    `.execute(db);

    return {
        event: {
            ...event,
            deck_json: (typeof event.deck_json === "string"
                ? JSON.parse(event.deck_json)
                : event.deck_json) || [],
            sdui_blocks: (typeof event.sdui_blocks === "string"
                ? JSON.parse(event.sdui_blocks)
                : event.sdui_blocks) || [],
        },
        sources,
        entities: linkedEntities.rows,
    };
}

export async function updateEventDeck(
    eventId: string,
    payload: {
        title: string;
        status: string;
        deck_json: any[];
        sdui_blocks: any[];
    }
) {
    await db
        .updateTable("events")
        .set({
            title: payload.title,
            status: payload.status,
            deck_json: JSON.stringify(payload.deck_json),
            sdui_blocks: JSON.stringify(payload.sdui_blocks),
            updated_at: new Date(),
        })
        .where("id", "=", eventId)
        .execute();

        revalidatePath(`/events/${eventId}`);
        return { success: true };
}