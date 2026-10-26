import type { PreviewSpec } from "@/lib/catalog/types";

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function prng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A generated, decorative preview image. Not a screenshot of the project. */
export function ProjectArt({ seed, preview, className = "", showGlyph = true }: { seed: string; preview: PreviewSpec; className?: string; showGlyph?: boolean }) {
  const rand = prng(hashString(seed));
  const { hue, pattern, glyph } = preview;
  const c1 = `hsl(${hue} 75% 62%)`;
  const c2 = `hsl(${(hue + 40) % 360} 80% 70%)`;
  const c3 = `hsl(${(hue + 320) % 360} 70% 45%)`;
  const bg = `hsl(${hue} 70% 96%)`;
  const id = `g-${hashString(seed).toString(36)}`;
  const shapes: React.ReactNode[] = [];

  switch (pattern) {
    case "flow":
      for (let i = 0; i < 9; i++) {
        const y = 20 + i * 18;
        const a = 8 + rand() * 18;
        shapes.push(
          <path key={i} d={`M -10 ${y} C 80 ${y - a}, 160 ${y + a}, 330 ${y - a / 2}`} fill="none" stroke={i % 2 ? c1 : c2} strokeWidth={3 + rand() * 4} strokeLinecap="round" opacity={0.75} />,
        );
      }
      break;
    case "dots":
      for (let x = 0; x < 14; x++)
        for (let y = 0; y < 8; y++) {
          const r = 2 + rand() * 7;
          shapes.push(<circle key={`${x}-${y}`} cx={12 + x * 23} cy={14 + y * 23} r={r} fill={rand() > 0.6 ? c3 : c1} opacity={0.4 + rand() * 0.5} />);
        }
      break;
    case "rings":
      for (let i = 0; i < 7; i++)
        shapes.push(<circle key={i} cx={210 + rand() * 40} cy={90 + rand() * 20} r={18 + i * 20} fill="none" stroke={i % 2 ? c1 : c3} strokeWidth={4 + rand() * 5} opacity={0.55} />);
      break;
    case "bars":
      for (let i = 0; i < 11; i++) {
        const h = 30 + rand() * 120;
        shapes.push(<rect key={i} x={18 + i * 27} y={180 - h} width={18} height={h} rx={5} fill={i % 3 === 0 ? c3 : c1} opacity={0.8} />);
      }
      break;
    case "blobs":
      for (let i = 0; i < 6; i++)
        shapes.push(<ellipse key={i} cx={rand() * 320} cy={rand() * 180} rx={40 + rand() * 70} ry={30 + rand() * 50} fill={[c1, c2, c3][i % 3]} opacity={0.55} />);
      break;
    case "grid":
      for (let x = 0; x < 9; x++)
        for (let y = 0; y < 5; y++) {
          if (rand() > 0.55) continue;
          shapes.push(<rect key={`${x}-${y}`} x={10 + x * 35} y={10 + y * 35} width={28} height={28} rx={7} fill={rand() > 0.7 ? c3 : c1} opacity={0.35 + rand() * 0.5} />);
        }
      break;
    case "stripes":
      for (let i = 0; i < 12; i++)
        shapes.push(<rect key={i} x={-40 + i * 34} y={-20} width={16 + rand() * 10} height={240} fill={i % 2 ? c1 : c2} opacity={0.5} transform="rotate(18 160 90)" />);
      break;
  }

  return (
    <svg viewBox="0 0 320 180" className={className} role="presentation" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bg} />
          <stop offset="1" stopColor={`hsl(${(hue + 30) % 360} 70% 90%)`} />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id})`} />
      {shapes}
      {showGlyph && (
        <g>
          <circle cx="44" cy="136" r="26" fill="white" opacity="0.92" />
          <text x="44" y="145" textAnchor="middle" fontSize="24" fontWeight="700" fill={c3}>
            {glyph}
          </text>
        </g>
      )}
    </svg>
  );
}
