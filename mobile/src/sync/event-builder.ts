import type { SQLiteDatabase } from "expo-sqlite";
import { enqueueEvent } from "../db/repositories/event-queue.repo";
import type { LocalDonneur } from "../db/repositories/donneurs.repo";
import type { LocalDon } from "../db/repositories/dons.repo";
import type { LocalRdv } from "../db/repositories/rdv.repo";

/**
 * Crée un événement donneur.upsert dans la file de sync.
 *
 * Le payload correspond à ce qu'attend _apply_mobile_event côté backend :
 * { cni, nom, prenom, sexe }
 */
export async function enqueueDonneurUpsert(
  db: SQLiteDatabase,
  donneur: LocalDonneur
): Promise<string> {
  return enqueueEvent(db, "donneur.upsert", {
    cni: donneur.cni_raw,
    nom: donneur.nom,
    prenom: donneur.prenom,
    sexe: donneur.sexe,
  });
}

/**
 * Crée un événement don.create dans la file de sync.
 *
 * Le payload correspond à ce qu'attend _apply_mobile_event côté backend :
 * { donneur_cni, date_don, type_don }
 */
export async function enqueueDonCreate(
  db: SQLiteDatabase,
  don: LocalDon,
  donneurCniRaw: string
): Promise<string> {
  return enqueueEvent(db, "don.create", {
    donneur_cni: donneurCniRaw,
    date_don: don.date_don,
    type_don: don.type_don,
  });
}

/**
 * Crée un événement rdv.create dans la file de sync.
 *
 * Note : Le backend ne supporte pas encore cet event type.
 * Les RDV restent en local-only jusqu'à l'ajout du handler côté sync.py.
 */
export async function enqueueRdvCreate(
  db: SQLiteDatabase,
  rdv: LocalRdv,
  donneurCniRaw: string
): Promise<string> {
  return enqueueEvent(db, "rdv.create", {
    donneur_cni: donneurCniRaw,
    date_prevue: rdv.date_prevue,
    type_rdv: rdv.type_rdv,
    lieu: rdv.lieu,
    commentaire: rdv.commentaire,
  });
}
