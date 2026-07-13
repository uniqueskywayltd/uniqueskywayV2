import { describe, expect, it } from "vitest";

import {
  createDefaultDashboardPersonalization,
  resolveDashboardWidgets,
} from "@/features/customer/dashboard/widget-registry";

describe("dashboard widget registry", () => {
  it("orders portfolio value before available balance (DEC-0033)", () => {
    const widgets = resolveDashboardWidgets();
    expect(widgets[0]?.id).toBe("portfolio-value");
    expect(widgets[1]?.id).toBe("available-balance");
    expect(widgets[2]?.id).toBe("todays-activity");
  });

  it("supports personalization structure without applying settings UI", () => {
    const personalization = createDefaultDashboardPersonalization();
    personalization.hiddenWidgetIds = ["whats-new"];
    personalization.widgetOrder = [
      "available-balance",
      "portfolio-value",
      ...personalization.widgetOrder.filter(
        (id) => id !== "available-balance" && id !== "portfolio-value",
      ),
    ];

    const widgets = resolveDashboardWidgets(personalization);
    expect(widgets[0]?.id).toBe("available-balance");
    expect(widgets.some((widget) => widget.id === "whats-new")).toBe(false);
  });
});
