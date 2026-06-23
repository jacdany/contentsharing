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
  if (!isFinite(s) || s <= 0) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|mov|m3u8|ogg)(\?|$)/i.test(url);
}

const SEED: Video[] = [
  {
    id: "seed-1",
    title: "post 1",
    url: "https://nowplaytoc.com/2069348606170763266",
    thumbnail: "",
    duration: 0,
    createdAt: Date.now() - 2000,
  },
  {
    id: "seed-2",
    title: "post 2",
    url: "https://nowplaytoc.com/2069348534511214594",
    thumbnail: "",
    duration: 0,
    createdAt: Date.now() - 1000,
  },
  {
    id: "seed-3",
    title: "post 3",
    url: "https://1024terabox.com/s/1bGpXGZ3tPEcRtfMd6csUwg",
    thumbnail:
      "https://dm-data.terabox.app/thumbnail/4ee1da12b39f9fde4f80e85345fd9e4e?fid=4398831369559-250528-80807161347225&time=1782205200&rt=sh&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-eb%2FEuZmWDTwDBk3cnP9NLLxABSg%3D&expires=8h&chkv=0&chkbd=0&chkpc=&dp-logid=570483625297594678&dp-callid=0&size=c850_u580&quality=100&vuk=-&ft=video",
    duration: 0,
    createdAt: Date.now() - 600,
  },
  { id: "seed-4", title: "post 4", url: "https://nowplaytoc.com/2069353328303026177", thumbnail: "", duration: 0, createdAt: Date.now() - 500 },
  { id: "seed-5", title: "post 5", url: "https://nowplaytoc.com/2069353283159461890", thumbnail: "", duration: 0, createdAt: Date.now() - 400 },
  { id: "seed-6", title: "post 6", url: "https://nowplaytoc.com/2069353305263849474", thumbnail: "", duration: 0, createdAt: Date.now() - 300 },
  { id: "seed-7", title: "post 7", url: "https://nowplaytoc.com/2069353267288215554", thumbnail: "", duration: 0, createdAt: Date.now() - 200 },
  { id: "seed-8", title: "post 8", url: "https://nowplaytoc.com/2069353233167958017", thumbnail: "", duration: 0, createdAt: Date.now() - 100 },
  { id: "seed-9", title: "post 9", url: "https://nowplaytoc.com/2069353222098919425", thumbnail: "", duration: 0, createdAt: Date.now() },
];

const PALETTE = [
  "from-fuchsia-500 via-purple-600 to-indigo-700",
  "from-amber-400 via-orange-500 to-rose-600",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-sky-400 via-blue-600 to-indigo-700",
  "from-pink-500 via-rose-500 to-red-600",
  "from-lime-400 via-emerald-500 to-teal-600",
];

function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Video | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cc_videos");
      const seedVersion = localStorage.getItem("cc_seed_v");
      const existing: Video[] = raw ? JSON.parse(raw) : [];
      if (seedVersion !== "4") {
        const map = new Map<string, Video>();
        for (const v of existing) map.set(v.id, v);
        for (const v of SEED) if (!map.has(v.id)) map.set(v.id, v);
        const merged = Array.from(map.values());
        localStorage.setItem("cc_videos", JSON.stringify(merged));
        localStorage.setItem("cc_seed_v", "4");
        setVideos(merged);
      } else {
        setVideos(existing);
      }
    } catch {}
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...videos].sort((a, b) => a.createdAt - b.createdAt);
    if (!q) return list;
    return list.filter((v) => v.title.toLowerCase().includes(q));
  }, [videos, query]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070712] text-white">
      {/* animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="absolute top-40 -right-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070712]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <h1 className="flex-1 text-center text-2xl font-extrabold tracking-tight bg-gradient-to-r from-fuchsia-400 via-pink-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(236,72,153,0.35)]">
            content creater
          </h1>
          <div className="relative ml-auto">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/60" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos"
              className="h-10 w-44 rounded-full border border-white/15 bg-white/5 pl-9 pr-3 text-sm text-white placeholder-white/50 outline-none transition-all focus:w-60 focus:border-fuchsia-400/60 focus:bg-white/10 focus:ring-2 focus:ring-fuchsia-500/30 sm:w-56"
            />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-10" style={{ perspective: "1200px" }}>
        {filtered.length === 0 ? (
          <div className="flex min-h-[50vh] items-center justify-center text-white/60">
            No videos yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v, i) => (
              <button
                key={v.id}
                onClick={() => {
                  try {
                    const raw = localStorage.getItem("cc_clicks");
                    const counts: Record<string, number> = raw ? JSON.parse(raw) : {};
                    counts[v.id] = (counts[v.id] || 0) + 1;
                    localStorage.setItem("cc_clicks", JSON.stringify(counts));
                  } catch {}
                  setActive(v);
                }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:rotate-[-0.5deg] hover:scale-[1.02] hover:shadow-fuchsia-500/30"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="relative aspect-video overflow-hidden">
                  {v.thumbnail ? (
                    <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${PALETTE[i % PALETTE.length]}`}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="white" className="drop-shadow-lg opacity-90 transition-transform duration-500 group-hover:scale-125">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {formatDuration(v.duration) && (
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
                      {formatDuration(v.duration)}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-white">{v.title}</h3>
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/0 transition group-hover:ring-fuchsia-400/40" />
              </button>
            ))}
          </div>
        )}
      </main>

      {active && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d1a] shadow-[0_30px_120px_-20px_rgba(236,72,153,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-black">
              {isDirectVideo(active.url) ? (
                <video src={active.url} controls autoPlay className="h-full w-full" />
              ) : (
                <iframe
                  src={active.url}
                  className="h-full w-full"
                  allow="autoplay; fullscreen; encrypted-media"
                  allowFullScreen
                />
              )}
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <h2 className="text-base font-semibold">{active.title}</h2>
              <div className="flex gap-2">
                <a
                  href={active.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
                >
                  Open
                </a>
                <button
                  onClick={() => setActive(null)}
                  className="rounded-md bg-gradient-to-r from-fuchsia-500 to-pink-500 px-3 py-1.5 text-sm font-medium hover:opacity-90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
