import {
  EntityProfileBlock,
} from "@news-platform/db";

export function createDefaultBlock(
  type: EntityProfileBlock["type"]
): EntityProfileBlock {
  const id = `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  switch (type) {
    case "text_card":
      return {
        id,
        type: "text_card",
        title: "",
        body: "",
      };

    case "stat_strip":
      return {
        id,
        type: "stat_strip",
        text: "",
      };

    case "bullet_list":
      return {
        id,
        type: "bullet_list",
        title: "",
        items: [
          ""
        ],
      };

    case "fact_sheet":
      return {
        id,
        type: "fact_sheet",
        title: "",
        pairs: [
          { label: "", value: "" },
        ],
      };

    case "social_links":
      return {
        id,
        type: "social_links",
        title: "Socials",
        links: [
          { platform: "x", url: "https://x.com/" },
          { platform: "facebook", url: "https://facebook.com/" },
          { platform: "instagram", url: "https://instagram.com/" },
          { platform: "youtube", url: "https://youtube.com/" },
        ],
      };

    case "image_caption":
      return {
        id,
        type: "image_caption",
        imageUrl: "",
        caption: "",
        altText: "",
      };
  }
}