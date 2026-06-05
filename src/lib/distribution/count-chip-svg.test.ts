import { describe, expect, it } from "vitest";
import { buildCountChipSvg } from "./count-chip-svg";

describe("buildCountChipSvg", () => {
  it("renders the upvote count and the word upvotes", () => {
    const svg = buildCountChipSvg({ count: 42, theme: "dark" });
    expect(svg).toContain("<svg");
    expect(svg).toContain("42");
    expect(svg.toLowerCase()).toContain("upvotes");
    expect(svg.trim().endsWith("</svg>")).toBe(true);
  });

  it("uses dark-theme colors for theme=dark and light-theme colors for theme=light", () => {
    expect(buildCountChipSvg({ count: 1, theme: "dark" })).toContain("#111111");
    expect(buildCountChipSvg({ count: 1, theme: "light" })).toContain("#FFFFFF");
  });

  it("floors and clamps the count to a non-negative integer", () => {
    expect(buildCountChipSvg({ count: -5, theme: "dark" })).toContain(">0<");
    expect(buildCountChipSvg({ count: 7.9, theme: "dark" })).toContain(">7<");
  });
});
