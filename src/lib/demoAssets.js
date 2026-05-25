// Beautiful demo images from Unsplash (royalty-free, hotlinkable).
// Replace these later with your own files in src/assets/.

export const demoHero =
  "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&w=1200&q=80";

// Real luxury asset photos
export const photoBackdrop =
  "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?auto=format&fit=crop&w=1600&q=80";
export const photoEnvelope =
  "https://images.unsplash.com/photo-1579541591970-e5780dc6b31f?auto=format&fit=crop&w=900&q=80";
export const photoHandWriting =
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80";
export const photoParchment =
  "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=900&q=80";

export const demoMemories = [
  "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1495434942214-9b525bba74fd?auto=format&fit=crop&w=900&q=80",
];

// Real assets if they exist (will be empty placeholders until you replace them)
import musicUrl from "../assets/music.mp3";
import videoUrl from "../assets/video.mp4";
import imageUrl from "../assets/image.jpg";

// Heuristic: if the file is suspiciously tiny (empty placeholder), we treat as "demo mode".
// We can't check size in browser, so we just expose both — the App will try the local one,
// fail gracefully, and the synth music + demo image will take over.
export const localMusicUrl = musicUrl;
export const localVideoUrl = videoUrl;
export const localImageUrl = imageUrl;
