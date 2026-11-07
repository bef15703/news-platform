import { db, sql } from "@news-platform/db";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const revalidate = 0; // Fresh queries on load

export default async function EditorialDashboardPage() {
  const events = await sql<{
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
    GROUP BY e.id, e.title, e.status, e.deck_json, e.updated_at
    ORDER BY e.updated_at DESC;
  `.execute(db);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Editorial Desk</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review synthesized event decks, inspect Living Dossiers, and publish to iOS.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          {events.rows.length} Total Events
        </div>
      </div>

      <div className="space-y-2">
        {events.rows.map((ev) => (
          <Link
            key={ev.id}
            href={`/events/${ev.id}`}
            className="flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl transition-all"
          >
            <div className="flex items-center gap-4">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  ev.status === "published"
                    ? "bg-emerald-400"
                    : ev.status === "in_review"
                    ? "bg-amber-400"
                    : "bg-slate-500"
                }`}
              />
              <div>
                <h3 className="text-sm font-bold text-slate-100 hover:text-blue-400 transition-colors">
                  {ev.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>{ev.card_count} Cards</span>
                  <span>•</span>
                  <span>{ev.source_count} Sources</span>
                  <span>•</span>
                  <span className="capitalize">{ev.status.replace("_", " ")}</span>
                </div>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-600" />
          </Link>
        ))}
      </div>
    </div>
  );
}