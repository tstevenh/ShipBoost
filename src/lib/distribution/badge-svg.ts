export type BadgeTheme = "light" | "dark";

// The founder badge artwork (featured-light.svg / featured-dark.svg) is authored
// at this viewBox. We nest the artwork unchanged and append a live count panel so
// the whole thing reads as one Product-Hunt-style pill — the count is INSIDE the
// badge, not a separate image.
const ARTWORK_VIEWBOX = "0 0 282 93.119995";

const THEME = {
  light: {
    outerBg: "#FFFFFF",
    border: "#E5E5E5",
    divider: "#E5E5E5",
    fg: "#0A0A0A",
    muted: "#71717A",
  },
  dark: {
    outerBg: "#0A0A0A",
    border: "#0A0A0A",
    divider: "#27272A",
    fg: "#FAFAFA",
    muted: "#A1A1AA",
  },
} as const;

const ARTWORK_WIDTH = 170;
const COUNT_WIDTH = 74;
const HEIGHT = 56;
const RADIUS = 12;
export const BADGE_WIDTH = ARTWORK_WIDTH + COUNT_WIDTH;
export const BADGE_HEIGHT = HEIGHT;

/** Return the inner markup of an `<svg>…</svg>` document (everything between the root tags). */
export function extractSvgInner(svg: string): string {
  const open = svg.indexOf(">", svg.indexOf("<svg")) + 1;
  const end = svg.lastIndexOf("</svg>");
  if (open <= 0 || end < 0) return svg;
  return svg.slice(open, end);
}

export type BuildBadgeInput = {
  count: number;
  theme: BadgeTheme;
  /** Inner markup of the theme's featured-*.svg artwork (use {@link extractSvgInner}). */
  artworkInner: string;
};

export function buildBadgeSvg({ count, theme, artworkInner }: BuildBadgeInput): string {
  const c = THEME[theme];
  const safe = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  const countCenter = ARTWORK_WIDTH + COUNT_WIDTH / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${BADGE_WIDTH}" height="${HEIGHT}" viewBox="0 0 ${BADGE_WIDTH} ${HEIGHT}" role="img" aria-label="Featured on ShipBoost — ${safe} upvotes">
  <rect x="0.5" y="0.5" width="${BADGE_WIDTH - 1}" height="${HEIGHT - 1}" rx="${RADIUS}" fill="${c.outerBg}" stroke="${c.border}"/>
  <svg x="6" y="0" width="${ARTWORK_WIDTH}" height="${HEIGHT}" viewBox="${ARTWORK_VIEWBOX}" preserveAspectRatio="xMidYMid meet">${artworkInner}</svg>
  <line x1="${ARTWORK_WIDTH}" y1="13" x2="${ARTWORK_WIDTH}" y2="${HEIGHT - 13}" stroke="${c.divider}" stroke-width="1"/>
  <g font-family="Manrope,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" text-anchor="middle">
    <text x="${countCenter}" y="27" fill="${c.fg}" font-size="20" font-weight="800">▲ <tspan>${safe}</tspan></text>
    <text x="${countCenter}" y="41" fill="${c.muted}" font-size="9" font-weight="600" letter-spacing="1">UPVOTES</text>
  </g>
</svg>`;
}
