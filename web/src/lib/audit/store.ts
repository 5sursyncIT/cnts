export type AuditEvent = {
  ts: string;
  actorEmail?: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
};

const store: AuditEvent[] = [];

export function appendAuditEvent(event: AuditEvent) {
  store.unshift(event);
  store.splice(200);
}

export function listAuditEvents(limit = 50): AuditEvent[] {
  return store.slice(0, limit);
}

