import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MousePointerClick } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

const ADMIN_PASSWORD = "Eepssp*@&564";

type Video = {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  createdAt: number;
};

function loadVideos(): Video[] {
  try {
    const raw = localStorage.getItem("cc_videos");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveVideos(v: Video[]) {
  localStorage.setItem("cc_videos", JSON.stringify(v));
}

async function analyzeVideo(url: string): Promise<{ duration: number; thumbnail: string }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const timeout = setTimeout(() => {
      cleanup();
      resolve({ duration: 0, thumbnail: "" });
    }, 12000);

    const cleanup = () => {
      clearTimeout(timeout);
      video.src = "";
    };

    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      const seekTo = Math.min(1, Math.max(0, duration / 10));
      video.currentTime = seekTo;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        let thumbnail = "";
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          try {
            thumbnail = canvas.toDataURL("image/jpeg", 0.7);
          } catch {
            thumbnail = "";
          }
        }
        const duration = video.duration || 0;
        cleanup();
        resolve({ duration, thumbnail });
      } catch {
        cleanup();
        resolve({ duration: 0, thumbnail: "" });
      }
    };

    video.onerror = () => {
      cleanup();
      resolve({ duration: 0, thumbnail: "" });
    };
  });
}

function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem("cc_admin") === "1") setAuthed(true);
  }, []);

  if (!authed) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070712] p-4 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-600/40 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/30 blur-3xl" />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pw === ADMIN_PASSWORD) {
              sessionStorage.setItem("cc_admin", "1");
              setAuthed(true);
            } else {
              setErr("Incorrect password");
            }
          }}
          className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl backdrop-blur-xl"
        >
          <h1 className="bg-gradient-to-r from-fuchsia-400 to-amber-300 bg-clip-text text-xl font-bold text-transparent">Admin access</h1>
          <p className="mt-1 text-sm text-white/60">Enter password to continue.</p>
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setErr(""); }}
            className="mt-4 h-11 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white placeholder-white/40 outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
            placeholder="Password"
            autoFocus
          />
          {err && <p className="mt-2 text-sm text-rose-400">{err}</p>}
          <button className="mt-5 h-11 w-full rounded-lg bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 hover:opacity-95">
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => { setVideos(loadVideos()); }, []);

  function resetForm() {
    setTitle("");
    setUrl("");
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!title.trim() || !url.trim()) {
      setMsg({ type: "err", text: "Title and URL are required." });
      return;
    }
    setBusy(true);
    try {
      if (editingId) {
        const existing = videos.find((v) => v.id === editingId);
        const urlChanged = existing && existing.url !== url.trim();
        let duration = existing?.duration ?? 0;
        let thumbnail = existing?.thumbnail ?? "";
        if (urlChanged) {
          const r = await analyzeVideo(url.trim());
          duration = r.duration;
          thumbnail = r.thumbnail;
        }
        const updated = videos.map((v) =>
          v.id === editingId ? { ...v, title: title.trim(), url: url.trim(), duration, thumbnail } : v
        );
        setVideos(updated);
        saveVideos(updated);
        setMsg({ type: "ok", text: "Post updated." });
      } else {
        const { duration, thumbnail } = await analyzeVideo(url.trim());
        const next: Video = {
          id: crypto.randomUUID(),
          title: title.trim(),
          url: url.trim(),
          thumbnail,
          duration,
          createdAt: Date.now(),
        };
        const updated = [next, ...videos];
        setVideos(updated);
        saveVideos(updated);
        setMsg({ type: "ok", text: "Post added." });
      }
      resetForm();
    } finally {
      setBusy(false);
    }
  }

  function startEdit(v: Video) {
    setEditingId(v.id);
    setTitle(v.title);
    setUrl(v.url);
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    const updated = videos.filter((v) => v.id !== id);
    setVideos(updated);
    saveVideos(updated);
    if (editingId === id) resetForm();
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070712] p-4 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-fuchsia-600/25 blur-3xl" />
        <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-amber-300 bg-clip-text text-2xl font-extrabold text-transparent">
            Admin — content creater
          </h1>
          <button
            onClick={() => { sessionStorage.removeItem("cc_admin"); location.reload(); }}
            className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Sign out
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-xl">
          <h2 className="text-sm font-semibold text-white/80">{editingId ? "Edit post" : "New post"}</h2>
          <div>
            <label className="text-sm font-medium text-white/80">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
              placeholder="Video title"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white/80">Video URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
              placeholder="https://example.com/video.mp4 or share link"
            />
            <p className="mt-1 text-xs text-white/50">
              Direct video files (.mp4) get auto duration & thumbnail. Share links still post but without preview.
            </p>
          </div>
          {msg && (
            <p className={`text-sm ${msg.type === "ok" ? "text-emerald-400" : "text-rose-400"}`}>{msg.text}</p>
          )}
          <div className="flex gap-2">
            <button
              disabled={busy}
              className="h-10 rounded-lg bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 px-5 text-sm font-semibold shadow-lg shadow-fuchsia-500/30 hover:opacity-95 disabled:opacity-50"
            >
              {busy ? "Saving..." : editingId ? "Update post" : "Add post"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="h-10 rounded-lg border border-white/15 bg-white/5 px-4 text-sm hover:bg-white/10"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <h2 className="mt-8 text-xs font-semibold uppercase tracking-widest text-white/50">
          Posted videos ({videos.length})
        </h2>
        <ul className="mt-3 space-y-2">
          {videos.map((v) => (
            <li
              key={v.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur transition hover:border-fuchsia-400/30"
            >
              {v.thumbnail ? (
                <img src={v.thumbnail} alt="" className="h-14 w-24 rounded-md object-cover" />
              ) : (
                <div className="flex h-14 w-24 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500 to-indigo-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{v.title}</p>
                <p className="truncate text-xs text-white/50">{v.url}</p>
              </div>
              <button
                onClick={() => startEdit(v)}
                className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10"
              >
                Edit
              </button>
              <button
                onClick={() => remove(v.id)}
                className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-500/20"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
