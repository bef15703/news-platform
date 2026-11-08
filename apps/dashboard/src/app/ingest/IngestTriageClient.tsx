"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { IngestCluster, deleteCluster } from "./actions";
import {
  Radio,
  Clock,
  Layers,
  Trash2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function IngestTriageClient({
  initialClusters,
}: {
  initialClusters: IngestCluster[];
}) {
  const [clusters, setClusters] = useState<IngestCluster[]>(initialClusters);
  const [expandedId, setExpandedId] = useState<string | null>(
    initialClusters[0]?.event_id || null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = async (eventId: string, title: string) => {
    const confirmed = confirm(
      `Delete cluster: "${title}"?\n\nThis will remove all linked raw articles and prune any entities not referenced by other events.`
    );
    if (!confirmed) return;

    setDeletingId(eventId);
    startTransition(async () => {
      await deleteCluster(eventId);
      setClusters((prev) => prev.filter((c) => c.event_id !== eventId));
      setDeletingId(null);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/40 font-bold flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-blue-400 animate-pulse" />
            INGEST QUEUE
          </span>
          <h1 className="text-sm font-bold text-white tracking-wide">
            Wire Clusters
          </h1>
          <span className="text-xs text-slate-500 font-mono">
            ({clusters.length} pending draft clusters)
          </span>
        </div>

        {isPending && (
          <div className="flex items-center gap-1.5 text-xs text-blue-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Updating queue...</span>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-8 space-y-4">
        {clusters.length === 0 ? (
          <div className="p-16 border border-dashed border-slate-800 rounded-2xl text-center space-y-3 bg-slate-900/20">
            <Layers className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">
              No Pending Clusters
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All ingested articles have been published or discarded. Run your
              poller and clusterer worker to ingest new wire feeds.
            </p>
          </div>
        ) : (
          clusters.map((cluster, index) => {
            const isExpanded = expandedId === cluster.event_id;
            const isDeleting = deletingId === cluster.event_id;

            return (
              <div
                key={cluster.event_id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden transition-all shadow-md"
              >
                {/* Cluster Header / Row Summary */}
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Priority Rank (#1 is highest volume) */}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        #{index + 1}
                      </span>

                      {/* Coverage Pill */}
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60 font-mono">
                        {cluster.article_count}{" "}
                        {cluster.article_count === 1 ? "article" : "articles"}
                      </span>

                      {/* Synthesis State */}
                      {cluster.is_synthesized ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-semibold">
                          Deck Ready
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-medium">
                          Raw Wire
                        </span>
                      )}

                      {/* Source Name Chips */}
                      {cluster.sources.map((src) => (
                        <span
                          key={src}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-medium"
                        >
                          {src}
                        </span>
                      ))}

                      {/* Freshness Timestamp */}
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono ml-auto">
                        <Clock className="w-3 h-3" />
                        {new Date(cluster.latest_published_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Headline */}
                    <h2
                      onClick={() => toggleExpand(cluster.event_id)}
                      className="text-base font-bold text-white hover:text-blue-400 transition-colors cursor-pointer leading-snug line-clamp-2"
                    >
                      {cluster.title}
                    </h2>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <Link
                      href={`/events/${cluster.event_id}`}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Open Studio
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </Link>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(cluster.event_id, cluster.title)}
                      title="Discard Cluster & Prune Entities"
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors disabled:opacity-40"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpand(cluster.event_id)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Raw Wire Drawer */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-950/60 p-5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      Ingested Wire Coverage ({cluster.articles.length})
                    </h3>

                    <div className="space-y-2">
                      {cluster.articles.map((art) => (
                        <div
                          key={art.id}
                          className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 transition-colors flex items-start justify-between gap-4"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                                {art.source_name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(art.published_at).toLocaleString()}
                              </span>
                            </div>
                            <h4 className="text-xs font-semibold text-slate-200 leading-snug">
                              {art.title}
                            </h4>
                            {art.summary_raw && (
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                {art.summary_raw}
                              </p>
                            )}
                          </div>

                          {/* Direct External URL to original reporting */}
                          <a
                            href={art.canonical_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-slate-950 hover:bg-blue-600 border border-slate-800 hover:border-blue-500 text-slate-400 hover:text-white rounded-lg transition-all shrink-0 flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <span>Read</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}