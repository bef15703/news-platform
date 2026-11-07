import { db, sql } from "./index.js";

async function runSmokeTest() {
  console.log("Starting database connection smoke test...\n");

  try {
    const extensions = await sql<{ extname: string }>`
      SELECT extname FROM pg_extension WHERE extname IN ('vector', 'pg_trgm', 'uuid-ossp')
    `.execute(db);
    console.log("✅ Verified PostgreSQL extensions:", extensions.rows.map(r => r.extname));

    // 2. Test inserting a test entity with the new Living Dossier columns
    const insertedEntity = await db
      .insertInto("entities")
      .values({
        slug: "monetary-policy",
        name: "Monetary Policy",
        category: "topic",
        title_role: "Macroeconomic Framework",
        avatar_pos: "center",
        context_banner_active: false,
        profile_blocks: JSON.stringify([]),
        metadata: JSON.stringify({ description: "Central banking and interest rate adjustments" }),
      })
      .onConflict((oc) =>
        oc.column("slug").doUpdateSet({
          name: "Monetary Policy",
          title_role: "Macroeconomic Framework",
        })
      )
      .returning(["id", "name", "category", "title_role", "profile_blocks"])
      .executeTakeFirstOrThrow();
    console.log("✅ Inserted / Verified entity with dossier fields:", insertedEntity);

    // 3. Test pgvector insertion (768 dimensions matching schema)
    const dummyVector = Array.from({ length: 768 }, (_, i) => (i === 0 ? 1.0 : 0.0));
    const vectorString = `[${dummyVector.join(",")}]`;

    const rawArticle = await db
      .insertInto("raw_articles")
      .values({
        source_id: "test_wire",
        source_name: "Test Wire",
        url_hash: "smoke_test_hash_" + Date.now(),
        canonical_url: "https://example.com/smoke-test",
        title: "Federal Reserve Adjusts Benchmark Interest Rate",
        summary_raw: "The Federal Reserve concluded its policy meeting with a unanimous vote...",
        published_at: new Date(),
        embedding: vectorString,
      })
      .returning(["id", "title"])
      .executeTakeFirstOrThrow();
    console.log("✅ Inserted test raw article with 768-dim vector:", rawArticle.title);

    // 4. Test cosine similarity search against the vector index
    const similarityResult = await sql<{ id: string; title: string; distance: number }>`
      SELECT id, title, (embedding <=> ${vectorString}::vector) AS distance
      FROM raw_articles
      WHERE id = ${rawArticle.id}::uuid
    `.execute(db);

    console.log("✅ Cosine distance test passed (0.0 means exact match):", {
      title: similarityResult.rows[0].title,
      distance: similarityResult.rows[0].distance,
    });

    console.log("\n🎉 All database tests passed successfully.");
  } catch (error) {
    console.error("❌ Smoke test failed:", error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

runSmokeTest();