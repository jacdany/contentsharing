import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out loading video metadata. URL may not be a direct video file."));
    }, 20000);

    const cleanup = () => {
      clearTimeout(timeout);
      video.src = "";
    };

    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      // Seek a bit in to grab a frame
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
      } catch (e) {
        cleanup();
        reject(e);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Could not load video. The URL may not be a direct, playable video file."));
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
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
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
          className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <h1 className="text-lg font-semibold">Admin access</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter password to continue.</p>
          <input
            type="password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setErr("");
            }}
            className="mt-4 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Password"
            autoFocus
          />
          {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
          <button className="mt-4 h-10 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground hover:opacity-90">
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
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    setVideos(loadVideos());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!title.trim() || !url.trim()) {
      setMsg({ type: "err", text: "Title and URL are required." });
      return;
    }
    setBusy(true);
    try {
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
      setTitle("");
      setUrl("");
      setMsg({ type: "ok", text: `Posted. Duration ${Math.round(duration)}s.` });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Failed to analyze video." });
    } finally {
      setBusy(false);
    }
  }

  function remove(id: string) {
    const updated = videos.filter((v) => v.id !== id);
    setVideos(updated);
    saveVideos(updated);
  }

  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin — content creater</h1>
          <button
            onClick={() => {
              sessionStorage.removeItem("cc_admin");
              location.reload();
            }}
            className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
          >
            Sign out
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-xl border border-border bg-card p-5">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Video title"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Video URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="https://example.com/video.mp4"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Must be a direct, playable video URL (e.g. .mp4). Duration and thumbnail are auto-extracted.
            </p>
          </div>
          {msg && (
            <p className={`text-sm ${msg.type === "ok" ? "text-green-600" : "text-destructive"}`}>{msg.text}</p>
          )}
          <button
            disabled={busy}
            className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Analyzing..." : "Post video"}
          </button>
        </form>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Posted videos ({videos.length})
        </h2>
        <ul className="mt-3 space-y-2">
          {videos.map((v) => (
            <li key={v.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              {v.thumbnail ? (
                <img src={v.thumbnail} alt="" className="h-14 w-24 rounded object-cover" />
              ) : (
                <div className="h-14 w-24 rounded bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{v.title}</p>
                <p className="truncate text-xs text-muted-foreground">{v.url}</p>
              </div>
              <button
                onClick={() => remove(v.id)}
                className="rounded-md border border-input px-2 py-1 text-xs hover:bg-accent"
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
