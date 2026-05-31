// Upload video.mp4 to Vercel Blob as PUBLIC, get a permanent URL.
// Usage:
//   1. In Vercel → Storage → your Blob → ".env.local" tab → copy BLOB_READ_WRITE_TOKEN
//   2. Run: BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..." node scripts/upload-video.mjs
//   3. The script prints the public URL — paste it into Vercel env var VITE_VIDEO_URL.
import { put } from "@vercel/blob";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("Missing BLOB_READ_WRITE_TOKEN env var.");
  process.exit(1);
}

const path = resolve("src/assets/video.mp4");
const data = readFileSync(path);
console.log(`Uploading ${(data.length / 1024 / 1024).toFixed(1)} MB ...`);

const blob = await put("video.mp4", data, {
  access: "public",
  contentType: "video/mp4",
  token,
  allowOverwrite: true,
});

console.log("\n✅ Public URL:");
console.log(blob.url);
