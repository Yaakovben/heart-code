import { put, del, list } from "@vercel/blob";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) { console.error("Missing BLOB_READ_WRITE_TOKEN"); process.exit(1); }

const data = readFileSync(resolve("src/assets/video-small.mp4"));
const versioned = `video-${Date.now()}.mp4`;
console.log(`Uploading ${(data.length / 1024 / 1024).toFixed(1)} MB as ${versioned} ...`);

const blob = await put(versioned, data, {
  access: "public",
  contentType: "video/mp4",
  token,
});

console.log("\n✅ New URL:");
console.log(blob.url);

// Clean up older video blobs (keep only the new one).
const { blobs } = await list({ token });
const old = blobs.filter(b => /^video.*\.mp4$/.test(b.pathname) && b.url !== blob.url);
for (const b of old) {
  console.log(`Deleting old: ${b.pathname}`);
  await del(b.url, { token });
}
