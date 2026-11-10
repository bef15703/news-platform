"use client";

import React, { useState } from "react";
import {
  updateEntity,
  findWikipediaCandidates,
  applyWikipediaSelection,
  type getEntityForEditor,
} from "./actions";
import {
  ArrowLeft,
  Check,
  AlertTriangle,
  Info,
  AlertOctagon,
  Plus,
  Loader2,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { EntityBlockPreview } from "@/components/EntityBlockPreview";
import { EntityProfileBlock, EntityCategory, BannerSeverity } from "@news-platform/db";
import { EntityBlockControls } from "@/components/EntityBlockControls";
import { createDefaultBlock } from "@/lib/entityBlocks";
import { WikipediaCandidate } from "@/lib/wikipedia";

export default function EntityEditorClient({
  initialData,
  entityId,
}: {
  initialData: NonNullable<Awaited<ReturnType<typeof getEntityForEditor>>>;
  entityId: string;
}) {
  const [name, setName] = useState(initialData.entity.name || "");
  const [titleRole, setTitleRole] = useState(
    initialData.entity.title_role || "",
  );
  const [category, setCategory] = useState<EntityCategory>(
    (initialData.entity.category as EntityCategory) || "person",
  );
  const metadata = (initialData.entity.metadata || {}) as Record<string, unknown>;
  const [badgeText, setBadgeText] = useState(
    typeof metadata.badge_text === "string" ? metadata.badge_text : "",
  );
  const [badgeBgColor, setBadgeBgColor] = useState(
    typeof metadata.badge_bg_color === "string" ? metadata.badge_bg_color : "#083A90",
  );
  const [badgeFontColor, setBadgeFontColor] = useState(
    typeof metadata.badge_font_color === "string" ? metadata.badge_font_color : "#FFFFFF",
  );
  const [avatarUrl, setAvatarUrl] = useState(
    initialData.entity.avatar_url || "",
  );
  const [avatarPos, setAvatarPos] = useState(
    initialData.entity.avatar_pos || "center",
  );
  const [profileBlocks, setProfileBlocks] = useState<EntityProfileBlock[]>(
    initialData.entity.profile_blocks || [],
  );

  // Context Banner State
  const [bannerActive, setBannerActive] = useState(
    Boolean(initialData.entity.context_banner_active),
  );
  const [bannerSeverity, setBannerSeverity] = useState<BannerSeverity>(
    (initialData.entity.context_banner_severity as BannerSeverity) || "warning",
  );
  const [bannerTitle, setBannerTitle] = useState(
    initialData.entity.context_banner_title || "",
  );
  const [bannerBody, setBannerBody] = useState(
    initialData.entity.context_banner_body || "",
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    await updateEntity(entityId, {
      name,
      title_role: titleRole,
      category,
      avatar_url: avatarUrl || null,
      avatar_pos: avatarPos,
      context_banner_active: bannerActive,
      context_banner_severity: bannerSeverity,
      context_banner_title: bannerTitle,
      context_banner_body: bannerBody,
      profile_blocks: profileBlocks,
      metadata: {
        ...((initialData.entity.metadata || {}) as Record<string, unknown>),
        badge_text: badgeText.trim(),
        badge_font_color: badgeFontColor,
        badge_bg_color: badgeBgColor,
      },
    });

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleAddBlock = (type: EntityProfileBlock["type"]) => {
    const newBlock = createDefaultBlock(type);
    setProfileBlocks([...profileBlocks, newBlock]);
  };

  const handleUpdateBlock = (idx: number, updated: EntityProfileBlock) => {
    const next = [...profileBlocks];
    next[idx] = updated;
    setProfileBlocks(next);
  };

  const handleRemoveBlock = (idx: number) => {
    setProfileBlocks(profileBlocks.filter((_, i) => i !== idx));
  };

  const handleMoveBlock = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= profileBlocks.length) return;

    const next = [...profileBlocks];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    setProfileBlocks(next);
  };

  // Severity color styles for the mobile preview
  const severityStyles: Record<
    string,
    { bg: string; border: string; text: string; icon: LucideIcon }
  > = {
    warning: {
      bg: "bg-amber-100",
      border: "border-amber-300",
      text: "text-amber-950",
      icon: AlertTriangle,
    },
    info: {
      bg: "bg-blue-100",
      border: "border-blue-300",
      text: "text-blue-950",
      icon: Info,
    },
    critical: {
      bg: "bg-red-100",
      border: "border-red-300",
      text: "text-red-950",
      icon: AlertOctagon,
    },
  };

  const activeSeverity =
    severityStyles[bannerSeverity] || severityStyles.warning;
  const SeverityIcon = activeSeverity.icon;

  // Wikipedia autofill logic
  const [isSearchingCandidates, setIsSearchingCandidates] = useState(false);
  const [candidates, setCandidates] = useState<WikipediaCandidate[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [autofillMessage, setAutofillMessage] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);

  // Triggered by clicking "Autofill Details"
  const handleStartAutofill = async () => {
    if (!name.trim()) return;
    setIsSearchingCandidates(true);
    setAutofillMessage(null);

    const res = await findWikipediaCandidates({ name, titleRole, category });

    if (res.success && res.candidates && res.candidates.length > 0) {
      setCandidates(res.candidates);
      setShowPicker(true);
    } else {
      setAutofillMessage({
        text: "No matches found on Wikipedia.",
        error: true,
      });
    }

    setIsSearchingCandidates(false);
  };

  // Triggered when clicking one of the 5 options
  const handleSelectCandidate = async (candidateTitle: string) => {
    setIsApplying(true);
    const res = await applyWikipediaSelection(candidateTitle);

    if (res.success && res.data) {
      if (!avatarUrl && res.data.avatarUrl) setAvatarUrl(res.data.avatarUrl);
      if (!titleRole && res.data.titleRole) setTitleRole(res.data.titleRole);

      setProfileBlocks((prev) => {
        const hasOverview = prev.some(
          (b) =>
            b.type === "text_card" && b.title?.toLowerCase() === "overview",
        );
        return hasOverview ? prev : [...res.data.profileBlocks, ...prev];
      });

      setShowPicker(false);
      setAutofillMessage({ text: `Applied: "${res.data.resolvedTitle}"` });
      setTimeout(() => setAutofillMessage(null), 4000);
    } else {
      setAutofillMessage({
        text: res.error || "Failed to apply article.",
        error: true,
      });
    }

    setIsApplying(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/entities"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {entityId.slice(0, 8)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Entity Page
          </span>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-blue-500/20"
          >
            Save Changes
          </button>
        </div>
      </header>

      {/* Split Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Mobile Viewport Emulator */}
        <div className="w-[480px] border-r border-slate-800/80 bg-slate-900/20 flex flex-col items-center justify-start py-8 px-6 overflow-y-auto">
          <div className="text-xs font-medium text-slate-400 mb-4 uppercase tracking-wider">
            Mobile Entity Profile Preview
          </div>

          {/* Phone Shell */}
          <div className="w-[320px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
            {/* Hero Image Container */}
            <div className="relative w-full aspect-[4/5] bg-slate-950 overflow-hidden shrink-0">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name}
                  sizes="320px"
                  unoptimized
                  className="object-cover"
                  style={{ objectPosition: avatarPos }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                  <span className="text-xs">No portrait assigned</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

              {/* Identity Row with Badge */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black text-white leading-tight">
                    {name || "Entity Name"}
                  </h2>
                  <p className="text-xs font-medium text-slate-300 mt-0.5">
                    {titleRole || "Official Role / Title"}
                  </p>
                </div>

                {/* Optional Affiliation Pill (e.g. R-LA) */}
                {badgeText && (
                  <span
                    className="px-3 py-1 text-white font-bold text-xs rounded-full shadow-lg tracking-wider shrink-0 uppercase"
                    style={{
                      color: badgeFontColor,
                      backgroundColor: badgeBgColor,
                    }}
                  >
                    {badgeText}
                  </span>
                )}
              </div>
            </div>

            {/* Mobile Phone Shell Body */}
            <div className="p-4 space-y-4">
              {/* Context Warning Banner */}
              {bannerActive && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 shadow-sm ${activeSeverity.bg} ${activeSeverity.border} ${activeSeverity.text}`}
                >
                  <SeverityIcon className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold leading-snug">
                      {bannerTitle || "Context Header"}
                    </h4>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {bannerBody || "Add explanatory background context..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Modular Profile Blocks (Section 2 & Section 3) */}
              {profileBlocks.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-slate-600 text-xs">
                  No modular blocks added yet.
                </div>
              ) : (
                profileBlocks.map((block) => (
                  <EntityBlockPreview key={block.id} block={block} />
                ))
              )}

              {/* Feed Preview (Section 4: Automated Linked Stories) */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Linked Stories ({initialData.linkedEvents.length})
                </div>
                {initialData.linkedEvents.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    No events linked yet.
                  </p>
                ) : (
                  initialData.linkedEvents.slice(0, 3).map((ev: { id: string; title: string; status: string }) => (
                    <div
                      key={ev.id}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1"
                    >
                      <span className="font-semibold text-slate-200 line-clamp-1">
                        {ev.title}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">
                        {ev.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editorial Controls */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-3xl">
          {/* Identity Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            {/* 1-Click Autofill Button in Identity Box Header */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStartAutofill}
                disabled={isSearchingCandidates || !name.trim()}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-blue-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-30"
              >
                {isSearchingCandidates && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Autofill Details
              </button>
              {autofillMessage && (
                <span
                  className={`text-xs ${
                    autofillMessage.error ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {autofillMessage.text}
                </span>
              )}
            </div>

            {/* Disambiguation Modal */}
            {showPicker && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                  {/* Modal Header */}
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        Select Matching Wikipedia Entry
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Top results matching{" "}
                        <span className="text-blue-300 font-mono">
                          &quot;{name}&quot;
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPicker(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Candidates List */}
                  <div className="p-4 overflow-y-auto space-y-2.5">
                    {candidates.map((c) => (
                      <button
                        key={c.pageid}
                        type="button"
                        disabled={isApplying}
                        onClick={() => handleSelectCandidate(c.title)}
                        className="w-full text-left p-3.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-blue-950/30 hover:border-blue-700/60 transition-all group disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-blue-300">
                            {c.title}
                          </span>
                          <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 font-semibold transition-opacity">
                            Select →
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {c.snippet}...
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-right">
                    <button
                      type="button"
                      onClick={() => setShowPicker(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EntityCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="person">Person</option>
                  <option value="govt_branch">Government Branch</option>
                  <option value="govt_agency">Government Agency</option>
                  <option value="location">Location</option>
                  <option value="private_company">Private Company</option>
                  <option value="topic">Topic</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                Official Title / Subtitle
              </label>
              <input
                type="text"
                placeholder="e.g. U.S. Attorney General"
                value={titleRole}
                onChange={(e) => setTitleRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                Badge
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={badgeBgColor}
                  onChange={(e) => setBadgeBgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-800 bg-transparent cursor-pointer shrink-0 p-0.5"
                />
                <input
                  type="color"
                  value={badgeFontColor}
                  onChange={(e) => setBadgeFontColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-800 bg-transparent cursor-pointer shrink-0 p-0.5"
                />
                <input
                  type="text"
                  placeholder="D-VA"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                Portrait Image URL
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Crop Alignment Selector */}
            <div className="flex gap-1">
              {[
                { id: "top", label: "Top (0%)", val: "top center" },
                { id: "20%", label: "High (20%)", val: "center 20%" },
                { id: "center", label: "Mid (50%)", val: "center center" },
                { id: "bottom", label: "Low (80%)", val: "center 80%" },
              ].map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setAvatarPos(pos.val)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors ${
                    avatarPos === pos.val
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Context Warning Banner Controls */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Context Warning Banner
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Displays a prominent alert banner at the top of the entity
                  page on iOS.
                </p>
              </div>

              {/* Active Toggle Switch */}
              <button
                type="button"
                onClick={() => setBannerActive(!bannerActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  bannerActive ? "bg-blue-600" : "bg-slate-800"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    bannerActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {bannerActive && (
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">
                    Banner Severity
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: "warning", label: "Warning (Yellow)" },
                      { id: "info", label: "Info (Blue)" },
                      { id: "critical", label: "Critical (Red)" },
                    ] as const).map((sev) => (
                      <button
                        key={sev.id}
                        type="button"
                        onClick={() => setBannerSeverity(sev.id)}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                          bannerSeverity === sev.id
                            ? "bg-slate-800 border-blue-500 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {sev.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">
                    Banner Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Under Active Federal Inquiry"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">
                    Banner Body Context
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide 1-2 factual sentences detailing the context..."
                    value={bannerBody}
                    onChange={(e) => setBannerBody(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>
          {/* Living Dossier Blocks Header & Picker */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                Information Blocks
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add modular cards to build the scannable profile layout.
              </p>
            </div>

            {/* Quick Add Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {([
                { type: "text_card", label: "Text Card" },
                { type: "stat_strip", label: "Stat Strip" },
                { type: "bullet_list", label: "Bullet List" },
                { type: "fact_sheet", label: "Fact Sheet" },
                { type: "social_links", label: "Socials" },
                { type: "image_caption", label: "Image" },
              ] as const).map((b) => (
                <button
                  key={b.type}
                  type="button"
                  onClick={() => handleAddBlock(b.type)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-200 border border-slate-700/80 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3 text-blue-400" /> {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Block List */}
          {profileBlocks.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center space-y-2">
              <p className="text-xs text-slate-500">
                No profile blocks added yet.
              </p>
              <p className="text-[11px] text-slate-600">
                Add a metric strip for key stats (district, party, market cap)
                or a takeaway list for core background points.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {profileBlocks.map((blk, idx) => (
                <EntityBlockControls
                  key={blk.id}
                  block={blk}
                  index={idx}
                  totalBlocks={profileBlocks.length}
                  onUpdate={(updated) => handleUpdateBlock(idx, updated)}
                  onRemove={() => handleRemoveBlock(idx)}
                  onMove={(dir) => handleMoveBlock(idx, dir)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
