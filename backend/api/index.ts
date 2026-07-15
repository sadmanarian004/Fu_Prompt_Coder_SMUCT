// Anything placed in /api is automatically detected by Vercel as a
// serverless function — no vercel.json "builds" entry, no separate build
// step required. This is the modern, zero-config equivalent of the old
// server-vercel.ts + legacy vercel.json "builds" approach, which was fragile
// in a monorepo (it depended on the project's dashboard Build Command
// running `tsc` successfully first, which is what broke the deploy).
import app from "../src/app";

export default app;