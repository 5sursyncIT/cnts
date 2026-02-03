import type { AuditEvent } from "./store";
import { appendAuditEvent } from "./store";

export function logAuditEvent(event: Omit<AuditEvent, "ts">) {
  appendAuditEvent({ ...event, ts: new Date().toISOString() });
}

