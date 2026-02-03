import { describe, expect, it, vi } from "vitest";

import { createInstrumentedFetch, type MetricSink } from "./index";

describe("monitoring.createInstrumentedFetch", () => {
  it("records successful fetch with status and ok=true", async () => {
    const recordFetch = vi.fn();
    const sink: MetricSink = { recordFetch };
    const fetchImpl = vi.fn(async () => new Response("ok", { status: 200 }));

    const instrumented = createInstrumentedFetch({ fetchImpl: fetchImpl as unknown as typeof fetch, sink });
    const res = await instrumented("https://example.test/health");

    expect(res.status).toBe(200);
    expect(recordFetch).toHaveBeenCalledTimes(1);
    expect(recordFetch.mock.calls[0]?.[0]).toMatchObject({
      url: "https://example.test/health",
      method: "GET",
      status: 200,
      ok: true
    });
  });

  it("records failed fetch and rethrows", async () => {
    const recordFetch = vi.fn();
    const sink: MetricSink = { recordFetch };
    const fetchImpl = vi.fn(async () => {
      throw new Error("network");
    });

    const instrumented = createInstrumentedFetch({ fetchImpl: fetchImpl as unknown as typeof fetch, sink });

    await expect(instrumented("https://example.test/health")).rejects.toThrow("network");
    expect(recordFetch).toHaveBeenCalledTimes(1);
    expect(recordFetch.mock.calls[0]?.[0]).toMatchObject({
      url: "https://example.test/health",
      method: "GET",
      ok: false
    });
  });

  it("calls reporter on fetch error", async () => {
    const recordFetch = vi.fn();
    const sink: MetricSink = { recordFetch };
    const fetchImpl = vi.fn(async () => {
      throw new Error("network");
    });
    const reporter = { captureException: vi.fn() };

    const instrumented = createInstrumentedFetch({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sink,
      reporter
    });

    await expect(instrumented("https://example.test/health", { method: "POST" })).rejects.toThrow("network");
    expect(reporter.captureException).toHaveBeenCalledTimes(1);
    expect(recordFetch.mock.calls[0]?.[0]).toMatchObject({ method: "POST", ok: false });
  });

  it("uses console sink by default", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const fetchImpl = vi.fn(async () => new Response("ok", { status: 204 }));

    const instrumented = createInstrumentedFetch({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const res = await instrumented(new URL("https://example.test/health"));
    expect(res.status).toBe(204);
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
