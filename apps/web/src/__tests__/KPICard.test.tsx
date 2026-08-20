import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IndianRupee } from "lucide-react";
import { KPICard } from "@/components/KPICard";

describe("KPICard", () => {
  it("renders title and value", () => {
    render(
      <KPICard
        title="Savings"
        value="₹1,30,000"
        icon={IndianRupee}
      />
    );
    expect(screen.getByText("Savings")).toBeInTheDocument();
    expect(screen.getByText("₹1,30,000")).toBeInTheDocument();
  });

  it("renders subValue when provided", () => {
    render(
      <KPICard
        title="Savings"
        value="₹1,30,000"
        subValue="Monthly savings"
        icon={IndianRupee}
      />
    );
    expect(screen.getByText("Monthly savings")).toBeInTheDocument();
  });

  it("renders trend when provided as object", () => {
    render(
      <KPICard
        title="Savings"
        value="₹1,30,000"
        icon={IndianRupee}
        trend={{
          value: "+18.4%",
          isPositive: true,
          label: "vs previous cycle",
        }}
      />
    );
    expect(screen.getByText("+18.4%")).toBeInTheDocument();
    expect(screen.getByText("vs previous cycle")).toBeInTheDocument();
  });

  it("renders badge with correct text", () => {
    render(
      <KPICard
        title="Savings"
        value="₹1,30,000"
        icon={IndianRupee}
        badgeText="VERIFIED"
        badgeType="emerald"
      />
    );
    expect(screen.getByText("VERIFIED")).toBeInTheDocument();
  });

  it("applies glow class when glow is true", () => {
    const { container } = render(
      <KPICard
        title="Savings"
        value="₹1,30,000"
        icon={IndianRupee}
        glow={true}
      />
    );
    expect(container.querySelector(".glass-panel-glow")).toBeInTheDocument();
  });

  it("does not render subValue when not provided", () => {
    render(
      <KPICard
        title="Savings"
        value="₹1,30,000"
        icon={IndianRupee}
      />
    );
    expect(screen.queryByText("Monthly savings")).not.toBeInTheDocument();
  });
});
