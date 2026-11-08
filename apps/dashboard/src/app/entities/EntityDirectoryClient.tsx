"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { EntityListItem, getEntitiesList } from "./actions";
import { EntityCategory } from "@news-platform/db";
import {
  Search,
  AlertTriangle,
  Layers,
  ArrowRight,
  User,
  Building2,
  Landmark,
  MapPin,
  Briefcase,
  Hash,
} from "lucide-react";

const CATEGORIES: Array<{ id: string; label: string; icon: any }> = [
  { id: "all", label: "All Entities", icon: Layers },
  { id: "person", label: "People", icon: User },
  { id: "govt_branch", label: "Govt Branches", icon: Landmark },
  { id: "govt_agency", label: "Agencies", icon: Building2 },
  { id: "private_company", label: "Companies", icon: Briefcase },
  { id: "location", label: "Locations", icon: MapPin },
  { id: "topic", label: "Topics", icon: Hash },
];

export default function EntityDirectoryClient({
  initialEntities,
}: {
  initialEntities: EntityListItem[];
}) {
  const [entities, setEntities] = useState<EntityListItem[]>(initialEntities);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (newCategory: string, newSearch: string) => {
    startTransition(async () => {
      const results = await getEntitiesList({
        category: newCategory,
        search: newSearch,
      });
      setEntities(results);
    });
  };

  const onSearchChange = (val: string) => {
    setSearch(val);
    handleFilterChange(activeCategory, val);
  };

  const onCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    handleFilterChange(catId, search);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/40 font-bold">
            REGISTRY
          </span>
          <h1 className="text-sm font-bold text-white tracking-wide">
            Entities
          </h1>
          <span className="text-xs text-slate-500 font-mono">
            ({entities.length} loaded)
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 space-y-6">
        {/* Controls Bar: Search & Category Pills */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search entities by name, slug, or title/role..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryClick(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {entities.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-400">
                No entities found
              </p>
              <p className="text-xs text-slate-600">
                Try loosening your search term or selecting "All Entities".
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Entity</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Dossier Health</th>
                    <th className="py-3 px-4 font-semibold text-center">
                      Blocks
                    </th>
                    <th className="py-3 px-4 font-semibold text-center">
                      Stories
                    </th>
                    <th className="py-3 px-4 font-semibold text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {entities.map((item) => {
                    const hasAvatar = Boolean(item.avatar_url);
                    const hasBlocks = item.profile_blocks_count > 0;
                    const badgeText = item.metadata?.badge_text;
                    const badgeBg = item.metadata?.badge_bg_color || "#1e293b";
                    const badgeFont =
                      item.metadata?.badge_font_color || "#ffffff";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Avatar & Identification */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                              {item.avatar_url ? (
                                <img
                                  src={item.avatar_url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-slate-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/entities/${item.id}`}
                                  className="font-bold text-slate-200 hover:text-blue-400 transition-colors truncate text-sm"
                                >
                                  {item.name}
                                </Link>
                                {badgeText && (
                                  <span
                                    className="px-2 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono shrink-0"
                                    style={{
                                      backgroundColor: badgeBg,
                                      color: badgeFont,
                                    }}
                                  >
                                    {badgeText}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {item.title_role || `/${item.slug}`}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[11px] text-slate-400 capitalize">
                            {item.category.replace("_", " ")}
                          </span>
                        </td>

                        {/* Audit Health Badges */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.context_banner_active && (
                              <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60 font-semibold text-[10px] flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Banner
                                Active
                              </span>
                            )}
                            {!hasAvatar && (
                              <span className="px-2 py-0.5 rounded bg-amber-950/50 text-amber-400 border border-amber-800/40 text-[10px]">
                                No Portrait
                              </span>
                            )}
                            {!hasBlocks && (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 text-[10px]">
                                Unpopulated
                              </span>
                            )}
                            {hasAvatar &&
                              hasBlocks &&
                              !item.context_banner_active && (
                                <span className="text-[11px] text-emerald-400 font-medium">
                                  Ready
                                </span>
                              )}
                          </div>
                        </td>

                        {/* Blocks Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono text-slate-300 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[11px]">
                            {item.profile_blocks_count}
                          </span>
                        </td>

                        {/* Linked Stories Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono text-slate-400">
                            {item.linked_events_count}
                          </span>
                        </td>

                        {/* Edit Action Button */}
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/entities/${item.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white font-semibold transition-all group-hover:border-transparent"
                          >
                            <span>Edit</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
