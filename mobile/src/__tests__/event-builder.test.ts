/**
 * Tests du module event-builder (sync).
 * Vérifie que les payloads générés sont conformes au format attendu par le backend.
 */

import type { SQLiteDatabase } from "expo-sqlite";
import type { LocalDonneur } from "../db/repositories/donneurs.repo";
import type { LocalDon } from "../db/repositories/dons.repo";
import type { LocalRdv } from "../db/repositories/rdv.repo";

// Mock enqueueEvent pour capturer les arguments
const mockEnqueueEvent = jest.fn().mockResolvedValue("evt-id-123");
jest.mock("../db/repositories/event-queue.repo", () => ({
  enqueueEvent: (...args: unknown[]) => mockEnqueueEvent(...args),
}));

import {
  enqueueDonneurUpsert,
  enqueueDonCreate,
  enqueueRdvCreate,
} from "../sync/event-builder";

const fakeDb = {} as SQLiteDatabase;

describe("enqueueDonneurUpsert", () => {
  beforeEach(() => mockEnqueueEvent.mockClear());

  it("crée un événement donneur.upsert avec le bon payload", async () => {
    const donneur: LocalDonneur = {
      local_id: "loc-1",
      server_id: null,
      cni_raw: "SN1234567",
      nom: "DIOP",
      prenom: "Amadou",
      sexe: "H",
      date_naissance: "1990-01-15",
      groupe_sanguin: "O+",
      adresse: null,
      region: "Dakar",
      departement: null,
      telephone: null,
      email: null,
      profession: null,
      dernier_don: null,
      photo_uri: null,
      sync_status: "PENDING",
      sync_error: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    };

    const id = await enqueueDonneurUpsert(fakeDb, donneur);

    expect(id).toBe("evt-id-123");
    expect(mockEnqueueEvent).toHaveBeenCalledWith(fakeDb, "donneur.upsert", {
      cni: "SN1234567",
      nom: "DIOP",
      prenom: "Amadou",
      sexe: "H",
    });
  });

  it("n'inclut pas les champs optionnels dans le payload", async () => {
    const donneur: LocalDonneur = {
      local_id: "loc-2",
      server_id: "srv-1",
      cni_raw: null,
      nom: "FALL",
      prenom: "Fatou",
      sexe: "F",
      date_naissance: null,
      groupe_sanguin: null,
      adresse: null,
      region: null,
      departement: null,
      telephone: null,
      email: null,
      profession: null,
      dernier_don: null,
      photo_uri: null,
      sync_status: "SYNCED",
      sync_error: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    };

    await enqueueDonneurUpsert(fakeDb, donneur);

    const payload = mockEnqueueEvent.mock.calls[0][2];
    expect(payload).toEqual({
      cni: null,
      nom: "FALL",
      prenom: "Fatou",
      sexe: "F",
    });
    // Pas de champs extra
    expect(Object.keys(payload)).toHaveLength(4);
  });
});

describe("enqueueDonCreate", () => {
  beforeEach(() => mockEnqueueEvent.mockClear());

  it("crée un événement don.create avec donneur_cni", async () => {
    const don: LocalDon = {
      local_id: "don-1",
      server_id: null,
      donneur_local_id: "loc-1",
      donneur_server_id: null,
      din: null,
      date_don: "2024-06-15",
      type_don: "SANG_TOTAL",
      statut_qualification: "EN_ATTENTE",
      idempotency_key: "idem-1",
      sync_status: "PENDING",
      sync_error: null,
      created_at: "2024-06-15T10:00:00",
      updated_at: "2024-06-15T10:00:00",
    };

    await enqueueDonCreate(fakeDb, don, "SN1234567");

    expect(mockEnqueueEvent).toHaveBeenCalledWith(fakeDb, "don.create", {
      donneur_cni: "SN1234567",
      date_don: "2024-06-15",
      type_don: "SANG_TOTAL",
    });
  });
});

describe("enqueueRdvCreate", () => {
  beforeEach(() => mockEnqueueEvent.mockClear());

  it("crée un événement rdv.create avec les bonnes données", async () => {
    const rdv: LocalRdv = {
      local_id: "rdv-1",
      server_id: null,
      donneur_local_id: "loc-1",
      date_prevue: "2024-07-01",
      type_rdv: "DON_SANG",
      statut: "CONFIRME",
      lieu: "CNTS Dakar",
      commentaire: "Premier don",
      created_at: "2024-06-15",
      updated_at: "2024-06-15",
    };

    await enqueueRdvCreate(fakeDb, rdv, "SN1234567");

    expect(mockEnqueueEvent).toHaveBeenCalledWith(fakeDb, "rdv.create", {
      donneur_cni: "SN1234567",
      date_prevue: "2024-07-01",
      type_rdv: "DON_SANG",
      lieu: "CNTS Dakar",
      commentaire: "Premier don",
    });
  });

  it("gère les champs lieu/commentaire null", async () => {
    const rdv: LocalRdv = {
      local_id: "rdv-2",
      server_id: null,
      donneur_local_id: "loc-1",
      date_prevue: "2024-07-01",
      type_rdv: "CONSULTATION",
      statut: "CONFIRME",
      lieu: null,
      commentaire: null,
      created_at: "2024-06-15",
      updated_at: "2024-06-15",
    };

    await enqueueRdvCreate(fakeDb, rdv, "SN999");

    const payload = mockEnqueueEvent.mock.calls[0][2];
    expect(payload.lieu).toBeNull();
    expect(payload.commentaire).toBeNull();
  });
});
