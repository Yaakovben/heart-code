import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as opentype from "opentype.js";
import ankaFontUrl from "../assets/fonts/bellefair.ttf?url";
import handPenUrl from "../assets/hand-pen.png";

// ---------- types ----------
type Glyph = {
  d: string;
  x: number;
  advance: number;
  isSpace: boolean;
};
type Line = {
  glyphs: Glyph[];
  width: number;
  blank?: boolean;
};
type Props = {
  lines: string[];
  fontSize?: number;
  charDelay?: number;
  lineGap?: number;
  handWidth?: number;
  onDone?: () => void;
};

// ---------- font loading (cached) ----------
let fontPromise: Promise<opentype.Font> | null = null;
function loadFont(): Promise<opentype.Font> {
  if (!fontPromise) {
    fontPromise = fetch(ankaFontUrl)
      .then((r) => r.arrayBuffer())
      .then((buf) => opentype.parse(buf));
  }
  return fontPromise;
}

// ---------- helpers ----------
// Strip the decorative "baseline tags" some Hebrew fonts (like anka.ttf)
// embed in every glyph. Without this, adjacent letters' tags visually merge
// into a continuous horizontal bar under whole words.
function cleanPathData(path: opentype.Path, fontSize: number): string {
  const cmds: any[] = (path as any).commands ?? [];
  if (cmds.length === 0) return path.toPathData(2);

  // Split into sub-paths (each starting with "M").
  const subs: any[][] = [];
  let cur: any[] = [];
  for (const c of cmds) {
    if (c.type === "M" && cur.length > 0) { subs.push(cur); cur = []; }
    cur.push(c);
  }
  if (cur.length > 0) subs.push(cur);

  const kept: any[][] = [];
  for (const sp of subs) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const c of sp) {
      const pts: Array<[number | undefined, number | undefined]> = [
        [c.x, c.y], [c.x1, c.y1], [c.x2, c.y2],
      ];
      for (const [px, py] of pts) {
        if (px !== undefined) { if (px < minX) minX = px; if (px > maxX) maxX = px; }
        if (py !== undefined) { if (py < minY) minY = py; if (py > maxY) maxY = py; }
      }
    }
    const w = maxX - minX;
    const h = maxY - minY;
    const centerY = (minY + maxY) / 2;
    // Bar if: thin shape sitting at/near the baseline (y ≈ 0).
    // Detects both tiny per-letter tags AND wider connecting bars.
    const isBar =
      h < fontSize * 0.12 &&
      Math.abs(centerY) < fontSize * 0.08 &&
      w > 0;
    if (!isBar) kept.push(sp);
  }

  let d = "";
  for (const sp of kept) {
    for (const c of sp) {
      switch (c.type) {
        case "M": d += `M${c.x} ${c.y}`; break;
        case "L": d += `L${c.x} ${c.y}`; break;
        case "C": d += `C${c.x1} ${c.y1} ${c.x2} ${c.y2} ${c.x} ${c.y}`; break;
        case "Q": d += `Q${c.x1} ${c.y1} ${c.x} ${c.y}`; break;
        case "Z": d += "Z"; break;
      }
    }
  }
  return d || path.toPathData(2);
}

function textToPaths(font: opentype.Font, text: string, fontSize: number): Line {
  const scale = fontSize / font.unitsPerEm;
  const glyphs = font.stringToGlyphs(text);
  const out: Glyph[] = [];
  let x = 0;
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    const path = g.getPath(0, 0, fontSize);
    const advance = (g.advanceWidth ?? 0) * scale;
    out.push({
      d: cleanPathData(path, fontSize),
      x,
      advance,
      isSpace: text[i] === " ",
    });
    x += advance;
  }
  return { glyphs: out, width: x };
}

function wrapLines(font: opentype.Font, lines: string[], fontSize: number, maxWidth: number): Line[] {
  const out: Line[] = [];
  for (const text of lines) {
    const words = text.split(" ");
    let current = "";
    for (const w of words) {
      const trial = current ? `${current} ${w}` : w;
      if (textToPaths(font, trial, fontSize).width > maxWidth && current) {
        out.push(textToPaths(font, current, fontSize));
        current = w;
      } else {
        current = trial;
      }
    }
    if (current) out.push(textToPaths(font, current, fontSize));
    out.push({ glyphs: [], width: 0, blank: true });
  }
  return out;
}

// ---------- ink color constants ----------
const INK_FRESH = "#7a3a18";
const INK_DRY = "#1a0e08";

// ============================================================
// HandwritingCanvas — Hebrew text reveal with following pen+hand.
// ============================================================
export default function HandwritingCanvas({
  lines,
  fontSize = 30,
  charDelay = 95,
  lineGap = 1.6,
  handWidth = 150,
  onDone,
}: Props) {
  const [font, setFont] = useState<opentype.Font | null>(null);
  const [lineData, setLineData] = useState<Line[]>([]);
  const [maxLineWidth, setMaxLineWidth] = useState(420);
  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const [activeGlyphIdx, setActiveGlyphIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load font once.
  useEffect(() => {
    loadFont().then(setFont).catch((e) => console.error("font load fail", e));
  }, []);

  // Build wrapped lines when font / source text / size changes — and on resize.
  useEffect(() => {
    if (!font) return;
    const rebuild = () => {
      const w = Math.max(200, (containerRef.current?.clientWidth ?? 420) - 8);
      setMaxLineWidth(w);
      setLineData(wrapLines(font, lines, fontSize, w));
    };
    rebuild();
    window.addEventListener("resize", rebuild);
    return () => window.removeEventListener("resize", rebuild);
  }, [font, lines, fontSize]);

  // Keep the active line + hand area above the bottom fade.
  useEffect(() => {
    const scroller =
      containerRef.current?.closest<HTMLElement>(".hw-scroll") ??
      (containerRef.current?.parentElement as HTMLElement | null);
    if (!scroller) return;
    const lineY = activeLineIdx * fontSize * lineGap;
    const ideal = Math.max(0, lineY - scroller.clientHeight * 0.6);
    const viewTop = scroller.scrollTop;
    const lineBottom = lineY + fontSize * 2.4;
    const safeBottom = viewTop + scroller.clientHeight * 0.72;
    if (lineBottom > safeBottom || lineY < viewTop) {
      scroller.scrollTo({ top: ideal, behavior: "smooth" });
    }
  }, [activeLineIdx, fontSize, lineGap]);

  // Drive per-glyph reveal with a human-feeling rhythm.
  useEffect(() => {
    if (!font || lineData.length === 0) return;
    if (activeLineIdx >= lineData.length) {
      onDone?.();
      return;
    }
    const line = lineData[activeLineIdx];

    if (line.blank) {
      const t = setTimeout(() => {
        setActiveLineIdx((i) => i + 1);
        setActiveGlyphIdx(0);
      }, 280);
      return () => clearTimeout(t);
    }

    if (activeGlyphIdx >= line.glyphs.length) {
      const t = setTimeout(() => {
        setActiveLineIdx((i) => i + 1);
        setActiveGlyphIdx(0);
      }, 380 + Math.random() * 220);
      return () => clearTimeout(t);
    }

    const prev = activeGlyphIdx > 0 ? line.glyphs[activeGlyphIdx - 1] : null;
    let delay = charDelay + (Math.random() - 0.3) * 70;
    if (prev?.isSpace) delay += 120 + Math.random() * 80;
    if (Math.random() < 0.07) delay += 180 + Math.random() * 220;
    delay = Math.max(40, delay);

    const t = setTimeout(() => setActiveGlyphIdx((i) => i + 1), delay);
    return () => clearTimeout(t);
  }, [font, lineData, activeLineIdx, activeGlyphIdx, charDelay, onDone]);

  if (!font) {
    return <div className="hw-loading">טוען כתב יד…</div>;
  }

  const svgW = maxLineWidth;
  const totalHeight = lineData.length * fontSize * lineGap + fontSize;
  const activeLine = lineData[activeLineIdx];
  const handPos = computeHandPos(activeLine, activeLineIdx, activeGlyphIdx, svgW, fontSize, lineGap);

  return (
    <div
      ref={containerRef}
      className="hw-canvas"
      style={{ position: "relative", width: "100%", height: totalHeight }}
    >
      <svg
        width="100%"
        height={totalHeight}
        viewBox={`0 0 ${svgW} ${totalHeight}`}
        preserveAspectRatio="xMidYMin meet"
        style={{
          overflow: "visible",
          direction: "ltr",
          display: "block",
          position: "relative",
          zIndex: 1,
          maxWidth: "100%",
          height: "auto",
        }}
      >
        {lineData.map((line, li) => {
          if (line.blank) return null;
          const isPast = li < activeLineIdx;
          const isActive = li === activeLineIdx;
          if (!isPast && !isActive) return null;
          const yOffset = li * fontSize * lineGap + fontSize;
          return (
            <g key={li} transform={`translate(${svgW}, ${yOffset})`}>
              {line.glyphs.map((g, gi) => {
                if (!g.d) return null;
                const revealed = isPast || (isActive && gi < activeGlyphIdx);
                const justAppeared = isActive && gi === activeGlyphIdx - 1;
                return (
                  <path
                    key={gi}
                    d={g.d}
                    transform={`translate(${-g.x - g.advance}, 0)`}
                    fill={revealed ? INK_DRY : INK_FRESH}
                    style={glyphStyle(revealed, justAppeared)}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      {activeLineIdx < lineData.length && (
        <div
          className="hw-hand"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translate(${handPos.x}px, ${handPos.y}px)`,
            transition: "transform 140ms cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <HandPen width={handWidth} />
        </div>
      )}
    </div>
  );
}

// ---------- styling helpers ----------
function glyphStyle(revealed: boolean, justAppeared: boolean): CSSProperties {
  return {
    opacity: revealed ? 1 : 0,
    filter: revealed ? "blur(0px)" : "blur(3px)",
    transition: justAppeared
      ? "opacity 380ms ease-out, filter 480ms ease-out, fill 600ms ease-out"
      : "none",
  };
}

function computeHandPos(
  line: Line | undefined,
  lineIdx: number,
  glyphIdx: number,
  svgW: number,
  fontSize: number,
  lineGap: number,
): { x: number; y: number } {
  const baseY = lineIdx * fontSize * lineGap + fontSize * 0.45;
  if (!line || line.blank || line.glyphs.length === 0) {
    return { x: svgW + 8, y: baseY };
  }
  const idx = Math.min(glyphIdx, line.glyphs.length - 1);
  const g = line.glyphs[idx];
  // Per-letter jitter — variable magnitude so movement feels alive.
  const seed = idx * 1.7;
  const mag = 0.6 + Math.abs(Math.sin(seed * 0.43)) * 0.8;
  const jx = (Math.sin(seed) * 8 + Math.cos(seed * 2.3) * 4) * mag;
  const jy = (Math.cos(seed) * 6 + Math.sin(seed * 1.7) * 3) * mag;
  return {
    x: svgW - g.x - g.advance * 1.15 + jx,
    y: baseY + jy,
  };
}

// ---------- hand+pen ----------
function HandPen({ width = 150 }: { width?: number }) {
  return (
    <div
      style={{
        position: "relative",
        animation: "hwWobble 2.2s ease-in-out infinite",
        transformOrigin: "0 0",
      }}
    >
      <img
        src={handPenUrl}
        alt=""
        draggable={false}
        style={{
          width: `${width}px`,
          height: "auto",
          display: "block",
          transformOrigin: "12px 10px",
          transform: "translate(-10px, -8px) rotate(-10deg)",
          filter: "sepia(0.14) saturate(0.95) contrast(1.04) brightness(1.02) blur(0.3px)",
          WebkitMaskImage:
            "linear-gradient(125deg, #000 0%, #000 78%, rgba(0,0,0,0.55) 90%, transparent 100%)",
          maskImage:
            "linear-gradient(125deg, #000 0%, #000 78%, rgba(0,0,0,0.55) 90%, transparent 100%)",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
      <style>{HAND_WOBBLE_KEYFRAMES}</style>
    </div>
  );
}

const HAND_WOBBLE_KEYFRAMES = `
@keyframes hwWobble {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25%      { transform: translate(0px, 1.2px) rotate(0.4deg); }
  50%      { transform: translate(-0.5px, -0.8px) rotate(-0.3deg); }
  75%      { transform: translate(0.5px, 0.6px) rotate(0.25deg); }
}
`;
