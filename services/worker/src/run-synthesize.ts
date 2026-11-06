import { synthesizePendingEvents } from "./synthesizer.js";

async function main() {
  console.log("Starting deck synthesis worker pass...\n");
  await synthesizePendingEvents();
  console.log("Deck synthesis pass completed.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Synthesizer script failed:", err);
  process.exit(1);
});