import type { ErrorReporter } from "./reporting";

export type FetchMetric = {
  url: string;
  method: string;
  status?: number;
  ok: boolean;
  durationMs: number;
};

export type MetricSink = {
  recordFetch: (metric: FetchMetric) => void;
};

export const consoleSink: MetricSink = {
  recordFetch(metric) {
    console.log("[monitoring] fetch", metric);
  }
};

export type InstrumentedFetchOptions = {
  fetchImpl?: typeof fetch;
  sink?: MetricSink;
  reporter?: ErrorReporter;
};

export function createInstrumentedFetch(options: InstrumentedFetchOptions = {}): typeof fetch {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sink = options.sink ?? consoleSink;
  const reporter = options.reporter;

  return (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method ?? "GET";

    const start = performance.now();
    try {
      const response = await fetchImpl(input, init);
      const durationMs = performance.now() - start;
      sink.recordFetch({ url, method, status: response.status, ok: response.ok, durationMs });
      return response;
    } catch (error) {
      const durationMs = performance.now() - start;
      sink.recordFetch({ url, method, ok: false, durationMs });
      reporter?.captureException(error, { url, method });
      throw error;
    }
  }) as typeof fetch;
}
