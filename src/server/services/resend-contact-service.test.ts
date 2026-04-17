import { beforeEach, describe, expect, it, vi } from "vitest";

const { resendInstance, envMock } = vi.hoisted(() => ({
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
  envMock: {
    RESEND_API_KEY: "re_test",
    RESEND_SIGNUP_SEGMENT_ID: "segment_signup",
  } as {
    RESEND_API_KEY?: string;
    RESEND_SIGNUP_SEGMENT_ID?: string;
  },
}));

vi.mock("resend", () => ({
  Resend: vi.fn(() => resendInstance),
}));

vi.mock("@/server/env", () => ({
  getEnv: () => envMock,
}));

import {
  syncSignupContactToResend,
  upsertResendContact,
} from "@/server/services/resend-contact-service";

describe("resend contact sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new contact with a segment", async () => {
    resendInstance.contacts.get.mockResolvedValueOnce({
      data: null,
      error: { statusCode: 404, message: "Contact not found", name: "not_found" },
    });
    resendInstance.contacts.create.mockResolvedValueOnce({
      data: { id: "contact_1" },
      error: null,
    });

    const contactId = await upsertResendContact({
      email: "founder@example.com",
      name: "Alex Founder",
      segmentId: "segment_lead",
    });

    expect(resendInstance.contacts.create).toHaveBeenCalledWith({
      email: "founder@example.com",
      firstName: "Alex",
      lastName: "Founder",
      unsubscribed: false,
      segments: [{ id: "segment_lead" }],
    });
    expect(contactId).toBe("contact_1");
  });

  it("adds an existing contact into a missing segment", async () => {
    resendInstance.contacts.get.mockResolvedValueOnce({
      data: { id: "contact_1" },
      error: null,
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
      data: { id: "segment_signup" },
      error: null,
    });

    const contactId = await syncSignupContactToResend({
      email: "founder@example.com",
      name: "Founder",
    });

    expect(resendInstance.contacts.update).toHaveBeenCalledWith({
      id: "contact_1",
      firstName: "Founder",
      lastName: undefined,
      unsubscribed: false,
    });
    expect(resendInstance.contacts.segments.add).toHaveBeenCalledWith({
      contactId: "contact_1",
      segmentId: "segment_signup",
    });
    expect(contactId).toBe("contact_1");
  });

  it("skips syncing when resend is not configured", async () => {
    envMock.RESEND_API_KEY = undefined;

    const contactId = await upsertResendContact({
      email: "founder@example.com",
      name: "Founder",
      segmentId: "segment_lead",
    });

    expect(contactId).toBeNull();
    expect(resendInstance.contacts.get).not.toHaveBeenCalled();

    envMock.RESEND_API_KEY = "re_test";
  });
});
