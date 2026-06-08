import { describe, expect, it } from "vitest";

import { buildBadgeSvg, extractSvgInner } from "./badge-svg";

const ARTWORK = `<g id="logo"></g>`;

describe("extractSvgInner", () => {
  it("returns the markup between the root <svg> tags", () => {
    const doc = `<svg xmlns="x" width="10"><g id="a"></g></svg>`;
    expect(extractSvgInner(doc)).toBe(`<g id="a"></g>`);
  });
});

describe("buildBadgeSvg", () => {
  it("embeds the artwork, the count, and the UPVOTES label in one svg", () => {
    const svg = buildBadgeSvg({ count: 128, theme: "dark", artworkInner: ARTWORK });
    expect(svg).toContain("<svg");
    expect(svg).toContain(ARTWORK); // artwork nested unchanged
    expect(svg).toContain("128");
    expect(svg).toContain("UPVOTES");
    expect(svg.trim().endsWith("</svg>")).toBe(true);
  });

  it("uses dark vs light theme colors", () => {
    expect(buildBadgeSvg({ count: 1, theme: "dark", artworkInner: ARTWORK })).toContain("#0A0A0A");
    expect(buildBadgeSvg({ count: 1, theme: "light", artworkInner: ARTWORK })).toContain("#FFFFFF");
  });

  it("floors and clamps the count to a non-negative integer", () => {
    expect(buildBadgeSvg({ count: -5, theme: "dark", artworkInner: ARTWORK })).toContain(">0</tspan>");
    expect(buildBadgeSvg({ count: 7.9, theme: "dark", artworkInner: ARTWORK })).toContain(">7</tspan>");
  });
});
