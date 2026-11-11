import React from "react";
import { db, sql } from "@news-platform/db";
import Link from "next/link";
import Image from "next/image";
import {
  Radio,
  FileCheck2,
  Layers,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  User,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export const revalidate = 0;

export default async function EditorialDashboardPage() {
  // 1. Fetch high-level pipeline telemetry
  const metrics = await sql<{
    unclustered_articles: number;
    pending_clusters: number;
    in_review_events: number;
    published_events: number;
    total_entities: number;
    active_banners: number;
  }>`
    SELECT
      (SELECT COUNT(*)::int FROM raw_articles WHERE cluster_id IS NULL) AS unclustered_articles,
      (SELECT COUNT(DISTINCT cluster_id)::int FROM raw_articles WHERE cluster_id IS NOT NULL) AS pending_clusters,
      (SELECT COUNT(*)::int FROM events WHERE status = 'in_review') AS in_review_events,
      (SELECT COUNT(*)::int FROM events WHERE status = 'published') AS published_events,
      (SELECT COUNT(*)::int FROM entities) AS total_entities,
      (SELECT COUNT(*)::int FROM entities WHERE context_banner_active = true) AS active_banners;
  `.execute(db);

  const stats = metrics.rows[0];

  // 2. Fetch top 3 highest-priority breaking clusters waiting in ingest
  const topClusters = await sql<{
    event_id: string;
    event_title: string;
    article_count: number;
    sources: string[];
    latest_published_at: string;
  }>`
    SELECT 
      e.id AS event_id,
      e.title AS event_title,
      COUNT(ra.id)::int AS article_count,
      ARRAY_AGG(DISTINCT ra.source_name) AS sources,
      MAX(ra.published_at) AS latest_published_at
    FROM events e
    JOIN raw_articles ra ON ra.cluster_id = e.id
    WHERE e.status = 'draft'
    GROUP BY e.id, e.title
    ORDER BY article_count DESC, latest_published_at DESC
    LIMIT 3;
  `.execute(db);

  // 3. Fetch events requiring editorial attention (in_review or published)
  const stories = await sql<{
    id: string;
    title: string;
    status: string;
    card_count: number;
    source_count: number;
    updated_at: string;
  }>`
    SELECT 
      e.id, 
      e.title, 
      e.status, 
      COALESCE(jsonb_array_length(e.deck_json), 0)::int AS card_count,
      COUNT(r.id)::int AS source_count,
      e.updated_at
    FROM events e
    LEFT JOIN raw_articles r ON r.cluster_id = e.id
    WHERE e.status IN ('in_review', 'published')
    GROUP BY e.id, e.title, e.status, e.deck_json, e.updated_at
    ORDER BY e.updated_at DESC
    LIMIT 8;
  `.execute(db);

  // 4. Fetch entities with active banners or recent updates
  const flaggedEntities = await db
    .selectFrom("entities")
    .select(["id", "name", "category", "avatar_url", "context_banner_active", "context_banner_title"])
    .where("context_banner_active", "=", true)
    .limit(4)
    .execute();

  return (
    <div className="min-h-screen bg-canvas text-content-primary p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Welcome & Quick Stats */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-black text-content-primary">
            Editorial Mission Control
          </h1>
          <p className="text-xs text-content-secondary mt-0.5">
            Triage raw wire clusters, polish AI-synthesized story decks, and inspect entity dossiers.
          </p>
        </div>

        {/* Telemetry Metric Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/ingest"
            className="p-4 rounded-2xl bg-surface border border-border-subtle hover:border-brand/60 transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">
                Pending Clusters
              </span>
              <Radio className="w-4 h-4 text-brand group-hover:animate-pulse" />
            </div>
            <div className="text-2xl font-black text-content-primary mt-2">
              {stats.pending_clusters}
            </div>
            <p className="text-[10px] text-content-muted mt-1">
              {stats.unclustered_articles} unassigned wire articles
            </p>
          </Link>

          <div className="p-4 rounded-2xl bg-surface border border-border-subtle shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">
                Awaiting Review
              </span>
              <FileCheck2 className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-content-primary mt-2">
              {stats.in_review_events}
            </div>
            <p className="text-[10px] text-content-muted mt-1">
              Synthesized decks ready for signoff
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border-subtle shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">
                Live On iOS
              </span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-content-primary mt-2">
              {stats.published_events}
            </div>
            <p className="text-[10px] text-content-muted mt-1">
              Published public event cards
            </p>
          </div>

          <Link
            href="/entities"
            className="p-4 rounded-2xl bg-surface border border-border-subtle hover:border-brand/60 transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary">
                Entities
              </span>
              <Layers className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-content-primary mt-2">
              {stats.total_entities}
            </div>
            <p className="text-[10px] text-content-muted mt-1">
              {stats.active_banners} active context alerts
            </p>
          </Link>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Top Breaking Ingest Clusters & Active Story Decks */}
        <div className="lg:col-span-8 space-y-6">
          {/* Breaking News Ingest Triage Strip */}
          {topClusters.rows.length > 0 && (
            <div className="bg-surface border border-brand/20 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-content-primary">
                    Highest-Volume Inbound Clusters
                  </h3>
                </div>
                <Link
                  href="/ingest"
                  className="text-xs text-brand hover:text-brand-hover font-semibold flex items-center gap-1 transition-colors"
                >
                  View Ingest Queue ({stats.pending_clusters}) →
                </Link>
              </div>

              <div className="space-y-2">
                {topClusters.rows.map((c) => (
                  <Link
                    key={c.event_id}
                    href={`/events/${c.event_id}`}
                    className="p-3 bg-elevated hover:bg-surface border border-border-subtle hover:border-brand/50 rounded-xl flex items-center justify-between gap-4 transition-all group"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20 font-bold">
                          {c.article_count} sources
                        </span>
                        {c.sources.slice(0, 3).map((s) => (
                          <span key={s} className="text-[10px] text-content-muted font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                      <h4 className="text-xs font-bold text-content-primary group-hover:text-brand truncate">
                        {c.event_title}
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold text-content-secondary group-hover:text-content-primary shrink-0 flex items-center gap-1">
                      Edit Deck →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Active Story Decks */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                  Active Event Decks
                </h3>
                <p className="text-xs text-content-muted mt-0.5">
                  Stories currently in editorial review or live on mobile feeds.
                </p>
              </div>
            </div>

            {stories.rows.length === 0 ? (
              <div className="p-8 text-center text-xs text-content-muted">
                No active events in review or published yet.
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {stories.rows.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.id}`}
                    className="py-3.5 flex items-center justify-between hover:bg-elevated/40 px-2 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          ev.status === "published"
                            ? "bg-emerald-500 shadow-sm shadow-emerald-500/40"
                            : "bg-amber-500 shadow-sm shadow-amber-500/40"
                        }`}
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-content-primary group-hover:text-brand truncate transition-colors">
                          {ev.title}
                        </h4>
                        <div className="flex items-center gap-2.5 text-[11px] text-content-muted mt-0.5">
                          <span>{ev.card_count} cards</span>
                          <span>•</span>
                          <span>{ev.source_count} sources</span>
                          <span>•</span>
                          <span className="capitalize text-content-secondary">
                            {ev.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-content-muted group-hover:text-content-secondary transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Context Alert Audit & Navigation Shortcuts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Context Banner Watchlist */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                  Active Warnings
                </h3>
              </div>
              <Link
                href="/entities"
                className="text-[11px] text-content-secondary hover:text-content-primary"
              >
                All Entities →
              </Link>
            </div>
            <p className="text-[11px] text-content-muted leading-snug">
              Entities with prominent red or yellow structural banners live on user devices.
            </p>

            {flaggedEntities.length === 0 ? (
              <p className="text-xs text-content-muted italic py-2">
                No active context warnings deployed.
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {flaggedEntities.map((ent) => (
                  <Link
                    key={ent.id}
                    href={`/entities/${ent.id}`}
                    className="p-2.5 bg-canvas border border-border-subtle hover:border-amber-500/50 rounded-xl flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Set relative container for fill-based Next.js Image */}
                      <div className="relative w-7 h-7 rounded-lg bg-elevated overflow-hidden shrink-0 flex items-center justify-center border border-border-subtle">
                        {ent.avatar_url ? (
                          <Image
                            src={ent.avatar_url}
                            alt={ent.name}
                            fill
                            sizes="28px"
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <User className="w-3.5 h-3.5 text-content-muted" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-content-primary group-hover:text-amber-500 truncate block">
                          {ent.name}
                        </span>
                        <span className="text-[10px] text-content-muted truncate block">
                          {ent.context_banner_title || "Alert Active"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-content-muted group-hover:text-content-primary shrink-0">
                      Edit
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Jump Links */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary">
              Quick Portals
            </h3>
            <div className="space-y-1.5">
              <Link
                href="/ingest"
                className="w-full p-2.5 bg-canvas hover:bg-elevated border border-border-subtle rounded-xl flex items-center justify-between text-xs font-medium text-content-secondary hover:text-content-primary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-brand" />
                  <span>Wire Triage & Clustering</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-content-muted" />
              </Link>

              <Link
                href="/entities"
                className="w-full p-2.5 bg-canvas hover:bg-elevated border border-border-subtle rounded-xl flex items-center justify-between text-xs font-medium text-content-secondary hover:text-content-primary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Entity Directory</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-content-muted" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}