export type BadgeTheme = "light" | "dark";

export type CountChipInput = {
  count: number;
  theme: BadgeTheme;
};

const THEME = {
  light: { bg: "#FFFFFF", border: "#E5E5E5", fg: "#0A0A0A", muted: "#71717A" },
  dark: { bg: "#111111", border: "#27272A", fg: "#FAFAFA", muted: "#A1A1AA" },
} as const;

export function buildCountChipSvg({ count, theme }: CountChipInput): string {
  const c = THEME[theme];
  const safeCount = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  const width = 92;
  const height = 40;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="${safeCount} upvotes on ShipBoost">
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="8" fill="${c.bg}" stroke="${c.border}"/>
  <g font-family="Manrope,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" text-anchor="middle">
    <text x="${width / 2}" y="20" fill="${c.fg}" font-size="16" font-weight="700">▲ <tspan>${safeCount}</tspan></text>
    <text x="${width / 2}" y="32" fill="${c.muted}" font-size="9" font-weight="600" letter-spacing="0.5">upvotes</text>
  </g>
</svg>`;
}
