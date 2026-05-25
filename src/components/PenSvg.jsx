// Elegant fountain pen SVG — points downward-left so the tip aligns with cursor
export default function PenSvg({ className = "pen-svg" }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id="penBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3a2218" />
          <stop offset="50%" stopColor="#1a0e08" />
          <stop offset="100%" stopColor="#000" />
        </linearGradient>
        <linearGradient id="penGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5dca0" />
          <stop offset="50%" stopColor="#c9a36b" />
          <stop offset="100%" stopColor="#8a5e2a" />
        </linearGradient>
        <linearGradient id="penNib" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8d5a0" />
          <stop offset="100%" stopColor="#8a5e2a" />
        </linearGradient>
      </defs>
      {/* Pen body — diagonal from top-right (held) to bottom-left (nib) */}
      <g transform="rotate(-35 50 50)">
        {/* Cap end */}
        <rect x="60" y="46" width="6" height="8" fill="url(#penGold)" rx="1" />
        {/* Body */}
        <rect x="22" y="46" width="40" height="8" fill="url(#penBody)" rx="2" />
        {/* Gold ring */}
        <rect x="22" y="46" width="3" height="8" fill="url(#penGold)" />
        {/* Nib */}
        <polygon points="22,46 22,54 12,52 12,48" fill="url(#penNib)" />
        {/* Tip */}
        <polygon points="12,48 12,52 8,50" fill="#1a0e08" />
        {/* Highlight */}
        <rect x="24" y="47" width="36" height="1.2" fill="rgba(255,255,255,0.15)" rx="1" />
      </g>
    </svg>
  );
}
