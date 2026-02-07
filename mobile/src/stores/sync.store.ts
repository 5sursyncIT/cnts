import { create } from "zustand";

interface SyncState {
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  lastError: string | null;

  setSyncing: (syncing: boolean) => void;
  setLastSync: (at: string) => void;
  setStats: (stats: { pending: number; accepted: number; rejected: number }) => void;
  setError: (error: string | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  pendingCount: 0,
  acceptedCount: 0,
  rejectedCount: 0,
  lastError: null,

  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSync: (at) => set({ lastSyncAt: at }),
  setStats: (stats) => set({
    pendingCount: stats.pending,
    acceptedCount: stats.accepted,
    rejectedCount: stats.rejected,
  }),
  setError: (error) => set({ lastError: error }),
}));
