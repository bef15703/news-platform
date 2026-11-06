export const deckSynthesisJsonSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "A concise, objective event headline",
    },
    summaryBrief: {
      type: "string",
      description: "1-2 sentence core factual summary of what happened",
    },
    cards: {
      type: "array",
      description: "Exactly 4 structured content cards",
      items: {
        type: "object",
        properties: {
          order: {
            type: "integer",
            description: "Card position from 1 to 4",
          },
          cardType: {
            type: "string",
            enum: ["brief", "dispute", "context_bridge", "next_milestone"],
            description: "The journalistic role of the card",
          },
          headline: {
            type: "string",
            description: "Punchy takeaway headline for this card",
          },
          body: {
            type: "string",
            description: "Short, crisp explanatory text (2-3 sentences max)",
          },
          styleVariant: {
            type: "string",
            enum: ["photo_hero", "solid_split", "entity_portrait", "standard"],
            description: "Visual card layout variant matching the UI design",
          },
          entityMentioned: {
            type: "string",
            description: "Key person, agency, or place featured, or empty string if none",
          },
        },
        required: ["order", "cardType", "headline", "body", "styleVariant"],
      },
    },
    extractedEntities: {
      type: "array",
      description: "All key people, government bodies, locations, and topics involved",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Official full name of the entity",
          },
          category: {
            type: "string",
            enum: [
              "person",
              "govt_branch",
              "govt_agency",
              "location",
              "private_company",
              "genre",
              "topic",
            ],
            description: "Category classification for the entity",
          },
          roleOrContext: {
            type: "string",
            description: "Brief role or affiliation (e.g., 'House Democrat')",
          },
        },
        required: ["name", "category", "roleOrContext"],
      },
    },
    suggestedSDUI: {
      type: "array",
      description: "Dynamic widgets (vote tallies, quotes, or status banners)",
      items: {
        type: "object",
        properties: {
          blockType: {
            type: "string",
            enum: ["breaking_banner", "data_chart", "direct_quote_callout"],
          },
          title: {
            type: "string",
            description: "Widget label",
          },
          primaryValue: {
            type: "string",
            description: "Main metric or quotation text",
          },
          secondaryValue: {
            type: "string",
            description: "Attribution or sub-label",
          },
        },
        required: ["blockType", "title", "primaryValue"],
      },
    },
  },
  required: ["title", "summaryBrief", "cards", "extractedEntities"],
};