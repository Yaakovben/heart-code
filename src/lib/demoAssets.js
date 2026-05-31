import musicUrl from "../assets/music.mp3";
import localVideoFallback from "../assets/video.mp4";

// Hosted, compressed video on Vercel Blob — 17.8 MB, ~4s to download on 4G.
// Filename is timestamp-versioned so the CDN never serves a stale cached copy
// when we re-upload. To swap the video: run scripts/upload-versioned.mjs and
// paste the new URL here.
const HOSTED_VIDEO_URL =
  "https://ifjg9y5tj20lur8r.public.blob.vercel-storage.com/video-1780232235631.mp4";

export const localMusicUrl = musicUrl;
export const localVideoUrl = import.meta.env.PROD
  ? HOSTED_VIDEO_URL
  : localVideoFallback;
