import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AlertsInbox } from "@/components/AlertsInbox";

describe("AlertsInbox", () => {
  it("shows 'Live' when connected", () => {
    render(<AlertsInbox alerts={[]} isConnected={true} />);
    expect(screen.getByText(/Live/)).toBeInTheDocument();
  });

  it("shows 'Offline' when disconnected", () => {
    render(<AlertsInbox alerts={[]} isConnected={false} />);
    expect(screen.getByText(/Offline/)).toBeInTheDocument();
  });

  it("renders alert count badge", () => {
    render(
      <AlertsInbox
        alerts={[
          {
            id: "1",
            title: "Test Alert",
            message: "Something happened",
            timestamp: "10:00",
            severity: "critical",
          },
        ]}
        isConnected={true}
      />
    );
    expect(screen.getByText("1 Active")).toBeInTheDocument();
  });
});
