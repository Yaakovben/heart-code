// One-shot video replacement.
//
// 1. Put your new video at src/assets/video.mp4
// 2. Set the BLOB_READ_WRITE_TOKEN env var (from Vercel → Storage → .env.local)
// 3. node scripts/replace-video.mjs
//
// The script uploads the file to Vercel Blob under a timestamped name (so the
// CDN never serves a stale cached copy), deletes the previous version, and
// writes the new public URL into src/lib/demoAssets.js. Commit + push and
// Vercel redeploys automatically.
import { put, del, list } from "@vercel/blob";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("Missing BLOB_READ_WRITE_TOKEN.");
  process.exit(1);
}

const sourcePath = resolve("src/assets/video.mp4");
const assetsPath = resolve("src/lib/demoAssets.js");

const data = readFileSync(sourcePath);
const filename = `video-${Date.now()}.mp4`;
console.log(`Uploading ${(data.length / 1024 / 1024).toFixed(1)} MB as ${filename}...`);

const blob = await put(filename, data, {
  access: "public",
  contentType: "video/mp4",
  token,
});
console.log(`✅ ${blob.url}`);

console.log("Cleaning up previous video blobs...");
const { blobs } = await list({ token });
for (const b of blobs) {
  if (/^video.*\.mp4$/i.test(b.pathname) && b.url !== blob.url) {
    console.log(`   removed ${b.pathname}`);
    await del(b.url, { token });
  }
}

console.log("Updating src/lib/demoAssets.js...");
const source = readFileSync(assetsPath, "utf8");
const updated = source.replace(
  /(const HOSTED_VIDEO_URL\s*=\s*)"https?:\/\/[^"]+"/,
  `$1"${blob.url}"`
);
if (updated === source) {
  console.warn("⚠️  Couldn't locate HOSTED_VIDEO_URL — update demoAssets.js by hand.");
} else {
  writeFileSync(assetsPath, updated);
  console.log("✅ demoAssets.js updated.");
}

console.log("\nNext: git add -A && git commit -m \"Update video\" && git push");
