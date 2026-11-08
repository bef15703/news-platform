"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  IngestCluster,
  deleteCluster,
  deleteMultipleClusters,
} from "./actions";
import {
  triggerIngestPipeline,
  triggerClusterSynthesis,
} from "./pipeline-actions";
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
  RefreshCw,
  CheckSquare,
  Square,
  AlertTriangle,
} from "lucide-react";

export default function IngestTriageClient({
  initialClusters,
}: {
  initialClusters: IngestCluster[];
}) {
  const [clusters, setClusters] = useState<IngestCluster[]>(initialClusters);
  const [expandedId, setExpandedId] = useState<string | null>(
    initialClusters[0]?.event_id || null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [isPolling, setIsPolling] = useState(false);
  const [pollStatus, setPollStatus] = useState<string | null>(null);
  const [clusterStatus, setClusterStatus] = useState<string | null>(null);
  const [synthesizingId, setSynthesizingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = async (eventId: string, title: string) => {
    const confirmed = confirm(
        `Delete cluster: "${title}"?\n\nThis will remove all linked raw articles and prune any entities not referenced by other events.`,
    );
    if (!confirmed) return;

    setDeletingId(eventId);
    startTransition(async () => {
        await deleteCluster(eventId);
        setClusters((prev) => prev.filter((c) => c.event_id !== eventId));
        setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
        });
        setDeletingId(null);
    });
    };

  const handlePollAndCluster = async () => {
    setIsPolling(true);
    setPollStatus(null);
    setClusterStatus(null);

    const res = await triggerIngestPipeline();
    if (res.success) {
      setPollStatus(`+${res.inserted} new (${res.skipped} dupes)`);
      setClusterStatus(
        `Embedded: ${res.processed} | New: ${res.newEvents} | Grouped: ${res.grouped}`,
      );

      if (res.clusters) {
        setClusters(res.clusters);
      }
      setTimeout(() => setPollStatus(null), 6000);
    } else {
      alert(res.error || "Pipeline failed");
    }
    setIsPolling(false);
  };

  const handleSynthesize = async (eventId: string) => {
    setSynthesizingId(eventId);
    const res = await triggerClusterSynthesis(eventId);
    if (res.success) {
      setClusters((prev) =>
        prev.map((c) =>
          c.event_id === eventId
            ? { ...c, is_synthesized: true, status: "in_review" }
            : c,
        ),
      );
    } else {
      alert(res.error || "Synthesis failed");
    }
    setSynthesizingId(null);
  };

  // Logic for sorting one offs
  const [activeTab, setActiveTab] = useState<"clusters" | "one_offs">(
    "clusters",
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Segregate multi-article clusters from un-synthesized one-offs
  const multiSourceClusters = clusters.filter(
    (c) => c.article_count > 1 || c.is_synthesized,
  );
  const oneOffArticles = clusters.filter(
    (c) => c.article_count === 1 && !c.is_synthesized,
  );
  const visibleList =
    activeTab === "clusters" ? multiSourceClusters : oneOffArticles;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleList.map((c) => c.event_id)));
    }
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (!confirm(`Discard ${ids.length} selected items?`)) return;

    setIsBatchDeleting(true);
    await deleteMultipleClusters(ids);
    setClusters((prev) => prev.filter((c) => !selectedIds.has(c.event_id)));
    setSelectedIds(new Set());
    setIsBatchDeleting(false);
  };

  const handlePurgeAllOneOffs = async () => {
    const ids = oneOffArticles.map((c) => c.event_id);
    if (!ids.length) return;
    if (!confirm(`Purge all ${ids.length} one-off wire reports?`)) return;

    setIsBatchDeleting(true);
    await deleteMultipleClusters(ids);
    setClusters((prev) =>
      prev.filter((c) => c.article_count > 1 || c.is_synthesized),
    );
    setSelectedIds(new Set());
    setIsBatchDeleting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/40 font-bold flex items-center gap-1.5">
            Ingest Queue
          </span>
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs ml-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab("clusters");
                setSelectedIds(new Set());
              }}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "clusters"
                  ? "bg-slate-800 text-white font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Clusters</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 bg-blue-950 text-blue-400 rounded-full border border-blue-800/40">
                {multiSourceClusters.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("one_offs");
                setSelectedIds(new Set());
              }}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "one_offs"
                  ? "bg-slate-800 text-white font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>One-Offs</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded-full">
                {oneOffArticles.length}
              </span>
            </button>
          </div>
          <h1 className="text-sm font-bold text-white tracking-wide">
            Wire Clusters
          </h1>
          <span className="text-xs text-slate-500 font-mono">
            ({clusters.length} active clusters)
          </span>
        </div>

        {isPending && (
          <div className="flex items-center gap-1.5 text-xs text-blue-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Updating queue...</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {pollStatus && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
              {pollStatus}
            </span>
          )}
          {clusterStatus && (
            <span className="text-[11px] font-mono text-blue-400 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded">
              {clusterStatus}
            </span>
          )}

          <button
            type="button"
            onClick={handlePollAndCluster}
            disabled={isPolling}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isPolling ? "animate-spin text-white" : "text-white"}`}
            />
            {isPolling ? "Fetching & Clustering..." : "Poll Feeds"}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-8 space-y-4">
        {visibleList.length > 0 && (
          <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800 px-4 py-2 rounded-xl text-xs">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white"
            >
              {selectedIds.size === visibleList.length ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span>Select All ({visibleList.length})</span>
            </button>

            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  disabled={isBatchDeleting}
                  onClick={handleDeleteSelected}
                  className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedIds.size})</span>
                </button>
              )}

              {activeTab === "one_offs" &&
                oneOffArticles.length > 0 &&
                selectedIds.size === 0 && (
                  <button
                    type="button"
                    disabled={isBatchDeleting}
                    onClick={handlePurgeAllOneOffs}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-900/60 text-slate-400 hover:text-red-300 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Purge All ({oneOffArticles.length})</span>
                  </button>
                )}
            </div>
          </div>
        )}
        {visibleList.length === 0 ? (
        <div className="p-16 border border-dashed border-slate-800 rounded-2xl text-center space-y-3 bg-slate-900/20">
            <Layers className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">
            {activeTab === "clusters" ? "No Active Event Clusters" : "No One-Off Articles"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === "clusters"
                ? "Multi-source clusters will appear here once two or more wire reports correlate, or once a deck is synthesized."
                : "All isolated, single-source wire reports are clear."}
            </p>
        </div>
        ) : (
          visibleList.map((cluster, index) => {
            const isExpanded = expandedId === cluster.event_id;
            const isDeleting = deletingId === cluster.event_id;
            const firstArticle = cluster.articles[0];
            return (
              <div
                key={cluster.event_id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden transition-all shadow-md"
              >
                {/* Cluster Header / Row Summary */}
                <div className="p-5 flex items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => toggleSelect(cluster.event_id)}
                    className="pt-1 text-slate-500 hover:text-white shrink-0"
                  >
                    {selectedIds.has(cluster.event_id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        #{index + 1}
                      </span>

                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60 font-mono">
                        {cluster.article_count}{" "}
                        {cluster.article_count === 1 ? "article" : "articles"}
                      </span>

                      {cluster.is_synthesized ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-semibold">
                          Deck Ready
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-medium">
                          Raw Wire
                        </span>
                      )}

                      {cluster.sources.map((src) => (
                        <span
                          key={src}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-medium"
                        >
                          {src}
                        </span>
                      ))}

                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono ml-auto">
                        <Clock className="w-3 h-3" />
                        {new Date(
                          cluster.latest_published_at,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <h2
                      onClick={() => toggleExpand(cluster.event_id)}
                      className="text-base font-bold text-white hover:text-blue-400 transition-colors cursor-pointer leading-snug line-clamp-2"
                    >
                      {cluster.title}
                    </h2>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    {activeTab === "one_offs" && firstArticle && (
                    <a
                        href={firstArticle.canonical_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                        title="Open wire source"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    )}
                    {!cluster.is_synthesized ? (
                      <button
                        type="button"
                        disabled={synthesizingId === cluster.event_id}
                        onClick={() => handleSynthesize(cluster.event_id)}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                      >
                        {synthesizingId === cluster.event_id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Synthesizing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                            Synthesize Deck
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={`/events/${cluster.event_id}`}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                      >
                        Open Studio
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() =>
                        handleDelete(cluster.event_id, cluster.title)
                      }
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
