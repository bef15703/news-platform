import { db, sql } from "@news-platform/db";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
});

export async function getSingleEmbedding(text: string): Promise<number[]> {
  const cleanInput = text.replace(/\s+/g, " ").trim().slice(0, 8000);

  const response = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: cleanInput,
    config: {
      outputDimensionality: 768,
    },
  });

  const values = response.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("Failed to receive embedding vector from gemini-embedding-2");
  }

  return values;
}

/**
 * Processes an array of texts concurrently using Promise.all
 * Ensures strict 1-to-1 order and vector count alignment.
 */
export async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in services/worker/.env");
  }

  if (texts.length === 0) return [];

  // Pipelined parallel execution
  return Promise.all(texts.map((text) => getSingleEmbedding(text)));
}

const BATCH_SIZE = 25;
// Iterates through all un-embedded articles in batches until none remain.
export async function clusterPendingArticles() {
  let totalProcessed = 0;

  while (true) {
    // 1. Fetch the next batch of un-embedded articles
    const pendingArticles = await db
      .selectFrom("raw_articles")
      .select(["id", "title", "summary_raw", "published_at"])
      .where("embedding", "is", null)
      .limit(BATCH_SIZE)
      .execute();

    if (pendingArticles.length === 0) {
      if (totalProcessed === 0) {
        console.log("No pending articles to embed or cluster.");
      } else {
        console.log(`\n🎉 Finished processing all pending articles! Total embedded: ${totalProcessed}`);
      }
      break;
    }

    console.log(`\nProcessing batch of ${pendingArticles.length} articles (Total so far: ${totalProcessed})...`);

    const textsToEmbed = pendingArticles.map(
      (a) => `${a.title}. ${a.summary_raw}`
    );

    // Concurrently fetch embeddings for this batch
    const vectors = await getBatchEmbeddings(textsToEmbed);

    for (let i = 0; i < pendingArticles.length; i++) {
      const article = pendingArticles[i];
      const vectorString = `[${vectors[i].join(",")}]`;

      // 2. Save vector to raw_articles
      await sql`
        UPDATE raw_articles
        SET embedding = ${vectorString}::vector
        WHERE id = ${article.id}::uuid
      `.execute(db);

      // 3. Search for matching cluster in a 36-hour sliding window
      const match = await sql<{ cluster_id: string; title: string; distance: number }>`
        SELECT cluster_id, title, (embedding <=> ${vectorString}::vector) AS distance
        FROM raw_articles
        WHERE id != ${article.id}::uuid
          AND cluster_id IS NOT NULL
          AND published_at >= (${article.published_at}::timestamptz - INTERVAL '36 HOURS')
          AND published_at <= (${article.published_at}::timestamptz + INTERVAL '36 HOURS')
        ORDER BY embedding <=> ${vectorString}::vector ASC
        LIMIT 1;
      `.execute(db);

      const nearest = match.rows[0];

      if (nearest && nearest.distance < 0.18) {
        await db
          .updateTable("raw_articles")
          .set({ cluster_id: nearest.cluster_id })
          .where("id", "=", article.id)
          .execute();

        console.log(`🔗 Clustered: "${article.title.slice(0, 38)}..." -> "${nearest.title.slice(0, 38)}..." (d: ${nearest.distance.toFixed(4)})`);
      } else {
        const newEvent = await db
          .insertInto("events")
          .values({
            title: article.title,
            status: "draft",
            deck_json: JSON.stringify([]),
            article_markdown: "",
            sdui_blocks: JSON.stringify([]),
            published_at: article.published_at,
          })
          .returning(["id", "title"])
          .executeTakeFirstOrThrow();

        await db
          .updateTable("raw_articles")
          .set({ cluster_id: newEvent.id })
          .where("id", "=", article.id)
          .execute();

        console.log(`✨ Created Event: "${newEvent.title.slice(0, 42)}..."`);
      }
    }

    totalProcessed += pendingArticles.length;
  }
}