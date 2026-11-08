import { GoogleGenAI } from "@google/genai";
import { db, sql } from "@news-platform/db";
import { deckSynthesisJsonSchema } from "./synthesizer-schema.js";
import * as dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function synthesizeSingleEvent(eventId: string) {
  const event = await db
    .selectFrom("events")
    .select(["id", "title"])
    .where("id", "=", eventId)
    .executeTakeFirst();

  if (!event) throw new Error(`Event ${eventId} not found.`);

  const sourceArticles = await db
    .selectFrom("raw_articles")
    .select(["source_name", "title", "summary_raw", "canonical_url"])
    .where("cluster_id", "=", eventId)
    .execute();

  if (sourceArticles.length === 0) {
    throw new Error("Cluster contains no source articles.");
  }

  const sourcesContext = sourceArticles
    .map(
      (s, i) =>
        `[Source ${i + 1}: ${s.source_name}] Title: ${s.title}\nSummary: ${s.summary_raw}\nURL: ${s.canonical_url}`
    )
    .join("\n\n");

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

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: deckSynthesisJsonSchema,
      temperature: 0.2,
    },
  });

  const rawText = response.text || "";
  if (!rawText) throw new Error("No text response received from Gemini.");

  const cleanedText = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  const generated = JSON.parse(cleanedText);

  const title: string = (generated.title || event.title).slice(0, 255);
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

  await db
    .updateTable("events")
    .set({
      title,
      status: "in_review",
      deck_json: JSON.stringify([...cards, card5Sources]),
      sdui_blocks: JSON.stringify(suggestedSDUI),
      updated_at: new Date(),
    })
    .where("id", "=", eventId)
    .execute();

  for (const ent of extractedEntities) {
    if (!ent?.name) continue;

    const safeName = String(ent.name).trim().slice(0, 255);
    const slug =
      safeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 128) || `entity-${Date.now()}`;

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

    const upserted = await db
      .insertInto("entities")
      .values({
        slug,
        name: safeName,
        category,
        metadata: JSON.stringify({ role: ent.roleOrContext || "" }),
      })
      .onConflict((oc) => oc.column("slug").doUpdateSet({ name: safeName }))
      .returning(["id"])
      .executeTakeFirstOrThrow();

    await sql`
      INSERT INTO event_entities (event_id, entity_id)
      VALUES (${eventId}::uuid, ${upserted.id}::uuid)
      ON CONFLICT DO NOTHING;
    `.execute(db);
  }

  return { success: true, title };
}