// Réseau national des structures de transfusion sanguine.
// Source de vérité : la collection « Structure » du CMS Strapi (lib/cms.ts → getStructures).
// Repli quand le CMS est injoignable : la cartographie Excel de la Direction
// (structures-data.ts, généré par scripts/import_structures.py) + le siège ajouté ici.
import { STRUCTURES_DATA } from "./structures-data";

export type StructureKind = "siege" | "crts" | "banque" | "pts" | "depot";

export type Structure = {
  id: string;
  name: string;
  kind: StructureKind;
  /** Code région de la carte (ex. "SNKL"). */
  region: string;
  departement: string;
  commune: string;
  /** Établissement qui héberge la structure (Hôpital, Centre de santé…). */
  hote: string;
  adresse?: string;
  repere?: string;
  /** Horaires d'accueil des donneurs (siège, CRTS). */
  horaires?: string;
  lat: number;
  lng: number;
};

export const SIEGE: Structure = {
  id: "cnts-siege",
  name: "CNTS — Siège national",
  kind: "siege",
  region: "SNDK",
  departement: "Dakar",
  commune: "Fann",
  hote: "Centre National de Transfusion Sanguine",
  adresse: "Avenue Cheikh Anta Diop, Fann-Résidence",
  horaires: "Lun–Ven · 08h00–17h00 · Sam · 08h00–13h00",
  lat: 14.6957,
  lng: -17.4657,
};

export const STRUCTURES: Structure[] = [SIEGE, ...STRUCTURES_DATA];

export const STRUCTURE_KINDS: StructureKind[] = ["siege", "crts", "banque", "pts", "depot"];

export const STRUCTURE_KIND_LABEL: Record<StructureKind, string> = {
  siege: "Siège national",
  crts: "Centre régional (CRTS)",
  banque: "Banque de sang",
  pts: "Poste de transfusion (PTS)",
  depot: "Dépôt de sang",
};

export const STRUCTURE_KIND_PLURAL: Record<StructureKind, string> = {
  siege: "Siège",
  crts: "CRTS",
  banque: "Banques de sang",
  pts: "PTS",
  depot: "Dépôts de sang",
};

export function structuresByRegion(list: Structure[] = STRUCTURES): Record<string, Structure[]> {
  const out: Record<string, Structure[]> = {};
  for (const s of list) (out[s.region] ??= []).push(s);
  return out;
}

/** « 1 CRTS, 2 banques de sang » — résumé d'une liste de structures. */
export function summarize(list: Structure[]): string {
  if (!list.length) return "Aucune structure recensée";
  const parts: string[] = [];
  for (const k of STRUCTURE_KINDS) {
    const n = list.filter((s) => s.kind === k).length;
    if (!n) continue;
    const label = k === "siege" ? "siège national" : k === "crts" ? "CRTS" : k === "pts" ? "PTS" : k === "banque" ? "banque" + (n > 1 ? "s" : "") + " de sang" : "dépôt" + (n > 1 ? "s" : "") + " de sang";
    parts.push(k === "siege" ? label : `${n} ${label}`);
  }
  return parts.join(", ");
}

export const CRTS = STRUCTURES.filter((s) => s.kind === "crts");
