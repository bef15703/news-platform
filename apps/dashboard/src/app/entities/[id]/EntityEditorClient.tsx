"use client";

import React, { useState } from "react";
import { updateEntity } from "./actions";
import { ArrowLeft, Check, AlertTriangle, Info, AlertOctagon, Sparkles, Puzzle } from "lucide-react";
import Link from "next/link";

export default function EntityEditorClient({
  initialData,
  entityId,
}: {
  initialData: any;
  entityId: string;
}) {
  const [name, setName] = useState(initialData.entity.name || "");
  const [titleRole, setTitleRole] = useState(initialData.entity.title_role || "");
  const [category, setCategory] = useState(initialData.entity.category || "person");
  const [avatarUrl, setAvatarUrl] = useState(initialData.entity.avatar_url || "");
  const [avatarPos, setAvatarPos] = useState(initialData.entity.avatar_pos || "center");

  // Context Banner State
  const [bannerActive, setBannerActive] = useState(
    Boolean(initialData.entity.context_banner_active)
  );
  const [bannerSeverity, setBannerSeverity] = useState(
    initialData.entity.context_banner_severity || "warning"
  );
  const [bannerTitle, setBannerTitle] = useState(
    initialData.entity.context_banner_title || ""
  );
  const [bannerBody, setBannerBody] = useState(
    initialData.entity.context_banner_body || ""
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
    });

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Severity color styles for the mobile preview
  const severityStyles: Record<string, { bg: string; border: string; text: string; icon: any }> = {
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
    context: {
      bg: "bg-green-100",
      border: "border-green-300",
      text: "text-green-950",
      icon: Puzzle,
    },
  };

  const activeSeverity = severityStyles[bannerSeverity] || severityStyles.warning;
  const SeverityIcon = activeSeverity.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {entityId.slice(0, 8)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Entity Dossier
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
            {/* Header Hero Portrait */}
            <div className="relative w-full h-61 bg-slate-950 overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: avatarPos }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                  <span className="text-xs">No portrait assigned</span>
                </div>
              )}
              {/* Gradient Overlay for Name Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-lg font-black text-white leading-tight">
                  {name || "Entity Name"}
                </h2>
                <p className="text-xs font-medium text-slate-300 mt-0.5">
                  {titleRole || "Official Role / Title"}
                </p>
              </div>
            </div>

            {/* Entity Content Feed Body */}
            <div className="p-4 space-y-4">
              {/* Context Warning Banner (matching iOS Mockup) */}
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

              {/* Feed Preview Teasers */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Linked Stories ({initialData.linkedEvents.length})
                </div>
                {initialData.linkedEvents.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No events linked yet.</p>
                ) : (
                  initialData.linkedEvents.slice(0, 3).map((ev: any) => (
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Identity & Role
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
              <label className="text-xs font-medium text-slate-400">Portrait Image URL</label>
              <input
                type="text"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Quick 1-Click Crop Controls */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-400">Portrait Crop Alignment</label>
                <div className="flex gap-1">
                  {["top", "center", "bottom"].map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setAvatarPos(pos)}
                      className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded border transition-colors ${
                        avatarPos === pos
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
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
                  Displays a prominent alert banner at the top of the entity page on iOS.
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
                  <label className="text-xs font-medium text-slate-400">Banner Severity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "warning", label: "Warning (Yellow)" },
                      { id: "info", label: "Info (Blue)" },
                      { id: "critical", label: "Critical (Red)" },
                      { id: "context", label: "Context (Green)" },
                    ].map((sev) => (
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
                  <label className="text-xs font-medium text-slate-400">Banner Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Under Active Federal Inquiry"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Banner Body Context</label>
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
        </div>
      </div>
    </div>
  );
}