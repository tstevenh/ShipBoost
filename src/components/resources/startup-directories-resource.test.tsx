import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StartupDirectoriesResource } from "@/components/resources/startup-directories-resource";

vi.mock("@/content/resources/startup-directories", () => ({
  startupDirectories: [
    {
      id: "shipboost-000",
      name: "ShipBoost",
      url: "https://shipboost.io",
      domain: "shipboost.io",
      dr: 0,
      recommended: true,
      searchText: "shipboost shipboost.io https://shipboost.io",
    },
    {
      id: "reddit-000",
      name: "r/startups",
      url: "https://reddit.com/r/startups",
      domain: "reddit.com",
      dr: 95,
      searchText: "r/startups reddit.com https://reddit.com/r/startups",
    },
    {
      id: "beta-001",
      name: "Beta",
      url: "https://beta.com",
      domain: "beta.com",
      dr: 92,
      searchText: "beta beta.com https://beta.com",
    },
    {
      id: "alpha-002",
      name: "Alpha",
      url: "https://alpha.com",
      domain: "alpha.com",
      dr: 40,
      searchText: "alpha alpha.com https://alpha.com",
    },
    {
      id: "gamma-003",
      name: "Gamma",
      url: "https://gamma.io",
      domain: "gamma.io",
      dr: 12,
      searchText: "gamma gamma.io https://gamma.io",
    },
  ],
}));

describe("StartupDirectoriesResource", () => {
  it("defaults to DR descending and can sort by name", () => {
    render(<StartupDirectoriesResource />);

    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("1");
    expect(rows[1]).toHaveTextContent("r/startups");

    fireEvent.click(screen.getByRole("button", { name: /sort by name/i }));

    const sortedRows = screen.getAllByRole("row");
    expect(sortedRows[1]).toHaveTextContent("1");
    expect(sortedRows[1]).toHaveTextContent("Alpha");
  });

  it("filters rows by search text", () => {
    render(<StartupDirectoriesResource />);

    fireEvent.change(screen.getByPlaceholderText(/search name, domain, or url/i), {
      target: { value: "gamma.io" },
    });

    expect(screen.getByText("Gamma")).toBeInTheDocument();
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
  });

  it("hides Reddit rows in preview mode", () => {
    render(<StartupDirectoriesResource preview />);

    expect(screen.queryByText("r/startups")).not.toBeInTheDocument();
    expect(screen.getByText("ShipBoost")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/search name, domain, or url/i),
    ).not.toBeInTheDocument();
  });
});
