import { describe, expect, it, vi } from "vitest";

import { consoleReporter } from "./index";

describe("monitoring.consoleReporter", () => {
  it("captures exception without throwing", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => consoleReporter.captureException(new Error("boom"), { a: 1 })).not.toThrow();
    spy.mockRestore();
  });
});

