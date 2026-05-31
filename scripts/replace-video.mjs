// Replace the hosted video with a new one — compress + upload in one step.
//
// Usage:
//   1. Save your new (uncompressed) video as src/assets/video.mp4
//   2. Make sure BLOB_READ_WRITE_TOKEN is set (run set-token.ps1 once)
//   3. node scripts/replace-video.mjs
//
// The script:
//   - Compresses the source to 720p H.264 at CRF 26 (~7-10x smaller, no
//     perceivable quality loss on a phone)
//   - Uploads the compressed file to Vercel Blob, overwriting the existing
//     video.mp4 — the public URL stays the same, so no env var change.
import { put } from "@vercel/blob";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("Missing BLOB_READ_WRITE_TOKEN — set it first.");
  process.exit(1);
}

const source = resolve("src/assets/video.mp4");
const compressed = resolve("src/assets/video-small.mp4");

const ffmpegPath = findFfmpeg();
if (!ffmpegPath) {
  console.error("ffmpeg not found. Install: winget install Gyan.FFmpeg");
  process.exit(1);
}

console.log("→ Compressing...");
execSync(
  `"${ffmpegPath}" -i "${source}" -vcodec libx264 -crf 26 -preset medium ` +
  `-vf "scale='min(1280,iw)':-2" -acodec aac -b:a 128k -movflags +faststart ` +
  `-y "${compressed}"`,
  { stdio: "inherit" }
);

const data = readFileSync(compressed);
const before = (statSync(source).size / 1024 / 1024).toFixed(1);
const after = (data.length / 1024 / 1024).toFixed(1);
console.log(`\n→ Compressed ${before}MB → ${after}MB`);

console.log("→ Uploading to Vercel Blob...");
const blob = await put("video.mp4", data, {
  access: "public",
  contentType: "video/mp4",
  token,
  allowOverwrite: true,
});

console.log("\n✅ Live at:");
console.log(blob.url);
console.log("\nDone. No env var changes needed — same URL.");

function findFfmpeg() {
  try {
    return execSync("where ffmpeg", { encoding: "utf8" }).trim().split("\n")[0];
  } catch {}
  try {
    const wingetPath = execSync(
      'powershell -c "(Get-ChildItem $env:LOCALAPPDATA\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_* -Recurse -Filter ffmpeg.exe | Select -First 1).FullName"',
      { encoding: "utf8" }
    ).trim();
    if (wingetPath) return wingetPath;
  } catch {}
  return null;
}
