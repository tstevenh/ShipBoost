import { describe, expect, it } from "vitest";

import {
  readSponsorSlotParam,
  shouldAutoOpenSponsorModal,
} from "@/components/public/sponsor-advertise-modal";

describe("sponsor-advertise-modal URL targeting", () => {
  it("defaults legacy advertise URLs to the sidebar modal only", () => {
    const params = new URLSearchParams("advertise=1");

    expect(shouldAutoOpenSponsorModal("SIDEBAR", params)).toBe(true);
    expect(shouldAutoOpenSponsorModal("INLINE_BANNER", params)).toBe(false);
    expect(shouldAutoOpenSponsorModal("INLINE_PRODUCT", params)).toBe(false);
  });

  it("opens only the requested advertise slot", () => {
    const params = new URLSearchParams(
      "advertise=1&advertise_slot=INLINE_PRODUCT",
    );

    expect(shouldAutoOpenSponsorModal("SIDEBAR", params)).toBe(false);
    expect(shouldAutoOpenSponsorModal("INLINE_BANNER", params)).toBe(false);
    expect(shouldAutoOpenSponsorModal("INLINE_PRODUCT", params)).toBe(true);
  });

  it("opens only the paid placement slot on sponsor return", () => {
    const params = new URLSearchParams(
      "sponsor=success&placement_slot=INLINE_BANNER",
    );

    expect(shouldAutoOpenSponsorModal("SIDEBAR", params)).toBe(false);
    expect(shouldAutoOpenSponsorModal("INLINE_BANNER", params)).toBe(true);
    expect(shouldAutoOpenSponsorModal("INLINE_PRODUCT", params)).toBe(false);
  });

  it("ignores invalid slot values", () => {
    expect(readSponsorSlotParam("NOPE")).toBeNull();
    expect(readSponsorSlotParam("SIDEBAR")).toBe("SIDEBAR");
  });
});
