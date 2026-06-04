/**
 * Deterministic gradient poster for uploads without a captured frame.
 */

const PALETTES: ReadonlyArray<readonly [string, string]> = [
  ["#7c3aed", "#2563eb"],
  ["#db2777", "#7c3aed"],
  ["#0891b2", "#4f46e5"],
  ["#ea580c", "#db2777"],
  ["#059669", "#0891b2"],
  ["#4f46e5", "#0ea5e9"],
];

function pickPalette(seed: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length];
}

/** Inline SVG data URL usable directly in `<img src>`. */
export function gradientThumbnail(seed: string, label?: string): string {
  const [from, to] = pickPalette(seed);
  const initials = (label ?? "")
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#g)"/>
  <circle cx="520" cy="80" r="140" fill="#ffffff" opacity="0.08"/>
  <circle cx="120" cy="300" r="110" fill="#000000" opacity="0.10"/>
  <text x="50%" y="52%" text-anchor="middle" font-family="system-ui,sans-serif" font-size="120" font-weight="700" fill="#ffffff" opacity="0.92">${initials}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
