export interface CardTemplate {
    id: string;
    name: string;
    cardType: "brief" | "dispute" | "context_bridge" | "next_milestone" | "source_deck";
    layoutVariant: "photo_hero" | "solid_color";
    styles: {
        bg: string;
        textColor: string;
        accentColor: string;
    };
}

export const TEMPLATE_REGISTRY: Record<string, CardTemplate> = {
    hero_photo_overlay: {
        id: "hero_photo_overlay",
        name: "Photo Hero (Glass Capsule)",
        cardType: "brief",
        layoutVariant: "photo_hero",
        styles: {
            bg: "#0F172A",
            textColor: "#FFFFFF",
            accentColor: "#EF4444",
        },
    },
    solid_color: {
        id: "solid_color",
        name: "Solid Color",
        cardType: "dispute",
        layoutVariant: "solid_color",
        styles: {
            bg: "#2563EB",
            textColor: "#FFFFFF",
            accentColor: "#93C5FD",
        },
    },
};

// Deterministic fallback to assign templates locally
export function getDefaultTemplateForCardType(cardType: string): CardTemplate {
  switch (cardType) {
    case "brief":
      return TEMPLATE_REGISTRY.hero_photo_overlay;
    default:
      return TEMPLATE_REGISTRY.solid_color;
  }
}