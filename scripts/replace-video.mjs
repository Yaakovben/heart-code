// One-shot video replacement: compress → upload → wire it into the app.
//
// Usage:
//   1. Save your new uncompressed video as src/assets/video.mp4 (overwrite).
//   2. Run:
//        $env:BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
//        node scripts/replace-video.mjs
//   3. Commit the change git tells you about and push. Vercel redeploys.
import { put, del, list } from "@vercel/blob";
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("Missing BLOB_READ_WRITE_TOKEN — paste it before running.");
  process.exit(1);
}

const source = resolve("src/assets/video.mp4");
const compressed = resolve("src/assets/video-small.mp4");
const assetsModule = resolve("src/lib/demoAssets.js");

const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  console.error("ffmpeg not found. Install: winget install Gyan.FFmpeg");
  process.exit(1);
}

console.log("→ Compressing source video...");
execSync(
  `"${ffmpeg}" -i "${source}" -vcodec libx264 -crf 26 -preset medium ` +
  `-vf "scale='min(1280,iw)':-2" -acodec aac -b:a 128k -movflags +faststart ` +
  `-y "${compressed}"`,
  { stdio: "inherit" }
);

const data = readFileSync(compressed);
const beforeMb = (statSync(source).size / 1024 / 1024).toFixed(1);
const afterMb = (data.length / 1024 / 1024).toFixed(1);
console.log(`\n→ Compressed ${beforeMb} MB → ${afterMb} MB`);

const versioned = `video-${Date.now()}.mp4`;
console.log(`→ Uploading as ${versioned}...`);
const blob = await put(versioned, data, {
  access: "public",
  contentType: "video/mp4",
  token,
});
console.log(`✅ ${blob.url}`);

console.log("→ Cleaning up older video blobs...");
const { blobs } = await list({ token });
const stale = blobs.filter(
  (b) => /^video.*\.mp4$/i.test(b.pathname) && b.url !== blob.url
);
for (const b of stale) {
  console.log(`   deleted ${b.pathname}`);
  await del(b.url, { token });
}

console.log("→ Updating src/lib/demoAssets.js with the new URL...");
const moduleSrc = readFileSync(assetsModule, "utf8");
const updated = moduleSrc.replace(
  /(const HOSTED_VIDEO_URL\s*=\s*)"https?:\/\/[^"]+"/,
  `$1"${blob.url}"`
);
if (updated === moduleSrc) {
  console.warn("⚠️  Couldn't find HOSTED_VIDEO_URL in demoAssets.js — update by hand.");
} else {
  writeFileSync(assetsModule, updated);
  console.log("✅ demoAssets.js updated.");
}

console.log("\nNext steps:");
console.log("   git add -A && git commit -m \"Update video\" && git push");

function findFfmpeg() {
  try {
    return execSync("where ffmpeg", { encoding: "utf8" }).trim().split("\n")[0];
  } catch {}
  try {
    const winget = execSync(
      'powershell -c "(Get-ChildItem $env:LOCALAPPDATA\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_* -Recurse -Filter ffmpeg.exe | Select -First 1).FullName"',
      { encoding: "utf8" }
    ).trim();
    if (winget) return winget;
  } catch {}
  return null;
}
