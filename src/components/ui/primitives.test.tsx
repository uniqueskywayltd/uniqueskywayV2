import { render, screen } from "@testing-library/react";
import { CreditCard } from "lucide-react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";

describe("ui primitives", () => {
  it("renders action and content primitives", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Foundation card</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Continue</Button>
        </CardContent>
      </Card>,
    );

    expect(screen.getByRole("heading", { name: "Foundation card" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  it("renders status and empty states", () => {
    render(
      <div>
        <StatusChip tone="active">Active</StatusChip>
        <EmptyState
          icon={CreditCard}
          title="No records"
          description="Nothing has been added yet."
        />
      </div>,
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No records" })).toBeInTheDocument();
    expect(screen.getByText("Nothing has been added yet.")).toBeInTheDocument();
  });
});
