import { describe, expect, it, vi } from "vitest";

import { listAuditEvents } from "./store";
import { logAuditEvent } from "./log";

describe("audit log", () => {
  it("adds ts automatically", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-03T00:00:00.000Z"));

    logAuditEvent({ actorEmail: "a@b.c", action: "auth.login" });
    const [evt] = listAuditEvents(1);
    expect(evt?.ts).toBe("2026-02-03T00:00:00.000Z");
    expect(evt?.actorEmail).toBe("a@b.c");
    expect(evt?.action).toBe("auth.login");

    vi.useRealTimers();
  });
});

