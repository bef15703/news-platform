"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

interface EventEditorHeaderProps {
  eventId: string;
  status: string;
  isSaving: boolean;
  saveSuccess: boolean;
  onSave: (overrideStatus?: string) => void;
}

export function EventEditorHeader({
  eventId,
  status,
  isSaving,
  saveSuccess,
  onSave,
}: EventEditorHeaderProps) {
  const backHref = status === "draft" ? "/ingest" : "/";

  return (
    <header className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Link
          href={backHref}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
          {eventId.slice(0, 8)}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              status === "published"
                ? "bg-emerald-400"
                : status === "in_review"
                ? "bg-amber-400"
                : "bg-slate-400"
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {saveSuccess && (
          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Saved
          </span>
        )}

        <button
          onClick={() => onSave()}
          disabled={isSaving}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
        >
          Save Draft
        </button>

        <button
          onClick={() =>
            onSave(status === "published" ? "in_review" : "published")
          }
          disabled={isSaving}
          className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
            status === "published"
              ? "bg-amber-600 hover:bg-amber-500 text-white"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
          }`}
        >
          {status === "published" ? "Unpublish to Review" : "Publish to App"}
        </button>
      </div>
    </header>
  );
}