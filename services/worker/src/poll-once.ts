import { MONITORED_FEEDS } from "./feeds.js";
import { pollFeed } from "./poller.js";
import { db } from "@news-platform/db";

async function main() {
    console.log("Starting single-pass feed poll across all monitored sources...\n");

    let totalNew = 0;
    let totalDups = 0;

    for (const source of MONITORED_FEEDS) {
        console.log(`Fetching ${source.name}...`);
        const { inserted, skipped } = await pollFeed(source);
        totalNew += inserted;
        totalDups += skipped;
    }

    console.log("\nAll feeds processed.");
    console.log(`Summary: ${totalNew} articles added to raw_articles (${totalDups} already recorded).`);

    const latestArticles = await db
        .selectFrom("raw_articles")
        .select(["source_name", "title", "published_at"])
        .orderBy("published_at", "desc")
        .limit(5)
        .execute()

    console.log("\nLatest 5 Articles in Database:");
    console.table(latestArticles);

    process.exit(0);
}

main().catch((err) => {
    console.error("Fatal error during polling run:", err);
    process.exit(1);
});