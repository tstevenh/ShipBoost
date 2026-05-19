import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FounderToolEditor } from "@/components/founder/founder-tool-editor";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

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

function renderFounderToolEditor() {
  return render(
    <FounderToolEditor
      categories={categories}
      tags={tags}
      tool={{
        id: "tool_1",
        slug: "acme",
        name: "Acme",
        tagline: "Ship products faster",
        websiteUrl: "https://acme.test",
        richDescription: "A product that helps teams ship better launch pages.",
        pricingModel: "FREE",
        hasAffiliateProgram: false,
        founderXUrl: null,
        founderGithubUrl: null,
        founderLinkedinUrl: null,
        founderFacebookUrl: null,
        logoMedia: null,
        screenshots: [],
        toolCategories: [{ categoryId: "category_1" }],
        toolTags: [{ tagId: "tag_1" }],
      }}
    />,
  );
}

beforeEach(() => {
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:preview"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
});

describe("FounderToolEditor", () => {
  it("removes a selected tag from the visible tag chip", () => {
    renderFounderToolEditor();

    fireEvent.click(screen.getByRole("button", { name: "Remove AI tag" }));

    expect(
      screen.queryByRole("button", { name: "Remove AI tag" }),
    ).not.toBeInTheDocument();
  });

  it("accepts a dropped logo image", () => {
    renderFounderToolEditor();
    fireEvent.click(screen.getByRole("button", { name: /Media/i }));

    const dropTarget = screen.getByText("Drop image or click to upload").closest("label");
    expect(dropTarget).not.toBeNull();

    fireEvent.drop(dropTarget as HTMLElement, {
      dataTransfer: {
        files: [new File(["image"], "logo.png", { type: "image/png" })],
      },
    });

    expect(screen.getByAltText("Logo preview")).toBeInTheDocument();
  });
});
