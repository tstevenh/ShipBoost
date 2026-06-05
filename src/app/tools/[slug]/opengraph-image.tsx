import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { getCachedToolPage } from "@/server/cache/public-content";

export const alt = "Launching on ShipBoost";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type OgContext = {
  params: Promise<{ slug: string }>;
};

// Black logo mark, inlined (sits inside a white rounded square, matching the
// homepage OG lockup). No network fetch at render time.
const logoDataUrl = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public/logo/black-logo.png"),
).toString("base64")}`;

const GRID = "#1c1c1f";

// Decorative corner grid lines, matching the homepage OG image.
function gridLines(corner: "tl" | "br") {
  const anchor =
    corner === "tl" ? { top: 0, left: 0 } : { bottom: 0, right: 0 };
  const offsets = [56, 104, 152];
  return (
    <div style={{ position: "absolute", display: "flex", ...anchor }}>
      {offsets.map((o) => (
        <div
          key={`v${o}`}
          style={{
            position: "absolute",
            ...anchor,
            [corner === "tl" ? "left" : "right"]: o,
            width: 1,
            height: 220,
            backgroundColor: GRID,
          }}
        />
      ))}
      {offsets.map((o) => (
        <div
          key={`h${o}`}
          style={{
            position: "absolute",
            ...anchor,
            [corner === "tl" ? "top" : "bottom"]: o,
            height: 1,
            width: 220,
            backgroundColor: GRID,
          }}
        />
      ))}
    </div>
  );
}

export default async function Image(context: OgContext) {
  const { slug } = await context.params;
  const toolPage = await getCachedToolPage(slug);
  const tool = toolPage?.tool;

  const name = tool?.name ?? "A new product";
  const tagline = tool?.tagline ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          backgroundColor: "#0A0A0A",
          color: "#FAFAFA",
          padding: "80px 96px",
          fontFamily: "sans-serif",
          textAlign: "center",
        }}
      >
        {gridLines("tl")}
        {gridLines("br")}

        {/* Logo lockup — white rounded square + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: "#FFFFFF",
            }}
          >
            <img src={logoDataUrl} width={40} height={40} alt="" />
          </div>
          <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.5px" }}>ShipBoost</span>
        </div>

        {/* Eyebrow + name + tagline */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "3px",
              color: "#71717A",
            }}
          >
            LAUNCHING ON SHIPBOOST
          </span>
          <div style={{ display: "flex", fontSize: 82, fontWeight: 800, lineHeight: 1.02, maxWidth: 1000 }}>
            {name}
          </div>
          {tagline ? (
            <div style={{ display: "flex", fontSize: 32, color: "#A1A1AA", maxWidth: 880 }}>
              {tagline}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size },
  );
}
