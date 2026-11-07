export interface MetricItem {
  label: string;
  value: string;
  subtext?: string;
}

export interface MetricStripBlock {
  id: string;
  type: "metric_strip";
  title?: string;
  items: MetricItem[];
}

export interface TakeawayListBlock {
  id: string;
  type: "takeaway_list";
  title: string;
  items: string[];
}

export type EntityProfileBlock = MetricStripBlock | TakeawayListBlock;

// Helper to generate quick unique IDs for added blocks
export function createDefaultBlock(type: "metric_strip" | "takeaway_list"): EntityProfileBlock {
  const id = `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (type === "metric_strip") {
    return {
      id,
      type: "metric_strip",
      title: "Key Metrics",
      items: [
        { label: "Role / Stat", value: "Primary Value", subtext: "Context or Source" },
      ],
    };
  }

  return {
    id,
    type: "takeaway_list",
    title: "Key Takeaways",
    items: ["First notable track record or context point..."],
  };
}