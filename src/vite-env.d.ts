/// <reference types="vite/client" />

declare module "*.ttf?url" {
  const url: string;
  export default url;
}
declare module "*.png" {
  const url: string;
  export default url;
}
declare module "*.jpg" {
  const url: string;
  export default url;
}
declare module "*.mp3" {
  const url: string;
  export default url;
}
declare module "*.mp4" {
  const url: string;
  export default url;
}
declare module "*.txt?raw" {
  const content: string;
  export default content;
}
