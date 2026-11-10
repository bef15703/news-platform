"use client";

import React from "react";
import Image from "next/image";
import { TEMPLATE_REGISTRY, CardTemplate } from "@/lib/templates";
import { LinkIcon } from "lucide-react";

export interface CardData {
  order?: number;
  cardType?: string;
  headline?: string;
  body?: string;
  badge?: string;
  footer?: string;
  template_id?: string;
  media_url?: string;
  entityMentioned?: string;
  media_pos?: string;
  sources?: Array<{ name: string; url: string }>;
  style_overrides?: {
    bg?: string;
    textColor?: string;
  };
  [key: string]: unknown;
}

function isShown(x?: string) {
  const hasContent = Boolean(x && x.trim().length > 0);
  return {
    vis: hasContent ? "visible" : "invisible",
    bool: hasContent,
  };
}

export function CardPreview({
  card,
  isSelected,
  onClick,
}: {
  card: CardData;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const template: CardTemplate =
    TEMPLATE_REGISTRY[card.template_id || ""] ||
    TEMPLATE_REGISTRY.hero_photo_overlay;

  const bg = card.style_overrides?.bg || template.styles.bg;
  const textColor = card.style_overrides?.textColor || template.styles.textColor;

  return (
    <div
      onClick={onClick}
      style={{ backgroundColor: bg, color: textColor }}
      className={`relative w-[280px] h-[497px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-6 cursor-pointer transition-all duration-200 select-none ${
        isSelected ? "ring-4 ring-blue-500 scale-[1.02]" : "hover:scale-[1.01]"
      }`}
    >
      {/* Photo Hero Variant */}
      {template.layoutVariant === "photo_hero" && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center -z-10"
            style={{
              backgroundImage: `url(${
                card.media_url ||
                "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/US_Capitol_and_Grant_Memorial.JPG/960px-US_Capitol_and_Grant_Memorial.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail"
              })`,
              backgroundPosition: card.media_pos ? card.media_pos : "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent -z-10" />

          {/* Badge & Order Header */}
          <div className="flex justify-between items-center z-10">
            <span
              className={`${isShown(card.badge).vis} px-3 py-1 bg-white/25 backdrop-blur-md text-white text-xs font-semibold rounded-full uppercase tracking-wider border border-white/20`}
            >
              {card.badge || "\u00A0"}
            </span>
            <span className="text-white/70 text-xs font-bold">{card.order} / 5</span>
          </div>

          {/* Frosted Glass Lower Pill */}
          <div className="z-10 bg-white/15 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-lg text-white">
            <h3 className="font-bold text-base leading-tight mb-2">
              {card.headline || "Headline"}
            </h3>
            <p className="text-xs text-white/90 leading-relaxed line-clamp-7">
              {card.body || "Card body text goes here..."}
            </p>
          </div>
        </>
      )}

      {/* Solid Split Variant */}
      {template.layoutVariant === "solid_color" && (
        <div className="flex flex-col h-full z-10">
          {/* Header Row */}
          <div className="flex justify-between items-center mb-4">
            <span
              className={`${isShown(card.badge).vis} px-3 py-1 bg-current/15 text-xs font-semibold rounded-full uppercase tracking-wider border border-current/20`}
            >
              {card.badge || "\u00A0"}
            </span>
            <span className="opacity-60 text-xs font-bold">{card.order} / 5</span>
          </div>

          {/* Headline & Body */}
          <div>
            <h3 className="font-extrabold text-xl leading-tight mb-4">
              {card.headline || "Core Tension"}
            </h3>
            <p
              className={`${
                isShown(card.media_url).bool ? "text-xs" : "text-sm"
              } opacity-90 leading-relaxed`}
            >
              {card.body || "Detailed context on the debate..."}
            </p>
          </div>

          {/* Corroboration Sources Links */}
          {card.sources && (
            <div className="space-y-1.5 mt-2">
              {card.sources.slice(0, 4).map((s, i) => (
                <div
                  key={i}
                  className="p-2 bg-current/10 border border-current/15 rounded-lg text-[11px] truncate"
                >
                  <span className="flex items-center font-semibold">
                    <LinkIcon className="w-3.5 h-3.5 mr-2 shrink-0 opacity-70" />
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Inline Media Slot */}
          {isShown(card.media_url).bool && (
            <div className="w-full h-36 bg-black/30 rounded-xl overflow-hidden relative border border-current/20 flex items-center justify-center mt-4 shrink-0">
              <Image
                src={card.media_url || "https://"}
                alt={card.entityMentioned || "Actor"}
                fill sizes="(max-width: 768px) 100vw, 400px"
                unoptimized
                className="object-cover"
                style={{
                  objectPosition: card.media_pos ? card.media_pos : "center",
                }}
              />
            </div>
          )}

          {/* Dynamic Footer */}
          {isShown(card.footer).bool && (
            <div className="border-t border-current/20 pt-4 mt-auto">
              <p className="text-xs opacity-70 italic">{card.footer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}