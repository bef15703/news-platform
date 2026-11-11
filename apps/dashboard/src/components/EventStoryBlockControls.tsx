"use client";

import React from "react";
import type { SDUIBlock } from "@news-platform/db";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Heading,
  AlignLeft,
  Image as ImageIcon,
  Quote,
  BarChart2,
  AlertTriangle,
} from "lucide-react";

interface EventStoryBlockControlsProps {
  blocks: SDUIBlock[];
  onChange: (blocks: SDUIBlock[]) => void;
}

export function EventStoryBlockControls({
  blocks,
  onChange,
}: EventStoryBlockControlsProps) {
  const addBlock = (type: SDUIBlock["type"]) => {
    const id = crypto.randomUUID();
    let newBlock: SDUIBlock;

    switch (type) {
      case "heading":
        newBlock = { id, type: "heading", text: "" };
        break;
      case "paragraph":
        newBlock = { id, type: "paragraph", text: "" };
        break;
      case "image":
        newBlock = { id, type: "image", url: "", caption: "", credit: "" };
        break;
      case "direct_quote_callout":
        newBlock = {
          id,
          type: "direct_quote_callout",
          speaker: "",
          role: "",
          quote: "",
          avatarUrl: "",
        };
        break;
      case "data_chart":
        newBlock = {
          id,
          type: "data_chart",
          chartType: "split_bar",
          title: "Public Vote Breakdown",
          primaryLabel: "In Favor",
          primaryValue: 50,
          secondaryLabel: "Opposed",
          secondaryValue: 50,
        };
        break;
      case "breaking_banner":
        newBlock = {
          id: crypto.randomUUID(),
          type: "breaking_banner",
          title: "Developing News",
          severity: "urgent",
          dismissible: true,
        };
        break;
      default:
        newBlock = { id, type: "paragraph", text: "" };
    }

    onChange([...blocks, newBlock]);
  };

  const updateBlock = (index: number, updated: SDUIBlock) => {
    const next = [...blocks];
    next[index] = updated;
    onChange(next);
  };

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-6">
      {/* Quick Block Insertion Toolbar */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Insert Story Block
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addBlock("heading")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 rounded-lg border border-slate-800 transition-colors"
          >
            <Heading className="w-3.5 h-3.5 text-blue-400" /> + Heading
          </button>
          <button
            type="button"
            onClick={() => addBlock("paragraph")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 rounded-lg border border-slate-800 transition-colors"
          >
            <AlignLeft className="w-3.5 h-3.5 text-slate-400" /> + Paragraph
          </button>
          <button
            type="button"
            onClick={() => addBlock("image")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 rounded-lg border border-slate-800 transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> + Photo
          </button>
          <button
            type="button"
            onClick={() => addBlock("direct_quote_callout")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 rounded-lg border border-slate-800 transition-colors"
          >
            <Quote className="w-3.5 h-3.5 text-amber-400" /> + Quote
          </button>
          <button
            type="button"
            onClick={() => addBlock("data_chart")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 rounded-lg border border-slate-800 transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5 text-purple-400" /> + Data Split
          </button>
          <button
            type="button"
            onClick={() => addBlock("breaking_banner")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 rounded-lg border border-slate-800 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> + Context
            Banner
          </button>
        </div>
      </div>

      {/* Block List Inspector */}
      <div className="space-y-4">
        {blocks.length === 0 ? (
          <div className="text-center p-6 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
            No story narrative blocks yet. Use the buttons above to build the
            article body.
          </div>
        ) : (
          blocks
            // 1. Guard against any null/undefined or malformed blocks from the database
            .filter((b): b is SDUIBlock =>
              Boolean(b && typeof b === "object" && "type" in b),
            )
            .map((block, index) => (
              <div
                // 2. Safe primitive key
                key={typeof block.id === "string" ? block.id : `block-${index}`}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3 relative group"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {/* 3. Safe fallback so it never crashes on replace */}
                    {block.type
                      ? block.type.replace(/_/g, " ")
                      : "Custom Widget"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveBlock(index, "up")}
                      disabled={index === 0}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 disabled:opacity-30"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(index, "down")}
                      disabled={index === blocks.length - 1}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 disabled:opacity-30"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(index)}
                      className="p-1 hover:bg-red-950/60 text-slate-500 hover:text-red-400 rounded transition-colors ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Dynamic Form per Block Type */}
                {block.type === "heading" && (
                  <div>
                    <input
                      type="text"
                      value={block.text}
                      placeholder="Section Heading..."
                      onChange={(e) =>
                        updateBlock(index, { ...block, text: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {block.type === "paragraph" && (
                  <div>
                    <textarea
                      rows={3}
                      value={block.text}
                      placeholder="Write substantive reporting paragraph..."
                      onChange={(e) =>
                        updateBlock(index, { ...block, text: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                    />
                  </div>
                )}

                {block.type === "image" && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={block.url}
                      placeholder="Image URL (https://...)"
                      onChange={(e) =>
                        updateBlock(index, { ...block, url: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={block.caption || ""}
                        placeholder="Caption text"
                        onChange={(e) =>
                          updateBlock(index, {
                            ...block,
                            caption: e.target.value,
                          })
                        }
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                      />
                      <input
                        type="text"
                        value={block.credit || ""}
                        placeholder="Photo Credit (e.g. AP / Getty)"
                        onChange={(e) =>
                          updateBlock(index, {
                            ...block,
                            credit: e.target.value,
                          })
                        }
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                      />
                    </div>
                  </div>
                )}

                {block.type === "direct_quote_callout" && (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={block.quote}
                      placeholder="Quoted statement..."
                      onChange={(e) =>
                        updateBlock(index, { ...block, quote: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm italic text-slate-200"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={block.speaker}
                        placeholder="Speaker Name"
                        onChange={(e) =>
                          updateBlock(index, {
                            ...block,
                            speaker: e.target.value,
                          })
                        }
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                      />
                      <input
                        type="text"
                        value={block.role || ""}
                        placeholder="Speaker Title / Role"
                        onChange={(e) =>
                          updateBlock(index, { ...block, role: e.target.value })
                        }
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                      />
                    </div>
                  </div>
                )}

                {block.type === "data_chart" && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={block.title}
                      placeholder="Chart Headline"
                      onChange={(e) =>
                        updateBlock(index, { ...block, title: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-semibold"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={block.primaryLabel}
                          placeholder="Label A"
                          onChange={(e) =>
                            updateBlock(index, {
                              ...block,
                              primaryLabel: e.target.value,
                            })
                          }
                          className="w-2/3 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs"
                        />
                        <input
                          type="number"
                          value={block.primaryValue}
                          onChange={(e) =>
                            updateBlock(index, {
                              ...block,
                              primaryValue: Number(e.target.value),
                            })
                          }
                          className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={block.secondaryLabel}
                          placeholder="Label B"
                          onChange={(e) =>
                            updateBlock(index, {
                              ...block,
                              secondaryLabel: e.target.value,
                            })
                          }
                          className="w-2/3 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs"
                        />
                        <input
                          type="number"
                          value={block.secondaryValue}
                          onChange={(e) =>
                            updateBlock(index, {
                              ...block,
                              secondaryValue: Number(e.target.value),
                            })
                          }
                          className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {block.type === "breaking_banner" && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={block.title || ""}
                      placeholder="Alert banner text..."
                      onChange={(e) =>
                        updateBlock(index, {
                          id: block.id,
                          type: "breaking_banner",
                          title: e.target.value,
                          severity: block.severity || "urgent",
                          dismissible: block.dismissible ?? true,
                        })
                      }
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <select
                      value={block.severity || "urgent"}
                      onChange={(e) =>
                        updateBlock(index, {
                          id: block.id,
                          type: "breaking_banner",
                          title: block.title || "",
                          severity: e.target.value as
                            | "urgent"
                            | "developing"
                            | "update",
                          dismissible: block.dismissible ?? true,
                        })
                      }
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="developing">Developing</option>
                      <option value="update">Update</option>
                    </select>
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
