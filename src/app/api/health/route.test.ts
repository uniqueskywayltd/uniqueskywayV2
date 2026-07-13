import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("health route", () => {
  it("returns foundation health metadata", async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("unique-sky-way-v2");
    expect(typeof body.time).toBe("string");
  });
});
