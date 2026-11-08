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

export async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in environment");
  }

  if (texts.length === 0) return [];

  return Promise.all(texts.map((text) => getSingleEmbedding(text)));
}

const BATCH_SIZE = 25;

export async function clusterPendingArticles(): Promise<{
  processed: number;
  newEvents: number;
  grouped: number;
}> {
  let totalProcessed = 0;
  let newEvents = 0;
  let grouped = 0;

  while (true) {
    const pendingArticles = await db
      .selectFrom("raw_articles")
      .select(["id", "title", "summary_raw", "published_at"])
      .where("embedding", "is", null)
      .limit(BATCH_SIZE)
      .execute();

    if (pendingArticles.length === 0) {
      break;
    }

    const textsToEmbed = pendingArticles.map(
      (a) => `${a.title}. ${a.summary_raw}`
    );

    const vectors = await getBatchEmbeddings(textsToEmbed);

    for (let i = 0; i < pendingArticles.length; i++) {
      const article = pendingArticles[i];
      const vectorString = `[${vectors[i].join(",")}]`;

      // 1. Save vector to raw_articles
      await sql`
        UPDATE raw_articles
        SET embedding = ${vectorString}::vector
        WHERE id = ${article.id}::uuid
      `.execute(db);

      // 2. Search for matching cluster within a 36-hour sliding window
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

      // Distance threshold: 0.24 allows multi-source grouping
      if (nearest && nearest.distance < 0.18) {
        await db
          .updateTable("raw_articles")
          .set({ cluster_id: nearest.cluster_id })
          .where("id", "=", article.id)
          .execute();

        grouped++;
      } else {
        const newEvent = await db
          .insertInto("events")
          .values({
            title: article.title.slice(0, 255),
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

        newEvents++;
      }
    }

    totalProcessed += pendingArticles.length;
  }

  return { processed: totalProcessed, newEvents, grouped };
}