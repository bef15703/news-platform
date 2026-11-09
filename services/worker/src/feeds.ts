import * as crypto from "node:crypto";
import * as cheerio from "cheerio";

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  category: "world" | "politics" | "legal" | "investigative" | "defense";
}

export const MONITORED_FEEDS: FeedSource[] = [
  // --- Tier 1: Gold-Standard Factual Wire & Public Broadcast ---
  // High factuality, neutral framing, minimal sensationalism
  {
    id: "pbs_politics",
    name: "PBS NewsHour (Politics)",
    url: "https://www.pbs.org/newshour/feeds/rss/politics",
    category: "politics",
  },
  {
    id: "pbs_world",
    name: "PBS NewsHour (World)",
    url: "https://www.pbs.org/newshour/feeds/rss/world",
    category: "world",
  },
  {
    id: "npr_politics",
    name: "NPR Politics",
    url: "https://feeds.npr.org/1014/rss.xml",
    category: "politics",
  },
  {
    id: "bbc_world",
    name: "BBC World News",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "world",
  },

  // --- Tier 2: Diverse Global & Diplomatic Perspectives ---
  // Essential for multi-source clustering and balanced "Tension/Perspectives" cards
  {
    id: "dw_world",
    name: "Deutsche Welle",
    url: "https://rss.dw.com/rdf/rss-en-all",
    category: "world",
  },
  {
    id: "al_jazeera_world",
    name: "Al Jazeera English",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    category: "world",
  },

  // --- Tier 3: Specialized Policy & Legislative Mechanics ---
  // Focuses on policy, executive actions, and bills over talking heads
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

  // --- Tier 4: Legal, Judicial & Precedent Anchors ---
  // Directly feeds Card 3 (Precedent Bridge) and Living Entity Dossiers
  {
    id: "scotusblog",
    name: "SCOTUSblog",
    url: "https://www.scotusblog.com/feed/",
    category: "legal",
  },
  {
    id: "propublica",
    name: "ProPublica",
    url: "https://www.propublica.org/feeds/propublica/main",
    category: "investigative",
  },

  // --- Tier 5: Primary Government & Security Channels ---
  // Direct, unfiltered official records before media spin
  {
    id: "dod_news",
    name: "Department of Defense",
    url: "https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=100&Site=945",
    category: "defense",
  },
  {
    id: "state_dept_press",
    name: "U.S. Department of State",
    url: "https://www.state.gov/rss-feed/press-releases/feed/",
    category: "politics",
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