import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  findActiveScheduledLaunch,
  findPublishedLaunch,
  getPremiumLaunchMonthIndexForDate,
  groupPremiumLaunchWeeksByMonth,
  SubmitProductForm,
} from "@/components/founder/submit-product-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

type TestDraft = NonNullable<Parameters<typeof findActiveScheduledLaunch>[0]>;

const categories = [
  {
    id: "category_1",
    name: "Productivity",
    slug: "productivity",
    description: null,
  },
];

const tags = [
  {
    id: "tag_1",
    name: "AI",
    slug: "ai",
    description: null,
  },
  {
    id: "tag_2",
    name: "Automation",
    slug: "automation",
    description: null,
  },
];

function renderSubmitProductForm(mode: "submission" | "listing-edit" = "submission") {
  return render(
    <SubmitProductForm
      mode={mode}
      categories={categories}
      tags={tags}
      appUrl="https://shipboost.test"
      supportEmail="support@shipboost.test"
      premiumLaunchWeeks={[]}
      initialDraft={{
        id: "submission_1",
        submissionType: "FREE_LAUNCH",
        reviewStatus: "DRAFT",
        paymentStatus: "NOT_REQUIRED",
        badgeVerification: "PENDING",
        preferredLaunchDate: null,
        tool: {
          id: "tool_1",
          slug: "acme",
          name: "Acme",
          tagline: "Ship products faster",
          websiteUrl: "https://acme.test",
          richDescription: "A product that helps teams ship better launch pages.",
          pricingModel: "FREE",
          affiliateUrl: null,
          affiliateSource: null,
          hasAffiliateProgram: false,
          founderXUrl: null,
          founderGithubUrl: null,
          founderLinkedinUrl: null,
          founderFacebookUrl: null,
          logoMedia: {
            url: "https://cdn.test/logo.png",
            publicId: "logo",
            format: "png",
            width: 128,
            height: 128,
          },
          screenshots: [],
          categoryIds: ["category_1"],
          tagIds: ["tag_1"],
          launches: [],
        },
      }}
    />,
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:preview"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
});

describe("submit-product-form scheduling helpers", () => {
  it("groups premium launch weeks by UTC month for calendar navigation", () => {
    const months = groupPremiumLaunchWeeksByMonth([
      { value: "2026-05-04", label: "Week of May 4, 2026" },
      { value: "2026-05-11", label: "Week of May 11, 2026" },
      { value: "2026-06-01", label: "Week of June 1, 2026" },
    ]);

    expect(months).toEqual([
      {
        key: "2026-05",
        label: "May 2026",
        weeks: [
          { value: "2026-05-04", label: "Week of May 4, 2026" },
          { value: "2026-05-11", label: "Week of May 11, 2026" },
        ],
      },
      {
        key: "2026-06",
        label: "June 2026",
        weeks: [{ value: "2026-06-01", label: "Week of June 1, 2026" }],
      },
    ]);
  });

  it("opens the calendar on the selected premium launch month", () => {
    const months = groupPremiumLaunchWeeksByMonth([
      { value: "2026-05-04", label: "Week of May 4, 2026" },
      { value: "2027-01-04", label: "Week of January 4, 2027" },
    ]);

    expect(getPremiumLaunchMonthIndexForDate(months, "2027-01-04")).toBe(1);
    expect(getPremiumLaunchMonthIndexForDate(months, "2028-01-03")).toBe(0);
  });

  it("does not treat already-launched approved launches as scheduled", () => {
    const draft: TestDraft = {
      id: "submission_1",
      submissionType: "FREE_LAUNCH",
      reviewStatus: "APPROVED",
      paymentStatus: "NOT_REQUIRED",
      badgeVerification: "VERIFIED",
      preferredLaunchDate: "2026-05-04T00:00:00.000Z",
      tool: {
        id: "tool_1",
        slug: "launched-tool",
        name: "Launched Tool",
        tagline: "Already launched",
        websiteUrl: "https://example.com",
        richDescription: "A launched product.",
        pricingModel: "FREE",
        affiliateUrl: null,
        affiliateSource: null,
        hasAffiliateProgram: false,
        founderXUrl: null,
        founderGithubUrl: null,
        founderLinkedinUrl: null,
        founderFacebookUrl: null,
        logoMedia: null,
        screenshots: [],
        categoryIds: [],
        tagIds: [],
        launches: [
          {
            id: "launch_1",
            launchType: "FREE",
            status: "APPROVED",
            launchDate: "2026-05-04T00:00:00.000Z",
          },
        ],
      },
    };

    const now = new Date("2026-05-16T00:00:00.000Z");

    expect(findActiveScheduledLaunch(draft, now)).toBeNull();
    expect(findPublishedLaunch(draft, now)?.id).toBe("launch_1");
  });

  it("keeps future approved launches in the scheduled state", () => {
    const draft: TestDraft = {
      id: "submission_1",
      submissionType: "FREE_LAUNCH",
      reviewStatus: "APPROVED",
      paymentStatus: "NOT_REQUIRED",
      badgeVerification: "VERIFIED",
      preferredLaunchDate: "2026-05-25T00:00:00.000Z",
      tool: {
        id: "tool_1",
        slug: "scheduled-tool",
        name: "Scheduled Tool",
        tagline: "Launching soon",
        websiteUrl: "https://example.com",
        richDescription: "A scheduled product.",
        pricingModel: "FREE",
        affiliateUrl: null,
        affiliateSource: null,
        hasAffiliateProgram: false,
        founderXUrl: null,
        founderGithubUrl: null,
        founderLinkedinUrl: null,
        founderFacebookUrl: null,
        logoMedia: null,
        screenshots: [],
        categoryIds: [],
        tagIds: [],
        launches: [
          {
            id: "launch_1",
            launchType: "FREE",
            status: "APPROVED",
            launchDate: "2026-05-25T00:00:00.000Z",
          },
        ],
      },
    };

    const now = new Date("2026-05-16T00:00:00.000Z");

    expect(findActiveScheduledLaunch(draft, now)?.id).toBe("launch_1");
    expect(findPublishedLaunch(draft, now)).toBeNull();
  });

  it("does not treat an unpaid premium launch date as scheduled", () => {
    const draft: TestDraft = {
      id: "submission_1",
      submissionType: "FEATURED_LAUNCH",
      reviewStatus: "PENDING",
      paymentStatus: "PENDING",
      badgeVerification: "NOT_REQUIRED",
      preferredLaunchDate: "2026-05-25T00:00:00.000Z",
      tool: {
        id: "tool_1",
        slug: "premium-tool",
        name: "Premium Tool",
        tagline: "Launching soon",
        websiteUrl: "https://example.com",
        richDescription: "A premium product awaiting payment.",
        pricingModel: "FREE",
        affiliateUrl: null,
        affiliateSource: null,
        hasAffiliateProgram: false,
        founderXUrl: null,
        founderGithubUrl: null,
        founderLinkedinUrl: null,
        founderFacebookUrl: null,
        logoMedia: null,
        screenshots: [],
        categoryIds: [],
        tagIds: [],
        launches: [],
      },
    };

    const now = new Date("2026-05-16T00:00:00.000Z");

    expect(findActiveScheduledLaunch(draft, now)).toBeNull();
  });
});

describe("SubmitProductForm", () => {
  it("removes a selected tag from the visible tag chip", () => {
    renderSubmitProductForm();

    fireEvent.click(screen.getByRole("button", { name: "Remove AI tag" }));

    expect(
      screen.queryByRole("button", { name: "Remove AI tag" }),
    ).not.toBeInTheDocument();
  });

  it("saves approved listing edits through the founder listing endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: "tool_1",
          slug: "acme",
          logoMedia: {
            id: "logo_media_1",
            url: "https://cdn.test/logo.png",
            format: "png",
            width: 128,
            height: 128,
          },
          screenshots: [],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderSubmitProductForm("listing-edit");

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/founder/tools/tool_1",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/submissions",
      expect.anything(),
    );
  });

  it("does not overwrite text typed while autosave is in flight", async () => {
    vi.useFakeTimers();

    let resolveFirstSave!: (value: Response) => void;
    const listingResponse = {
      ok: true,
      json: async () => ({
        data: {
          id: "tool_1",
          slug: "acme",
          logoMedia: {
            id: "logo_media_1",
            url: "https://cdn.test/logo.png",
            format: "png",
            width: 128,
            height: 128,
          },
          screenshots: [],
        },
      }),
    } as Response;
    const firstSaveRequest = new Promise<Response>((resolve) => {
      resolveFirstSave = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => firstSaveRequest)
      .mockResolvedValue(listingResponse);
    vi.stubGlobal("fetch", fetchMock);

    try {
      renderSubmitProductForm("listing-edit");

      await act(async () => {
        fireEvent.change(screen.getByDisplayValue("Acme"), {
          target: { value: "te" },
        });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(800);
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        fireEvent.change(screen.getByDisplayValue("te"), {
          target: { value: "test" },
        });
      });
      await act(async () => {
        resolveFirstSave(listingResponse);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      const secondPayload = JSON.parse(fetchMock.mock.calls[1]?.[1]?.body as string);

      expect(secondPayload.name).toBe("test");
      expect(screen.getByDisplayValue("test")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("adds dropped product images to the screenshots preview", () => {
    renderSubmitProductForm();
    fireEvent.click(screen.getByRole("button", { name: /Media/i }));

    const dropTarget = screen.getByText("Upload product images").closest("label");
    expect(dropTarget).not.toBeNull();

    fireEvent.drop(dropTarget as HTMLElement, {
      dataTransfer: {
        files: [new File(["image"], "screenshot.png", { type: "image/png" })],
      },
    });

    expect(screen.getByAltText("Screenshot preview")).toBeInTheDocument();
  });
});
