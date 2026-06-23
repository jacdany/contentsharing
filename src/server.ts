// Server entry. Re-exports TanStack Start's default handler so the build is
// runtime-agnostic (nitro picks the right adapter via the preset in vite.config.ts).
export { default } from "@tanstack/react-start/server-entry";
