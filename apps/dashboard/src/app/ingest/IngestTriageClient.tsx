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
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col">
      {/* Top Header */}
      <header className="h-14 border-b border-border-subtle px-8 flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/30 font-bold flex items-center gap-1.5">
            Ingest Queue
          </span>
          <div className="flex items-center gap-2 bg-canvas p-1 rounded-xl border border-border-subtle text-xs ml-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab("clusters");
                setSelectedIds(new Set());
              }}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "clusters"
                  ? "bg-elevated text-content-primary font-bold"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              <span>Clusters</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 bg-brand/10 text-brand rounded-full border border-brand/30">
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
                  ? "bg-elevated text-content-primary font-bold"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              <span>One-Offs</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 bg-elevated text-content-secondary rounded-full">
                {oneOffArticles.length}
              </span>
            </button>
          </div>
          <h1 className="text-sm font-bold text-content-primary tracking-wide">
            Wire Clusters
          </h1>
          <span className="text-xs text-content-muted font-mono">
            ({clusters.length} active clusters)
          </span>
        </div>

        {isPending && (
          <div className="flex items-center gap-1.5 text-xs text-brand">
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
            <span className="text-[11px] font-mono text-brand bg-brand/10 border border-brand/30 px-2 py-0.5 rounded">
              {clusterStatus}
            </span>
          )}

          <button
            type="button"
            onClick={handlePollAndCluster}
            disabled={isPolling}
            className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
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
          <div className="flex items-center justify-between bg-elevated border border-border-subtle px-4 py-2 rounded-xl text-xs">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-content-secondary hover:text-content-primary"
            >
              {selectedIds.size === visibleList.length ? (
                <CheckSquare className="w-4 h-4 text-brand" />
              ) : (
                <Square className="w-4 h-4 text-content-muted" />
              )}
              <span>Select All ({visibleList.length})</span>
            </button>

            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  disabled={isBatchDeleting}
                  onClick={handleDeleteSelected}
                  className="px-2.5 py-1 bg-red-200 hover:bg-red-300 border border-red-800 text-red-800 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
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
                    className="px-2.5 py-1 bg-surface hover:bg-red-950/60 border border-border-subtle hover:border-red-900/60 text-content-secondary hover:text-red-300 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Purge All ({oneOffArticles.length})</span>
                  </button>
                )}
            </div>
          </div>
        )}
        {visibleList.length === 0 ? (
        <div className="p-16 border border-dashed border-border-subtle rounded-2xl text-center space-y-3 bg-surface/40">
            <Layers className="w-8 h-8 text-content-muted mx-auto" />
            <h3 className="text-sm font-bold text-content-secondary">
            {activeTab === "clusters" ? "No Active Event Clusters" : "No One-Off Articles"}
            </h3>
            <p className="text-xs text-content-muted max-w-sm mx-auto">
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
                className="bg-surface border border-border-subtle rounded-2xl overflow-hidden transition-all shadow-sm"
              >
                {/* Cluster Header / Row Summary */}
                <div className="p-5 flex items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => toggleSelect(cluster.event_id)}
                    className="pt-1 text-content-muted hover:text-content-primary shrink-0"
                  >
                    {selectedIds.has(cluster.event_id) ? (
                      <CheckSquare className="w-4 h-4 text-brand" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-elevated text-content-secondary font-bold">
                        #{index + 1}
                      </span>

                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/30 font-mono">
                        {cluster.article_count}{" "}
                        {cluster.article_count === 1 ? "article" : "articles"}
                      </span>

                      {cluster.is_synthesized ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-800 border border-emerald-800/40 font-semibold">
                          Deck Ready
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-elevated text-content-muted border border-border-subtle font-medium">
                          Raw Wire
                        </span>
                      )}

                      {cluster.sources.map((src) => (
                        <span
                          key={src}
                          className="text-[10px] px-2 py-0.5 rounded bg-canvas border border-border-subtle text-content-muted font-medium"
                        >
                          {src}
                        </span>
                      ))}

                      <span className="text-[11px] text-content-muted flex items-center gap-1 font-mono ml-auto">
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
                      className="text-base font-bold text-content-primary hover:text-brand transition-colors cursor-pointer leading-snug line-clamp-2"
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
                        className="p-2 bg-canvas hover:bg-elevated border border-border-subtle text-content-secondary hover:text-content-primary rounded-xl transition-all"
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
                        className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {synthesizingId === cluster.event_id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Synthesizing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-white/80" />
                            Synthesize Deck
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={`/events/${cluster.event_id}`}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-800 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all"
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
                      className="p-2 rounded-xl bg-canvas border border-border-subtle text-content-secondary hover:bg-red-300 hover:text-red-800 transition-colors disabled:opacity-40"
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
                      className="p-2 rounded-xl bg-canvas border border-border-subtle text-content-secondary hover:text-content-primary transition-colors"
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
                  <div className="border-t border-border-subtle bg-canvas/60 p-5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand" />
                      Ingested Wire Coverage ({cluster.articles.length})
                    </h3>

                    <div className="space-y-2">
                      {cluster.articles.map((art) => (
                        <div
                          key={art.id}
                          className="p-3.5 rounded-xl border border-border-subtle bg-surface hover:bg-elevated transition-colors flex items-start justify-between gap-4"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                                {art.source_name}
                              </span>
                              <span className="text-[10px] text-content-muted font-mono">
                                {new Date(art.published_at).toLocaleString()}
                              </span>
                            </div>
                            <h4 className="text-xs font-semibold text-content-primary leading-snug">
                              {art.title}
                            </h4>
                            {art.summary_raw && (
                              <p className="text-[11px] text-content-secondary line-clamp-2 leading-relaxed">
                                {art.summary_raw}
                              </p>
                            )}
                          </div>

                          <a
                            href={art.canonical_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-canvas hover:bg-brand border border-border-subtle hover:border-brand text-content-secondary hover:text-white rounded-lg transition-all shrink-0 flex items-center gap-1 text-[11px] font-semibold"
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