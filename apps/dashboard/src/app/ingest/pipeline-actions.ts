"server-only";
"use server";

import { revalidatePath } from "next/cache";
import { pollAndClusterAllFeeds } from "../../../../../services/worker/src/poller.js";
import { synthesizeSingleEvent } from "../../../../../services/worker/src/synthesizer.js";
import { getIngestClusters } from "./actions";

export async function triggerIngestPipeline() {
  try {
    const result = await pollAndClusterAllFeeds();
    revalidatePath("/ingest");
    revalidatePath("/");

    // Return fresh clusters for instant client-side state sync
    const freshClusters = await getIngestClusters();
    return { success: true, clusters: freshClusters, ...result };
  } catch (err: any) {
    console.error("Ingest pipeline failed:", err);
    return { success: false, error: err.message || "Pipeline execution failed." };
  }
}

export async function triggerClusterSynthesis(eventId: string) {
  try {
    await synthesizeSingleEvent(eventId);
    revalidatePath("/ingest");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Synthesis failed:", err);
    return { success: false, error: err.message || "Synthesis failed." };
  }
}