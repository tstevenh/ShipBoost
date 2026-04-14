import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, resendInstance, emailMock, envMock } = vi.hoisted(() => ({
  prismaMock: {
    lead: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  resendInstance: {
    contacts: {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      segments: {
        list: vi.fn(),
        add: vi.fn(),
      },
    },
  },
  emailMock: {},
  envMock: {
    RESEND_API_KEY: "re_test",
    RESEND_LEADS_SEGMENT_ID: "segment_1",
  } as {
    RESEND_API_KEY?: string;
    RESEND_LEADS_SEGMENT_ID?: string;
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("resend", () => ({
  Resend: vi.fn(() => resendInstance),
}));

vi.mock("@/server/email/transactional", () => emailMock);

vi.mock("@/server/env", () => ({
  getEnv: () => envMock,
}));

import { captureLead } from "@/server/services/lead-service";

describe("captureLead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new active lead", async () => {
    prismaMock.lead.findUnique.mockResolvedValueOnce(null);
    prismaMock.lead.create.mockResolvedValueOnce({
      id: "lead_1",
      email: "founder@example.com",
      status: "ACTIVE",
      source: "homepage_directory_list",
      leadMagnet: "startup-directories-800",
      consentedAt: new Date(),
      firstSubscribedAt: new Date(),
      lastSubmittedAt: new Date(),
      resendContactId: null,
      name: null,
      utmSource: "twitter",
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    resendInstance.contacts.get.mockResolvedValueOnce({ data: null, error: null });
    resendInstance.contacts.create.mockResolvedValueOnce({
      data: { id: "contact_1" },
      error: null,
    });
    prismaMock.lead.update.mockResolvedValueOnce({
      id: "lead_1",
      email: "founder@example.com",
      status: "ACTIVE",
      source: "homepage_directory_list",
      leadMagnet: "startup-directories-800",
      consentedAt: new Date(),
      firstSubscribedAt: new Date(),
      lastSubmittedAt: new Date(),
      resendContactId: "contact_1",
      name: null,
      utmSource: "twitter",
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await captureLead({
      email: "Founder@Example.com",
      source: "homepage_directory_list",
      leadMagnet: "startup-directories-800",
      name: undefined,
      utmSource: "twitter",
      utmMedium: undefined,
      utmCampaign: undefined,
      utmContent: undefined,
      utmTerm: undefined,
    });

    expect(prismaMock.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "founder@example.com",
        }),
      }),
    );
    expect(resendInstance.contacts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "founder@example.com",
        segments: [{ id: "segment_1" }],
      }),
    );
    expect(result.created).toBe(true);
    expect(result.lead.email).toBe("founder@example.com");
  });

  it("updates an existing lead instead of duplicating it", async () => {
    prismaMock.lead.findUnique.mockResolvedValueOnce({
      id: "lead_1",
      email: "founder@example.com",
      status: "ACTIVE",
      source: "homepage_directory_list",
      leadMagnet: "startup-directories-800",
      consentedAt: new Date("2026-04-01T00:00:00.000Z"),
      firstSubscribedAt: new Date("2026-04-01T00:00:00.000Z"),
      lastSubmittedAt: new Date("2026-04-01T00:00:00.000Z"),
      resendContactId: "contact_1",
      name: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.lead.update
      .mockResolvedValueOnce({
        id: "lead_1",
        email: "founder@example.com",
        status: "ACTIVE",
        source: "homepage_directory_list",
        leadMagnet: "startup-directories-800",
        consentedAt: new Date("2026-04-01T00:00:00.000Z"),
        firstSubscribedAt: new Date("2026-04-01T00:00:00.000Z"),
        lastSubmittedAt: new Date(),
        resendContactId: "contact_1",
        name: null,
        utmSource: "twitter",
        utmMedium: null,
        utmCampaign: null,
        utmContent: null,
        utmTerm: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        id: "lead_1",
        email: "founder@example.com",
        status: "ACTIVE",
        source: "homepage_directory_list",
        leadMagnet: "startup-directories-800",
        consentedAt: new Date("2026-04-01T00:00:00.000Z"),
        firstSubscribedAt: new Date("2026-04-01T00:00:00.000Z"),
        lastSubmittedAt: new Date(),
        resendContactId: "contact_1",
        name: null,
        utmSource: "twitter",
        utmMedium: null,
        utmCampaign: null,
        utmContent: null,
        utmTerm: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    resendInstance.contacts.update.mockResolvedValueOnce({
      data: { id: "contact_1" },
      error: null,
    });
    resendInstance.contacts.segments.list.mockResolvedValueOnce({
      data: {
        object: "list",
        data: [],
        has_more: false,
      },
      error: null,
    });
    resendInstance.contacts.segments.add.mockResolvedValueOnce({
      data: { id: "segment_1" },
      error: null,
    });

    const result = await captureLead({
      email: "founder@example.com",
      source: "homepage_directory_list",
      leadMagnet: "startup-directories-800",
      name: undefined,
      utmSource: "twitter",
      utmMedium: undefined,
      utmCampaign: undefined,
      utmContent: undefined,
      utmTerm: undefined,
    });

    expect(prismaMock.lead.create).not.toHaveBeenCalled();
    expect(prismaMock.lead.update).toHaveBeenCalled();
    expect(resendInstance.contacts.segments.list).toHaveBeenCalledWith({
      contactId: "contact_1",
    });
    expect(resendInstance.contacts.segments.add).toHaveBeenCalledWith({
      contactId: "contact_1",
      segmentId: "segment_1",
    });
    expect(result.created).toBe(false);
  });

  it("still succeeds when resend is not configured", async () => {
    envMock.RESEND_API_KEY = undefined;
    prismaMock.lead.findUnique.mockResolvedValueOnce(null);
    prismaMock.lead.create.mockResolvedValueOnce({
      id: "lead_2",
      email: "solo@example.com",
      status: "ACTIVE",
      source: "homepage_directory_list",
      leadMagnet: "startup-directories-800",
      consentedAt: new Date(),
      firstSubscribedAt: new Date(),
      lastSubmittedAt: new Date(),
      resendContactId: null,
      name: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await captureLead({
      email: "solo@example.com",
      source: "homepage_directory_list",
      leadMagnet: "startup-directories-800",
      name: undefined,
      utmSource: undefined,
      utmMedium: undefined,
      utmCampaign: undefined,
      utmContent: undefined,
      utmTerm: undefined,
    });

    expect(result.created).toBe(true);
    expect(resendInstance.contacts.create).not.toHaveBeenCalled();
    envMock.RESEND_API_KEY = "re_test";
    envMock.RESEND_LEADS_SEGMENT_ID = "segment_1";
  });
});
