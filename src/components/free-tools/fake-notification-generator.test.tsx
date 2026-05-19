import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FakeNotificationGenerator } from "@/components/free-tools/fake-notification-generator";

describe("FakeNotificationGenerator", () => {
  it("updates preview fields from form inputs", () => {
    render(<FakeNotificationGenerator />);

    fireEvent.change(screen.getByLabelText(/^title$/i), {
      target: { value: "LaunchBot" },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Your launch report is ready." },
    });

    expect(screen.getByText("LaunchBot")).toBeInTheDocument();
    expect(screen.getAllByText("Your launch report is ready.").length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("applies platform preset changes to the preview", () => {
    render(<FakeNotificationGenerator />);

    fireEvent.change(screen.getByLabelText(/application/i), {
      target: { value: "discord" },
    });

    expect(screen.getByLabelText(/^title$/i)).toHaveValue("Discord");
    expect(
      screen.getAllByText("New message in #launch-room: your product is live.")
        .length,
    ).toBeGreaterThanOrEqual(1);
  });
});
