import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  CurrencyDisplay,
  DateDisplay,
  PercentageDisplay,
  RoiDisplay,
} from "@/components/ui/display";

describe("display components", () => {
  it("formats currency in minor units", () => {
    render(<CurrencyDisplay amountMinor={1250000} />);

    expect(screen.getByText("$12,500.00")).toBeInTheDocument();
  });

  it("formats percentages and ROI consistently", () => {
    render(
      <div>
        <PercentageDisplay value={0.125} />
        <RoiDisplay value={0.0845} />
      </div>,
    );

    expect(screen.getByText("12.50%")).toBeInTheDocument();
    expect(screen.getByText("8.45%")).toBeInTheDocument();
  });

  it("formats dates as MM/DD/YYYY", () => {
    render(<DateDisplay value="2026-07-12T12:00:00.000Z" />);

    expect(screen.getByText("07/12/2026")).toBeInTheDocument();
  });
});
