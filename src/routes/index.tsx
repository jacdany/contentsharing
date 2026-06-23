import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "content creater" },
      { name: "description", content: "Video posts by content creater." },
    ],
  }),
  component: Home,
});

type Video = {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  createdAt: number;
};

function formatDuration(s: number) {
  if (!isFinite(s) || s <= 0) return "--:--";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [active, setActive] = useState<Video | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cc_videos");
      if (raw) setVideos(JSON.parse(raw));
    } catch {}
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...videos].sort((a, b) => b.createdAt - a.createdAt);
    if (!q) return list;
    return list.filter((v) => v.title.toLowerCase().includes(q));
  }, [videos, query]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => setShowSearch((s) => !s)}
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          {showSearch && (
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos..."
              className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          )}
          <h1 className="ml-auto text-lg font-semibold tracking-tight">content creater</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {filtered.length === 0 ? (
          <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
            No videos yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v) => (
              <button
                key={v.id}
                onClick={() => setActive(v)}
                className="group overflow-hidden rounded-xl border border-border bg-card text-left transition hover:shadow-lg"
              >
                <div className="relative aspect-video bg-muted">
                  {v.thumbnail ? (
                    <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">No preview</div>
                  )}
                  <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
                    {formatDuration(v.duration)}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-medium">{v.title}</h3>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {active && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-xl bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-black">
              <video src={active.url} controls autoPlay className="h-full w-full" />
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <h2 className="text-base font-semibold">{active.title}</h2>
              <button
                onClick={() => setActive(null)}
                className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
