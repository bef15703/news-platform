import * as crypto from "node:crypto";
import * as cheerio from "cheerio";

export interface FeedSource {
    id: string;
    name: string;
    url: string;
    category: "world" | "politics" | "defense" | "regulatory";
}

export const MONITORED_FEEDS: FeedSource[] = [
  // Tier 1: Global Baseline
  {
    id: "bbc_world",
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "world",
  },
  {
    id: "npr_politics",
    name: "NPR News",
    url: "https://feeds.npr.org/1014/rss.xml",
    category: "politics",
  },
  // Tier 2: Specialized Policy & Congress
  {
    id: "politico_politics",
    name: "Politico",
    url: "https://rss.politico.com/politics-news.xml",
    category: "politics",
  },
  {
    id: "the_hill",
    name: "The Hill",
    url: "https://thehill.com/feed/",
    category: "politics",
  },
  // Tier 3: Primary Government Channels
  {
    id: "dod_news",
    name: "Department of Defense",
    url: "https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=100&Site=945",
    category: "defense",
  },
];

// Remove UTM tags and tracking parameters to establish canonical URL
export function cleanCanonicalUrl(rawUrl: string): string {
    try {
        const url = new URL(rawUrl);
        const trackingParams = [
            "utm_source",
            "utm_medium",
            "utm_campaign",
            "utm_term",
            "utm_content",
            "ref",
            "fbclid",
            "gclid",
        ];
        for (const param of trackingParams) {
            url.searchParams.delete(param);
        }
        return url.toString();
    } catch {
        return rawUrl;
    }
}

// Generates deterministic SHA-256 hash for deduplication
export function computeUrlHash(url: string): string {
    return crypto.createHash("sha256").update(url.trim()).digest("hex");
}

// Strips HTML tags, scripts, and image beacons down to clean text summary
export function sanitizeSummary(rawHtmlOrText: string): string {
    if (!rawHtmlOrText) return "";
    const $ = cheerio.load(rawHtmlOrText);
    $("script, style, img, figure, iframe").remove();
    return $.text().replace(/\s+/g, " ").trim();
}