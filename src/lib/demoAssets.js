import musicUrl from "../assets/music.mp3";
import localVideoFallback from "../assets/video.mp4";

// In production (Vercel) set VITE_VIDEO_URL to a hosted video URL
// (e.g. Vercel Blob, Cloudinary). Falls back to the bundled local file
// when not set — useful for local dev.
const remoteVideoUrl = import.meta.env.VITE_VIDEO_URL;

export const localMusicUrl = musicUrl;
export const localVideoUrl = remoteVideoUrl || localVideoFallback;
