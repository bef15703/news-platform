"use client";

import React from "react";
import { 
    EntityProfileBlock,
    TextCardBlock,
    StatStripBlock,
    BulletListBlock,
    FactSheetBlock,
    SocialLinksBlock,
    ImageCaptionBlock,
    SocialPlatform
} from "@news-platform/db";
import { Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";

interface Props {
  block: EntityProfileBlock;
  index: number;
  totalBlocks: number;
  onUpdate: (updatedBlock: EntityProfileBlock) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
}

// Text Card Editor
function TextCardEditor({ block, onUpdate }: { block: TextCardBlock; onUpdate: (b: TextCardBlock) => void;}) {
    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Header Title (Optional)</label>
                <input
                    type="text"
                    value={block.title || ""}
                    onChange={(e) => onUpdate({...block, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Body Content</label>
                <textarea 
                    rows={3}
                    value={block.body || ""}
                    onChange={(e) => onUpdate({...block, body: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
            </div>
        </div>
    );
}

// Stat Strip Editor
function StatStripEditor({ block, onUpdate }: { block: StatStripBlock; onUpdate: (b: StatStripBlock) => void;}) {
    return (
        <div className="grid grid-cols-12 gap-3">
            <div className="col-span-8 space-y-1">
                <label className="text-xs font-medium text-slate-400">Statistic / Indicator</label>
                <input 
                    type="text"
                    value={block.text || ""}
                    onChange={(e) => onUpdate({ ...block, text: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
            </div>
            <div className="col-span-4 space-y-1">
                <label className="text-xs font-medium text-slate-400">Subtext (Optional)</label>
                <input
                type="text"
                value={block.subtext || ""}
                onChange={(e) => onUpdate({ ...block, subtext: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
            </div>
        </div>
    );
}

// Bullet List Editor
function BulletListEditor({ block, onUpdate, }: { block: BulletListBlock; onUpdate: (b: BulletListBlock) => void; }) {
  const handleItemChange = (idx: number, val: string) => {
    const next = [...block.items];
    next[idx] = val;
    onUpdate({ ...block, items: next });
  };

  const addItem = () => {
    if (block.items.length >= 8) return;
    onUpdate({ ...block, items: [...block.items, "New item..."] });
  };

  const removeItem = (idx: number) => {
    if (block.items.length <= 1) return;
    onUpdate({ ...block, items: block.items.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-400">List Title</label>
        <input
          type="text"
          value={block.title || ""}
          onChange={(e) => onUpdate({ ...block, title: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">
            List Items ({block.items.length}/8)
          </span>
          {block.items.length < 8 && (
            <button
              type="button"
              onClick={addItem}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Item
            </button>
          )}
        </div>

        {block.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 w-4 text-right">{i + 1}.</span>
            <input
              type="text"
              value={item}
              onChange={(e) => handleItemChange(i, e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              disabled={block.items.length <= 1}
              onClick={() => removeItem(i)}
              className="text-slate-600 hover:text-red-400 p-1 disabled:opacity-20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Fact Sheet Editor
function FactSheetEditor({ block, onUpdate}: { block: FactSheetBlock; onUpdate: (b: FactSheetBlock) => void;}) {
  const handlePairChange = (idx: number, field: "label" | "value", val: string) => {
    const next = [...block.pairs];
    next[idx] = { ...next[idx], [field]: val };
    onUpdate({ ...block, pairs: next });
  };

  const addPair = () => {
    if (block.pairs.length >= 8) return;
    onUpdate({
      ...block,
      pairs: [...block.pairs, { label: "Label", value: "Value" }],
    });
  };

  const removePair = (idx: number) => {
    if (block.pairs.length <= 1) return;
    onUpdate({ ...block, pairs: block.pairs.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-400">Section Header (Optional)</label>
        <input
          type="text"
          value={block.title || ""}
          onChange={(e) => onUpdate({ ...block, title: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">
            Field Pairs ({block.pairs.length}/8)
          </span>
          {block.pairs.length < 8 && (
            <button
              type="button"
              onClick={addPair}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Pair
            </button>
          )}
        </div>

        {block.pairs.map((pair, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4">
              <input
                type="text"
                value={pair.label}
                onChange={(e) => handlePairChange(i, "label", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="col-span-7">
              <input
                type="text"
                value={pair.value}
                onChange={(e) => handlePairChange(i, "value", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="col-span-1 flex justify-end">
              <button
                type="button"
                disabled={block.pairs.length <= 1}
                onClick={() => removePair(i)}
                className="text-slate-600 hover:text-red-400 p-1 disabled:opacity-20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Social Links Update
function SocialLinksEditor({ block, onUpdate, }: { block: SocialLinksBlock; onUpdate: (b: SocialLinksBlock) => void; }) {
  const handleLinkChange = (idx: number, field: "platform" | "url", val: string) => {
    const next = [...block.links];
    next[idx] = { ...next[idx], [field]: val } as { platform: SocialPlatform; url: string };
    onUpdate({ ...block, links: next });
  };

  const addLink = () => {
    if (block.links.length >= 6) return;
    onUpdate({
      ...block,
      links: [...block.links, { platform: "website", url: "" }],
    });
  };

  const removeLink = (idx: number) => {
    if (block.links.length <= 1) return;
    onUpdate({ ...block, links: block.links.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-400">Header Title (Optional)</label>
        <input
          type="text"
          value={block.title || ""}
          onChange={(e) => onUpdate({ ...block, title: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">
            Channels ({block.links.length}/6)
          </span>
          {block.links.length < 6 && (
            <button
              type="button"
              onClick={addLink}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Link
            </button>
          )}
        </div>

        {block.links.map((link, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4">
              <select
                value={link.platform}
                onChange={(e) => handleLinkChange(i, "platform", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="x">X / Twitter</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="threads">Threads</option>
                <option value="bluesky">Bluesky</option>
                <option value="tiktok">Tiktok</option>
                <option value="snapchat">Snapchat</option>
                <option value="website">Website</option>
              </select>
            </div>
            <div className="col-span-7">
              <input
                type="text"
                value={link.url}
                placeholder="https://..."
                onChange={(e) => handleLinkChange(i, "url", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="col-span-1 flex justify-end">
              <button
                type="button"
                disabled={block.links.length <= 1}
                onClick={() => removeLink(i)}
                className="text-slate-600 hover:text-red-400 p-1 disabled:opacity-20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Image with Caption Editor
function ImageCaptionEditor({ block, onUpdate, }: { block: ImageCaptionBlock; onUpdate: (b: ImageCaptionBlock) => void; }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-400">Image URL</label>
        <input
          type="text"
          value={block.imageUrl}
          placeholder="https://..."
          onChange={(e) => onUpdate({ ...block, imageUrl: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-400">Caption / Note</label>
        <input
          type="text"
          value={block.caption || ""}
          onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}

// Block Type Labels
const BLOCK_TITLES: Record<EntityProfileBlock["type"], string> = {
  text_card: "Text Card",
  stat_strip: "Stat Strip",
  bullet_list: "Bullet List",
  fact_sheet: "Fact Sheet",
  social_links: "Social Links",
  image_caption: "Image",
};

// Root Component
export function EntityBlockControls({
  block,
  index,
  totalBlocks,
  onUpdate,
  onRemove,
  onMove,
}: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      {/* Block Header Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/40">
            {BLOCK_TITLES[block.type]}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            Block #{index + 1}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove("up")}
            title="Move Up"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === totalBlocks - 1}
            onClick={() => onMove("down")}
            title="Move Down"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Delete Block"
            className="p-1 rounded hover:bg-red-950/60 text-slate-500 hover:text-red-400 ml-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dispatch to individual block editor */}
      {block.type === "text_card" && (
        <TextCardEditor block={block} onUpdate={onUpdate} />
      )}
      {block.type === "stat_strip" && (
        <StatStripEditor block={block} onUpdate={onUpdate} />
      )}
      {block.type === "bullet_list" && (
        <BulletListEditor block={block} onUpdate={onUpdate} />
      )}
      {block.type === "fact_sheet" && (
        <FactSheetEditor block={block} onUpdate={onUpdate} />
      )}
      {block.type === "social_links" && (
        <SocialLinksEditor block={block} onUpdate={onUpdate} />
      )}
      {block.type === "image_caption" && (
        <ImageCaptionEditor block={block} onUpdate={onUpdate} />
      )}
    </div>
  );
}