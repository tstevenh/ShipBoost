import { describe, expect, it } from "vitest";

import {
  domainsMatchForClaim,
  getEmailDomain,
  getWebsiteDomain,
} from "@/server/services/claim-domain";

describe("claim-domain", () => {
  it("extracts root email domains", () => {
    expect(getEmailDomain("founder@acme.com")).toBe("acme.com");
  });

  it("extracts normalized website domains", () => {
    expect(getWebsiteDomain("https://www.acme.com/pricing")).toBe("acme.com");
  });

  it("matches root email to app subdomain website", () => {
    expect(domainsMatchForClaim("founder@acme.com", "https://app.acme.com")).toBe(
      true,
    );
  });

  it("matches subdomain email to root website", () => {
    expect(domainsMatchForClaim("ops@app.acme.com", "https://acme.com")).toBe(
      true,
    );
  });

  it("rejects unrelated domains", () => {
    expect(domainsMatchForClaim("founder@acme.com", "https://other.com")).toBe(
      false,
    );
  });
});
