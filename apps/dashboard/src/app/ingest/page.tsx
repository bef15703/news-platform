import React from "react";
import { getIngestClusters } from "./actions";
import IngestTriageClient from "./IngestTriageClient";

export const dynamic = "force-dynamic";

export default async function IngestPage() {
  const clusters = await getIngestClusters();

  return <IngestTriageClient initialClusters={clusters} />;
}