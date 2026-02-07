/** Types pour le protocole de sync mobile CNTS.
 *  Miroir des schémas backend (backend/app/schemas/sync.py). */

export interface SyncPushEventIn {
  client_event_id: string;
  type: string;
  payload: Record<string, unknown>;
  occurred_at?: string;
}

export interface SyncPushIn {
  device_id: string;
  events: SyncPushEventIn[];
}

export interface SyncPushEventResult {
  client_event_id: string;
  status: "ACCEPTE" | "REJETE" | "DUPLICATE";
  error_code?: string | null;
  error_message?: string | null;
  response?: Record<string, unknown> | null;
}

export interface SyncPushOut {
  device_id: string;
  results: SyncPushEventResult[];
}

export interface SyncPullEventOut {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface SyncPullOut {
  events: SyncPullEventOut[];
  next_cursor: string | null;
}
