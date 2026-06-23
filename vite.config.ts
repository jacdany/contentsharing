import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Deploying to Vercel: pin the nitro preset to "vercel" so the build emits
// Vercel-compatible output instead of the Cloudflare Worker default.
// NITRO_PRESET env var (set automatically on Vercel) will also override this.
export default defineConfig({
  nitro: { preset: "vercel" },
});
