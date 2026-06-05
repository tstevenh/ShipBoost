import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FounderLaunchKitCard } from "./founder-launch-kit-card";

describe("FounderLaunchKitCard", () => {
  it("renders the listing url, a dark-theme badge snippet by default, and share text", () => {
    render(
      <FounderLaunchKitCard
        listingUrl="https://shipboost.com/tools/acme"
        badgeSnippetLight={'<a data-theme="light"></a>'}
        badgeSnippetDark={'<a data-theme="dark"></a>'}
        twitterText="🚀 Acme is live"
        linkedinText="Excited about Acme"
      />,
    );

    expect(screen.getByText(/shipboost.com\/tools\/acme/)).toBeInTheDocument();
    expect(screen.getByText(/Acme is live/)).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /badge embed code/i }),
    ).toHaveValue('<a data-theme="dark"></a>');
  });
});
