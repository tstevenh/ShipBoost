import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { getCachedToolPage } from "@/server/cache/public-content";
import { getToolUpvoteCount } from "@/server/services/upvote-service";

export const alt = "Launching on ShipBoost";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type OgContext = {
  params: Promise<{ slug: string }>;
};

// White logo mark, inlined so ImageResponse needs no network fetch.
const logoDataUrl = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public/logo/white-logo.png"),
).toString("base64")}`;

export default async function Image(context: OgContext) {
  const { slug } = await context.params;
  const toolPage = await getCachedToolPage(slug);
  const tool = toolPage?.tool;

  const name = tool?.name ?? "A new product";
  const tagline = tool?.tagline ?? "";
  const count = tool ? await getToolUpvoteCount(tool.id) : 0;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0A0A0A",
          color: "#FAFAFA",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <img src={logoDataUrl} width={44} height={44} alt="" />
          <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "0.5px" }}>
            Launching on ShipBoost
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.04 }}>{name}</div>
          {tagline ? (
            <div style={{ fontSize: 34, color: "#A1A1AA", maxWidth: 1000 }}>{tagline}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: 30, fontWeight: 700 }}>
          <span>▲ {count}</span>
          <span style={{ color: "#A1A1AA", fontWeight: 600 }}>upvotes — vote now</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
