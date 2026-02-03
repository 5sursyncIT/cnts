import { describe, expect, it } from "vitest";

import { appendAuditEvent, listAuditEvents, type AuditEvent } from "./store";

describe("audit store", () => {
  it("keeps most recent events first and respects limit", () => {
    const a: AuditEvent = { ts: "t1", action: "a1" };
    const b: AuditEvent = { ts: "t2", action: "a2" };
    appendAuditEvent(a);
    appendAuditEvent(b);

    const list = listAuditEvents(2);
    expect(list[0]?.action).toBe("a2");
    expect(list[1]?.action).toBe("a1");
  });

  it("caps stored events to 200", () => {
    for (let i = 0; i < 205; i++) {
      appendAuditEvent({ ts: `t${i}`, action: `a${i}` });
    }
    expect(listAuditEvents(500)).toHaveLength(200);
  });
});

