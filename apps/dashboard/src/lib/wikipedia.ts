import {
  EntityProfileBlock,
  TextCardBlock,
  StatStripBlock,
} from "@news-platform/db";

export interface WikipediaCandidate {
  title: string;
  snippet: string;
  pageid: number;
}

export interface WikipediaAutofillResult {
  resolvedTitle: string;
  name: string;
  titleRole: string;
  avatarUrl: string | null;
  profileBlocks: EntityProfileBlock[];
}

/**
 * Step 1: Searches Wikipedia for up to 5 matching candidates.
 */
export async function searchWikipediaCandidates(params: {
  name: string;
  titleRole?: string;
  category?: string;
}): Promise<WikipediaCandidate[]> {
  const { name, titleRole, category } = params;
  if (!name.trim()) return [];

  const categoryCue = category ? category.replace("_", " ") : "";
  const query = [name, titleRole, categoryCue].filter(Boolean).join(" ");

  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&format=json&origin=*&srlimit=5`;

  const res = await fetch(searchUrl, {
    headers: {
      "User-Agent": "NewsPlatform/1.0",
    },
  });

  if (!res.ok) return [];
  const json = await res.json();
  const searchResults = json?.query?.search || [];

  return searchResults.map((r: { title: string; snippet: string; pageid: number }) => ({
    title: r.title,
    snippet: r.snippet.replace(/<[^>]+>/g, ""), // Strip HTML tags like <span class="searchmatch">
    pageid: r.pageid,
  }));
}

/**
 * Step 2: Fetches full summary & portrait for the user-selected article.
 */
export async function fetchSummaryByArticleTitle(
  articleTitle: string
): Promise<WikipediaAutofillResult | null> {
  const slug = encodeURIComponent(articleTitle.replace(/\s+/g, "_"));
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`,
    {
      headers: {
        "User-Agent": "NewsPlatformDossier/1.0 (contact@yourdomain.com)",
      },
    }
  );
  console.log('--- WIKIPEDIA DEBUG ---');
  console.log(slug);
  console.log(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`);
  console.log('--- WIKIPEDIA DEBUG END ---');

  if (!res.ok) return null;
  const data = await res.json();

  const blocks: EntityProfileBlock[] = [];

  if (data.extract) {
    const overviewBlock: TextCardBlock = {
      id: `block_overview_${Date.now()}`,
      type: "text_card",
      title: "Overview",
      body: data.extract,
    };
    blocks.push(overviewBlock);
  }

  if (data.coordinates) {
    const coordBlock: StatStripBlock = {
      id: `block_coords_${Date.now()}`,
      type: "stat_strip",
      text: `Coordinates: ${data.coordinates.lat.toFixed(4)}°, ${data.coordinates.lon.toFixed(4)}°`,
    };
    blocks.push(coordBlock);
  }

  return {
    resolvedTitle: data.title,
    name: data.titles?.normalized || data.title,
    titleRole: data.description || "",
    avatarUrl: data.originalimage?.source || data.thumbnail?.source || null,
    profileBlocks: blocks,
  };
}