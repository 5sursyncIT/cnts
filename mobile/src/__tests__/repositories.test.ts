/**
 * Tests des repositories avec un mock SQLiteDatabase.
 *
 * On vérifie que les fonctions construisent les bonnes requêtes SQL
 * et transforment correctement les résultats.
 */

// --- Mock DB helpers ---
function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    execAsync: jest.fn().mockResolvedValue(undefined),
  };
}

// On mock expo-crypto pour generateUUID
jest.mock("expo-crypto", () => ({
  randomUUID: () => "mock-uuid-1234",
}));

import type { SQLiteDatabase } from "expo-sqlite";
import {
  enqueueEvent,
  getPendingEvents,
  markAccepted,
  markRejected,
  getQueueStats,
  retryEvent,
  dismissEvent,
} from "../db/repositories/event-queue.repo";
import {
  createDonneur,
  getDonneur,
  listDonneurs,
  updateDonneur,
} from "../db/repositories/donneurs.repo";
import {
  createDon,
  getDon,
  listDons,
  countTodayDons,
} from "../db/repositories/dons.repo";

describe("event-queue.repo", () => {
  let db: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    db = createMockDb();
  });

  it("enqueueEvent insère un événement PENDING", async () => {
    const id = await enqueueEvent(
      db as unknown as SQLiteDatabase,
      "donneur.upsert",
      { nom: "Diop" }
    );

    expect(id).toBe("mock-uuid-1234");
    expect(db.runAsync).toHaveBeenCalledTimes(1);
    const [sql, ...args] = db.runAsync.mock.calls[0];
    expect(sql).toContain("INSERT INTO event_queue");
    expect(sql).toContain("PENDING");
    expect(args).toContain("donneur.upsert");
    expect(args).toContain(JSON.stringify({ nom: "Diop" }));
  });

  it("getPendingEvents filtre par status et next_retry_at", async () => {
    db.getAllAsync.mockResolvedValueOnce([]);
    await getPendingEvents(db as unknown as SQLiteDatabase, 50);

    expect(db.getAllAsync).toHaveBeenCalledTimes(1);
    const [sql] = db.getAllAsync.mock.calls[0];
    expect(sql).toContain("PENDING");
    expect(sql).toContain("REJECTED");
    expect(sql).toContain("next_retry_at");
  });

  it("markAccepted met à jour le status et la réponse serveur", async () => {
    await markAccepted(db as unknown as SQLiteDatabase, "evt-1", { id: 42 });

    expect(db.runAsync).toHaveBeenCalledTimes(1);
    const [sql, response, eventId] = db.runAsync.mock.calls[0];
    expect(sql).toContain("ACCEPTED");
    expect(response).toBe(JSON.stringify({ id: 42 }));
    expect(eventId).toBe("evt-1");
  });

  it("markRejected calcule un backoff exponentiel", async () => {
    db.getFirstAsync.mockResolvedValueOnce({ retry_count: 2, max_retries: 5 });
    await markRejected(
      db as unknown as SQLiteDatabase,
      "evt-1",
      "CONFLICT",
      "Donneur existe déjà"
    );

    expect(db.getFirstAsync).toHaveBeenCalledTimes(1);
    expect(db.runAsync).toHaveBeenCalledTimes(1);
    const [sql, errorCode, errorMsg, retryCount] = db.runAsync.mock.calls[0];
    expect(sql).toContain("REJECTED");
    expect(errorCode).toBe("CONFLICT");
    expect(errorMsg).toBe("Donneur existe déjà");
    expect(retryCount).toBe(3); // 2 + 1
  });

  it("getQueueStats agrège par status", async () => {
    db.getAllAsync.mockResolvedValueOnce([
      { status: "PENDING", count: 5 },
      { status: "PUSHING", count: 2 },
      { status: "ACCEPTED", count: 10 },
      { status: "REJECTED", count: 3 },
      { status: "DUPLICATE", count: 1 },
    ]);
    const stats = await getQueueStats(db as unknown as SQLiteDatabase);

    expect(stats.pending).toBe(7); // PENDING + PUSHING
    expect(stats.accepted).toBe(11); // ACCEPTED + DUPLICATE
    expect(stats.rejected).toBe(3);
  });

  it("retryEvent remet le status à PENDING et reset retry_count", async () => {
    await retryEvent(db as unknown as SQLiteDatabase, "evt-1");

    const [sql] = db.runAsync.mock.calls[0];
    expect(sql).toContain("PENDING");
    expect(sql).toContain("retry_count = 0");
  });

  it("dismissEvent supprime l'événement", async () => {
    await dismissEvent(db as unknown as SQLiteDatabase, "evt-1");

    const [sql, id] = db.runAsync.mock.calls[0];
    expect(sql).toContain("DELETE FROM event_queue");
    expect(id).toBe("evt-1");
  });
});

describe("donneurs.repo", () => {
  let db: ReturnType<typeof createMockDb>;

  const mockDonneur = {
    local_id: "mock-uuid-1234",
    server_id: null,
    cni_raw: "123456",
    nom: "DIOP",
    prenom: "Amadou",
    sexe: "H",
    date_naissance: "1990-01-15",
    groupe_sanguin: "O+",
    adresse: null,
    region: "Dakar",
    departement: null,
    telephone: "+221771234567",
    email: null,
    profession: null,
    dernier_don: null,
    photo_uri: null,
    sync_status: "PENDING",
    sync_error: null,
    created_at: "2024-01-01T00:00:00",
    updated_at: "2024-01-01T00:00:00",
  };

  beforeEach(() => {
    db = createMockDb();
  });

  it("createDonneur insère et retourne le donneur", async () => {
    db.getFirstAsync.mockResolvedValueOnce(mockDonneur);

    const result = await createDonneur(db as unknown as SQLiteDatabase, {
      cni: "123456",
      nom: "DIOP",
      prenom: "Amadou",
      sexe: "H",
      date_naissance: "1990-01-15",
      groupe_sanguin: "O+",
      region: "Dakar",
      telephone: "+221771234567",
    });

    expect(db.runAsync).toHaveBeenCalledTimes(1);
    const [sql] = db.runAsync.mock.calls[0];
    expect(sql).toContain("INSERT INTO donneurs");
    expect(result.nom).toBe("DIOP");
  });

  it("listDonneurs avec query fait un LIKE", async () => {
    db.getAllAsync.mockResolvedValueOnce([mockDonneur]);
    await listDonneurs(db as unknown as SQLiteDatabase, { query: "diop" });

    const [sql, q1] = db.getAllAsync.mock.calls[0];
    expect(sql).toContain("LIKE");
    expect(q1).toBe("%diop%");
  });

  it("listDonneurs sans query retourne les plus récents", async () => {
    db.getAllAsync.mockResolvedValueOnce([]);
    await listDonneurs(db as unknown as SQLiteDatabase);

    const [sql] = db.getAllAsync.mock.calls[0];
    expect(sql).toContain("ORDER BY updated_at DESC");
  });

  it("updateDonneur construit SET dynamiquement", async () => {
    db.getFirstAsync.mockResolvedValueOnce({ ...mockDonneur, nom: "FALL" });

    await updateDonneur(db as unknown as SQLiteDatabase, "mock-uuid-1234", {
      nom: "FALL",
      telephone: null,
    });

    expect(db.runAsync).toHaveBeenCalledTimes(1);
    const [sql] = db.runAsync.mock.calls[0];
    expect(sql).toContain("nom = ?");
    expect(sql).toContain("telephone = ?");
    expect(sql).toContain("sync_status = 'PENDING'");
  });

  it("updateDonneur ne fait rien si aucun champ", async () => {
    db.getFirstAsync.mockResolvedValueOnce(mockDonneur);
    await updateDonneur(db as unknown as SQLiteDatabase, "mock-uuid-1234", {});
    expect(db.runAsync).not.toHaveBeenCalled();
  });
});

describe("dons.repo", () => {
  let db: ReturnType<typeof createMockDb>;

  const mockDon = {
    local_id: "mock-uuid-1234",
    server_id: null,
    donneur_local_id: "donneur-1",
    donneur_server_id: null,
    din: null,
    date_don: "2024-06-15",
    type_don: "SANG_TOTAL",
    statut_qualification: "EN_ATTENTE",
    idempotency_key: "mock-uuid-1234",
    sync_status: "PENDING",
    sync_error: null,
    created_at: "2024-06-15T10:00:00",
    updated_at: "2024-06-15T10:00:00",
  };

  beforeEach(() => {
    db = createMockDb();
  });

  it("createDon insère et met à jour dernier_don du donneur", async () => {
    db.getFirstAsync.mockResolvedValueOnce(mockDon);

    await createDon(db as unknown as SQLiteDatabase, {
      donneur_local_id: "donneur-1",
      date_don: "2024-06-15",
      type_don: "SANG_TOTAL",
    });

    // 2 appels: INSERT don + UPDATE donneur.dernier_don
    expect(db.runAsync).toHaveBeenCalledTimes(2);
    const [insertSql] = db.runAsync.mock.calls[0];
    expect(insertSql).toContain("INSERT INTO dons");
    const [updateSql] = db.runAsync.mock.calls[1];
    expect(updateSql).toContain("UPDATE donneurs SET dernier_don");
  });

  it("listDons avec donneurLocalId filtre par donneur", async () => {
    db.getAllAsync.mockResolvedValueOnce([mockDon]);
    await listDons(db as unknown as SQLiteDatabase, {
      donneurLocalId: "donneur-1",
    });

    const [sql, id] = db.getAllAsync.mock.calls[0];
    expect(sql).toContain("donneur_local_id = ?");
    expect(id).toBe("donneur-1");
  });

  it("listDons avec dateFrom/dateTo filtre par plage", async () => {
    db.getAllAsync.mockResolvedValueOnce([]);
    await listDons(db as unknown as SQLiteDatabase, {
      dateFrom: "2024-06-01",
      dateTo: "2024-06-30",
    });

    const [sql, from, to] = db.getAllAsync.mock.calls[0];
    expect(sql).toContain("date_don >= ?");
    expect(sql).toContain("date_don <= ?");
    expect(from).toBe("2024-06-01");
    expect(to).toBe("2024-06-30");
  });

  it("listDons avec query fait un JOIN donneurs", async () => {
    db.getAllAsync.mockResolvedValueOnce([]);
    await listDons(db as unknown as SQLiteDatabase, { query: "diop" });

    const [sql] = db.getAllAsync.mock.calls[0];
    expect(sql).toContain("JOIN donneurs");
    expect(sql).toContain("LIKE");
  });

  it("countTodayDons retourne le nombre de dons du jour", async () => {
    db.getFirstAsync.mockResolvedValueOnce({ count: 3 });
    const count = await countTodayDons(
      db as unknown as SQLiteDatabase,
      "2024-06-15"
    );
    expect(count).toBe(3);
  });

  it("countTodayDons retourne 0 quand pas de résultat", async () => {
    db.getFirstAsync.mockResolvedValueOnce(null);
    const count = await countTodayDons(
      db as unknown as SQLiteDatabase,
      "2024-06-15"
    );
    expect(count).toBe(0);
  });
});
