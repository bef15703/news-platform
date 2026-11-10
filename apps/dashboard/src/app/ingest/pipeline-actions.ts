"server-only";
"use server";

import { revalidatePath } from "next/cache";
import { pollAndClusterAllFeeds } from "@news-platform/worker/poller";
import { synthesizeSingleEvent } from "@news-platform/worker/synthesizer";
import { getIngestClusters } from "./actions";

export async function triggerIngestPipeline() {
  try {
    const result = await pollAndClusterAllFeeds();
    revalidatePath("/ingest");
    revalidatePath("/");

    // Return fresh clusters for instant client-side state sync
    const freshClusters = await getIngestClusters();
    return { success: true as const, clusters: freshClusters, ...result };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Pipeline execution failed.";
    return { success: false as const, error: errorMessage };
  }
}

export async function triggerClusterSynthesis(eventId: string) {
  try {
    await synthesizeSingleEvent(eventId);
    revalidatePath("/ingest");
    revalidatePath("/");
    return { success: true as const };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Synthesis failed.";
    return { success: false as const, error: errorMessage };
  }
}