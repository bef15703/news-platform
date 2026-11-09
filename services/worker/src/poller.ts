import Parser from "rss-parser";
import { db } from "@news-platform/db";
import {
  MONITORED_FEEDS,
  type FeedSource,
  cleanCanonicalUrl,
  computeUrlHash,
  sanitizeSummary,
} from "./feeds.js";
import { clusterPendingArticles } from "./clusterer.js";

const parser = new Parser({
  customFields: {
    item: [["dc:date", "dcDate"]],
  },
  headers: {
    "User-Agent": "CivicNewsEngine/1.0",
    Accept: "application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8",
  },
  timeout: 10000,
});

const feedHttpCache = new Map<string, { etag?: string; lastModified?: string }>();

export async function pollFeed(source: FeedSource): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  try {
    const cachedHeaders = feedHttpCache.get(source.url);
    const requestHeaders: HeadersInit = {
      "User-Agent": "CivicNewsEngine/1.0",
    };

    if (cachedHeaders?.etag) {
      requestHeaders["If-None-Match"] = cachedHeaders.etag;
    }
    if (cachedHeaders?.lastModified) {
      requestHeaders["If-Modified-Since"] = cachedHeaders.lastModified;
    }

    const response = await fetch(source.url, { headers: requestHeaders });

    if (response.status === 304) {
      return { inserted: 0, skipped: 0 };
    }

    if (!response.ok) {
      console.warn(`[HTTP ${response.status}] Failed to fetch ${source.name}`);
      return { inserted: 0, skipped: 0 };
    }

    const newEtag = response.headers.get("etag") ?? undefined;
    const newLastModified = response.headers.get("last-modified") ?? undefined;
    feedHttpCache.set(source.url, { etag: newEtag, lastModified: newLastModified });

    const rawXml = await response.text();
    const feed = await parser.parseString(rawXml);

    // Cap at the latest 30 items per pass to prevent feed flooding
    const itemsToProcess = (feed.items || []).slice(0, 30);

    for (const item of itemsToProcess) {
      if (!item.link || !item.title) continue;

      const canonicalUrl = cleanCanonicalUrl(item.link);
      const urlHash = computeUrlHash(canonicalUrl);
      const cleanSummary = sanitizeSummary(item.contentSnippet || item.content || item.summary || "");
      
      // Parse Dublin Core, ISO, or standard pubDate before fallback
      const rawDate = item.isoDate || (item as any).dcDate || item.pubDate;
      const pubDate = rawDate && !isNaN(Date.parse(rawDate)) ? new Date(rawDate) : new Date();

      try {
        const result = await db
          .insertInto("raw_articles")
          .values({
            source_id: source.id,
            source_name: source.name,
            url_hash: urlHash,
            canonical_url: canonicalUrl,
            title: item.title.trim(),
            summary_raw: cleanSummary,
            published_at: pubDate,
            embedding: null,
          })
          .onConflict((oc) => oc.column("url_hash").doNothing())
          .returning(["id"])
          .executeTakeFirst();

        if (result?.id) {
          inserted++;
        } else {
          skipped++;
        }
      } catch (dbErr) {
        console.error(`Error saving article ${item.title}:`, dbErr);
      }
    }
  } catch (err) {
    console.error(`Failed to parse feed for ${source.name}:`, err);
  }

  return { inserted, skipped };
}

export async function pollAndClusterAllFeeds() {
  let inserted = 0;
  let skipped = 0;

  for (const source of MONITORED_FEEDS) {
    const res = await pollFeed(source);
    inserted += res.inserted;
    skipped += res.skipped;
  }

  // Always run clustering so un-embedded articles are processed
  const clusterStats = await clusterPendingArticles();

  return {
    inserted,
    skipped,
    ...clusterStats,
  };
}