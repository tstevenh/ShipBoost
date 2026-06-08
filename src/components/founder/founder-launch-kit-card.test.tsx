import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FounderLaunchKitCard } from "./founder-launch-kit-card";

const props = {
  listingUrl: "https://shipboost.com/tools/acme",
  badgeImageUrlLight: "https://shipboost.com/badge/tool_1?theme=light",
  badgeImageUrlDark: "https://shipboost.com/badge/tool_1?theme=dark",
  badgeSnippetLight: '<a data-theme="light"></a>',
  badgeSnippetDark: '<a data-theme="dark"></a>',
  twitterText: "🚀 Acme is live",
  linkedinText: "Excited about Acme",
  twitterUrl: "https://twitter.com/intent/tweet?text=x",
  linkedinUrl: "https://www.linkedin.com/sharing/share-offsite/?url=x",
};

describe("FounderLaunchKitCard", () => {
  it("renders the listing url and share text, and reveals the dark snippet via View code", () => {
    render(<FounderLaunchKitCard {...props} />);

    expect(screen.getByText(/shipboost.com\/tools\/acme/)).toBeInTheDocument();
    expect(screen.getByText(/Acme is live/)).toBeInTheDocument();

    // code is hidden by default
    expect(screen.queryByRole("textbox", { name: /badge embed code/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /view code/i }));
    expect(
      screen.getByRole("textbox", { name: /badge embed code/i }),
    ).toHaveValue('<a data-theme="dark"></a>');
  });

  it("previews the dark badge by default and exposes share links", () => {
    render(<FounderLaunchKitCard {...props} />);
    expect(screen.getByAltText(/live ShipBoost badge preview/i)).toHaveAttribute(
      "src",
      props.badgeImageUrlDark,
    );
    // two share links (X + LinkedIn)
    expect(screen.getAllByRole("link", { name: /open/i })).toHaveLength(2);
  });
});
