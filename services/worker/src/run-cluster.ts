import { clusterPendingArticles } from "./clusterer.js";

async function main() {
  console.log("Starting semantic clustering pass...\n");
  await clusterPendingArticles();
  console.log("\nClustering pass finished successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Clustering run failed:", err);
  process.exit(1);
});