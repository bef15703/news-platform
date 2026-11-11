async function main() {
  console.log("⏸Worker service running in standby mode.");
  console.log("Ingestion is triggered on-demand via the dashboard UI at /ingest or 'pnpm --filter @news-platform/worker poll'.");

  // Keep process alive if Turborepo runs it in watch mode without executing active network polls
  const KEEP_ALIVE_INTERVAL = 1000 * 60 * 60; // 1 hour
  setInterval(() => {}, KEEP_ALIVE_INTERVAL);
}

main();