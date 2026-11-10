"use client";

import React from "react";
import { 
    EntityProfileBlock,
    TextCardBlock,
    BulletListBlock,
    StatStripBlock,
    FactSheetBlock,
    SocialLinksBlock,
    ImageCaptionBlock,
} from "@news-platform/db";
import Image from "next/image";
import { SocialIcon } from "./SocialIcon";

// Text Card Block
function TextCardView({ block }: { block: TextCardBlock }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-1.5 text-left">
            {block.title && (
                <h4 className="text-xs font-bold text-slate-200">{block.title}</h4>
            )}
            <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">
                {block.body || "No text provided..."}
            </p>
        </div>
    );
}

// Stat Strip Block
function StatStripView({ block }: { block: StatStripBlock }) {
    return (
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl px-4 py-2.5 flex items-center justify-center text-center shadow-sm">
            <span className="text-xs font-bold text-slate-100 tracking-wide">
                {block.text || "Statistic / Indicator"}
            </span>
            {block.subtext && (
                <span className="text-[10px] text-slate-400 ml-2 font-normal">
                    ({block.subtext})
                </span>
            )}
        </div>
    );
}

// Bullet List Block
function BulletListView({ block }: { block: BulletListBlock }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-left shadow-sm">
            <h4 className="text-xs font-bold text-slate-200">{block.title}</h4>
            <ul className="space-y-1.5">
                {block.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-300 leading-snug">
                            {item}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Fact Sheet Block
function FactSheetView({ block }: { block: FactSheetBlock }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-left shadow-sm">
            {block.title && (
                <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {block.title}
                </h4>
            )}
            <div className="space-y-1.5">
                {block.pairs.map((pair, idx) => (
                    <div key={idx} className="text-xs leading-snug flex justify-between">
                        <span className="text-slate-400 font-medium">{pair.label} </span>
                        <span className="text-slate-100 font-bold">{pair.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Social Links Block
function SocialLinksView({ block }: { block: SocialLinksBlock }) {
    return (
        <div className="space-y-2 text-left">
            {block.title && (
                <h4 className="pb-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {block.title}
                </h4>
            )}
            <div className="flex items-center gap-2.5 flex-wrap">
                {block.links.map((link, idx) => (
                    <a
                        key={idx}
                        href={link.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        title={link.platform.toUpperCase()}
                        className="w-10 h-10 rounded-full bg-black hover:bg-neutral-800 text-white flex items-center justify-center transition-transform hover:scale-105 shadow-md shrink-0"
                    >
                        <SocialIcon platform={link.platform} className="w-4 h-4 fill-current" />
                    </a>
                ))}
            </div>
        </div>
    );
}

// Image with caption subcomponent
function ImageCaptionView({ block }: { block: ImageCaptionBlock }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm text-left">
      {block.imageUrl ? (
        <Image
          src={block.imageUrl}
          alt={block.altText || "Entity graphic"}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          unoptimized
          className="object-cover"
        />
      ) : (
        <div className="w-full h-32 bg-slate-950 flex items-center justify-center text-slate-600 text-xs">
          No image URL provided
        </div>
      )}
      {block.caption && (
        <div className="p-2.5 bg-slate-950/40 border-t border-slate-800/80">
          <p className="text-[10px] text-slate-400 italic leading-relaxed">
            {block.caption}
          </p>
        </div>
      )}
    </div>
  );
}

// Root Dispatcher
export function EntityBlockPreview({ block }: { block: EntityProfileBlock }) {
  switch (block.type) {
    case "text_card":
      return <TextCardView block={block} />;
    case "stat_strip":
      return <StatStripView block={block} />;
    case "bullet_list":
      return <BulletListView block={block} />;
    case "fact_sheet":
      return <FactSheetView block={block} />;
    case "social_links":
      return <SocialLinksView block={block} />;
    case "image_caption":
      return <ImageCaptionView block={block} />;
    default:
      return null;
  }
}