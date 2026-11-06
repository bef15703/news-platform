import { GoogleGenAI  } from "@google/genai";
import { db, sql } from "@news-platform/db";
import { deckSynthesisJsonSchema } from "./synthesizer-schema.js";
import * as dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
});

export async function synthesizePendingEvents() {
    const eventsToSynthesize = await sql<{
        event_id: string;
        event_title: string;
        source_count: number;
    }>`
        SELECT
            e.id AS event_id,
            e.title AS event_title,
            COUNT (r.id)::int AS source_count
        FROM events e
        JOIN raw_articles r ON r.cluster_id = e.id
        WHERE e.status = 'draft' AND jsonb_array_length(e.deck_json) = 0
        GROUP BY e.id, e.title
        ORDER BY source_count DESC
        LIMIT 5;
    `.execute(db);

    if (eventsToSynthesize.rows.length === 0) {
        console.log("No pending draft events require synthesis.");
        return;
    }

    console.log(`Synthesizing ${eventsToSynthesize.rows.length} event clusters...\n`);

    for (const row of eventsToSynthesize.rows) {
        console.log(`Synthesizing: "${row.event_title}" (${row.source_count} source articles)...`);

        // Fetch source articles grouped in this cluster
        const sourceArticles = await db
            .selectFrom("raw_articles")
            .select(["source_name", "title", "summary_raw", "canonical_url"])
            .where("cluster_id", "=", row.event_id)
            .execute();
        
            const sourcesContext = sourceArticles
                .map(
                    (s, i) =>
                        `[Source ${i + 1}: ${s.source_name}] Title: ${s.title}\nSummary: ${s.summary_raw}\nURL: ${s.canonical_url}`
                ).join("\n\n");
            
            const prompt = `
                You are an unbiased, high-speed political and world news intelligence editor.
                Synthesize the provided source coverage into a bite-sized 4-Card Story Deck plus extracted entities and data callouts.

                Guidelines:
                - Strict neutrality: Present disputes balanced with competing perspectives.
                - Card 1 (Brief): 1-2 punchy sentences stating what happened. Assign styleVariant 'photo_hero'.
                - Card 2 (Dispute/Perspectives): Outline the core tension or opposing arguments. Assign styleVariant 'solid_split'.
                - Card 3 (Context Bridge): Background history, precedent, or notable quote. Assign styleVariant 'entity_portrait' if focused on an official.
                - Card 4 (What's Next): Immediate next step, committee vote, hearing, or legal deadline. Assign styleVariant 'standard'.
                - Extract all involved entities accurately (People, Agencies, Locations, Topics).

                Source Reporting:
                ${sourcesContext}
            `;

            try {
                const response = await ai.models.generateContent({
                    model: "gemini-3.8-flash",
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseJsonSchema: deckSynthesisJsonSchema,
                        temperature: 0.2,
                    },
                });

                if (!response.text) {
                    throw new Error("No text response recieved from Gemini");
                }

                const generated = JSON.parse(response.text);

                const title: string = generated.title || row.event_title;
                const cards: any[] = Array.isArray(generated.cards) ? generated.cards : [];
                const extractedEntities: any[] = Array.isArray(generated.extractedEntities) ? generated.extractedEntities : [];
                const suggestedSDUI: any[] = Array.isArray(generated.suggestedSDUI) ? generated.suggestedSDUI : [];

                const card5Sources = {
                    order: 5,
                    cardType: "source_deck",
                    headline: "Verified Reporting Sources",
                    body: `Corroborated across ${sourceArticles.length} independent reporting outlets.`,
                    styleVariant: "standard",
                    sources: sourceArticles.map((s) => ({
                    name: s.source_name,
                    url: s.canonical_url,
                    })),
                };

                const fullDeck = [...cards, card5Sources];

                // Persist generated deck in DB and update event status to 'in_review'
                await db
                    .updateTable("events")
                    .set({
                        title,
                        status: "in_review",
                        deck_json: JSON.stringify(fullDeck),
                        sdui_blocks: JSON.stringify(suggestedSDUI),
                        updated_at: new Date(),
                    })
                    .where("id", "=", row.event_id)
                    .execute();

                // Upsert extracted entities into entities table and link
                let linkedCount = 0;
                for (const ent of extractedEntities) {
                    if (!ent?.name) continue;

                    const slug = ent.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

                    const validCategories = [
                        "person",
                        "govt_branch",
                        "govt_agency",
                        "location",
                        "private_company",
                        "genre",
                        "topic",
                    ];

                    const category = validCategories.includes(ent.category) ? ent.category : "topic";

                    const upsertedEntity = await db 
                        .insertInto("entities")
                        .values({
                            slug,
                            name: ent.name,
                            category,
                            metadata: JSON.stringify({ role: ent.roleOrContext || "" }),
                        })
                        .onConflict((oc) =>
                            oc.column("slug").doUpdateSet({ name: ent.name })
                        )
                        .returning(["id"])
                        .executeTakeFirstOrThrow();

                    await sql`
                        INSERT INTO event_entities (event_id, entity_id)
                        VALUES (${row.event_id}::uuid, ${upsertedEntity.id}::uuid)
                        ON CONFLICT DO NOTHING;
                    `.execute(db);

                    linkedCount++;
                }

            console.log(`✅ Deck drafted for "${generated.title}" (${linkedCount} entities linked)\n`);
        } catch (err) {
            console.error(`❌ Failed to synthesize event ${row.event_id}:`, err);
        }
    }
}