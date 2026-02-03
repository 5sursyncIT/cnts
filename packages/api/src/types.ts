/**
 * Types TypeScript correspondant aux schémas Pydantic du backend SGI-CNTS
 * Générés à partir des modèles définis dans backend/app/schemas/
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export type UUID = string;

export interface PaginationParams {
  offset?: number;
  limit?: number;
}

export interface IdempotencyPayload {
  idempotency_key?: string;
}

// ============================================================================
// DONNEURS
// ============================================================================

export interface DonneurCreate {
  cni: string;
  nom: string;
  prenom: string;
  sexe: "H" | "F";
}

export interface DonneurUpdate {
  nom?: string;
  prenom?: string;
  sexe?: "H" | "F";
}

export interface Donneur {
  id: UUID;
  cni_hash: string;
  nom: string;
  prenom: string;
  sexe: "H" | "F";
  dernier_don: string | null; // ISO date
  created_at: string;
  updated_at: string;
}

export interface EligibiliteResponse {
  eligible: boolean;
  eligible_le: string | null; // ISO date
  raison: string | null;
  delai_jours: number | null;
}

// ============================================================================
// DONS
// ============================================================================

export interface DonCreate extends IdempotencyPayload {
  donneur_id: UUID;
  date_don: string; // ISO date
  type_don: string;
}

export interface Don {
  id: UUID;
  donneur_id: UUID;
  donneur?: Donneur;
  din: string;
  date_don: string;
  type_don: string;
  statut_qualification: "EN_ATTENTE" | "LIBERE";
  created_at: string;
  poches?: Poche[];
}

export interface EtiquetteData {
  din: string;
  date_don: string;
  groupe_sanguin: string | null;
  type_produit: string;
  date_peremption: string;
}

// ============================================================================
// ANALYSES
// ============================================================================

export interface AnalyseCreate {
  don_id: UUID;
  type_test: "ABO" | "RH" | "VIH" | "VHB" | "VHC" | "SYPHILIS";
  resultat: string;
  note?: string;
  validateur_id?: UUID;
}

export interface Analyse {
  id: UUID;
  don_id: UUID;
  type_test: string;
  resultat: string;
  note: string | null;
  validateur_id: UUID | null;
  created_at: string;
}

// ============================================================================
// LIBERATION BIOLOGIQUE
// ============================================================================

export interface LiberationCheck {
  don_id: UUID;
  liberable: boolean;
  raison: string | null;
  tests_manquants: string[];
  tests_positifs: string[];
  statut_actuel: string;
}

export interface LiberationResult {
  don_id: UUID;
  statut: string;
  poches_mises_a_jour: number;
}

// ============================================================================
// POCHES
// ============================================================================

export interface Poche {
  id: UUID;
  don_id: UUID;
  source_poche_id: UUID | null;
  type_produit: "ST" | "CGR" | "PFC" | "CP";
  groupe_sanguin: string | null;
  code_produit_isbt: string | null;
  lot: string | null;
  division: number | null;
  volume_ml: number | null;
  date_peremption: string;
  emplacement_stock: string;
  statut_stock: "EN_STOCK" | "FRACTIONNEE" | "RESERVEE" | "DISTRIBUEE" | "DETRUITE";
  statut_distribution: "NON_DISTRIBUABLE" | "DISPONIBLE" | "RESERVE" | "DISTRIBUE";
  created_at: string;
}

export interface PocheFilterParams extends PaginationParams {
  type_produit?: string;
  groupe_sanguin?: string;
  statut_distribution?: string;
  statut_stock?: string;
  emplacement_stock?: string;
  sort_by_expiration?: boolean;
}

export interface StockSummary {
  summaries: Array<{
    type_produit: string;
    total: number;
    disponible: number;
    reserve: number;
    distribue: number;
  }>;
}

// ============================================================================
// STOCK & FRACTIONNEMENT
// ============================================================================

export interface ComposantFractionnement {
  type_produit: "CGR" | "PFC" | "CP";
  volume_ml: number;
}

export interface FractionnementCreate extends IdempotencyPayload {
  source_poche_id: UUID;
  composants: ComposantFractionnement[];
}

export interface FractionnementResult {
  source_poche_id: UUID;
  poches: Poche[];
}

export interface ProductRuleCreate {
  shelf_life_days: number;
  default_volume_ml?: number;
  min_volume_ml?: number;
  max_volume_ml?: number;
}

export interface ProductRule {
  type_produit: string;
  shelf_life_days: number;
  default_volume_ml: number | null;
  min_volume_ml: number | null;
  max_volume_ml: number | null;
  created_at: string;
}

export interface ComposantRecette {
  type_produit: string;
  volume_ml: number;
  quantite: number;
}

export interface RecetteFractionnementCreate {
  code: string;
  libelle: string;
  actif?: boolean;
  site_code?: string;
  type_source?: string;
  composants: ComposantRecette[];
}

export interface RecetteFractionnement {
  code: string;
  libelle: string;
  actif: boolean;
  site_code: string | null;
  type_source: string;
  composants: ComposantRecette[];
  created_at: string;
}

export interface FractionnementRecettePayload extends IdempotencyPayload {
  source_poche_id: UUID;
}

// ============================================================================
// DISTRIBUTION
// ============================================================================

export interface HopitalCreate {
  nom: string;
  adresse?: string;
  contact?: string;
  convention_actif?: boolean;
}

export interface Hopital {
  id: UUID;
  nom: string;
  adresse: string | null;
  contact: string | null;
  convention_actif: boolean;
  created_at: string;
}

export interface LigneCommandeCreate {
  type_produit: string;
  groupe_sanguin?: string;
  quantite: number;
}

export interface LigneCommande {
  id: UUID;
  type_produit: string;
  groupe_sanguin: string | null;
  quantite: number;
}

export interface CommandeCreate {
  hopital_id: UUID;
  date_livraison_prevue?: string; // ISO date
  lignes: LigneCommandeCreate[];
}

export interface Commande {
  id: UUID;
  hopital_id: UUID;
  statut: "BROUILLON" | "VALIDEE" | "SERVIE" | "ANNULEE";
  date_demande: string;
  date_livraison_prevue: string | null;
  created_at: string;
  updated_at: string;
  lignes: LigneCommande[];
}

export interface CommandeValiderPayload {
  duree_reservation_heures?: number;
}

export interface ReservationOut {
  poche_id: UUID;
  type_produit: string;
  groupe_sanguin: string | null;
  date_peremption: string;
  ligne_commande_id: UUID | null;
  receveur_id: UUID | null;
}

export interface CommandeValiderResult {
  commande_id: UUID;
  statut: string;
  reservations: ReservationOut[];
}

export interface AffectationLigneReceveur {
  ligne_commande_id: UUID;
  receveur_id: UUID;
  quantite: number;
}

export interface CommandeAffecterPayload {
  affectations: AffectationLigneReceveur[];
}

export interface CommandeServirResult {
  commande_id: UUID;
  statut: string;
  poches: Array<{
    poche_id: UUID;
    receveur_id: UUID;
  }>;
}

export interface ReceveurCreate {
  nom?: string;
  groupe_sanguin?: string;
}

export interface Receveur {
  id: UUID;
  nom: string | null;
  groupe_sanguin: string | null;
  created_at: string;
}

export interface CrossMatchCreate {
  poche_id: UUID;
  receveur_id: UUID;
  resultat: "COMPATIBLE" | "INCOMPATIBLE";
  validateur_id?: UUID;
}

export interface CrossMatch {
  id: UUID;
  poche_id: UUID;
  receveur_id: UUID;
  resultat: "COMPATIBLE" | "INCOMPATIBLE";
  validateur_id: UUID | null;
  created_at: string;
}

// ============================================================================
// HEMOVIGILANCE
// ============================================================================

export interface ActeTransfusionnel {
  id: UUID;
  poche_id: UUID;
  commande_id: UUID | null;
  hopital_id: UUID | null;
  receveur_id: UUID | null;
  date_transfusion: string;
  validateur_id: UUID | null;
  created_at: string;
}

export interface RappelLot {
  id: UUID;
  type_cible: string;
  valeur_cible: string;
  motif: string | null;
  statut: "OUVERT" | "NOTIFIE" | "CONFIRME" | "CLOS";
  updated_at: string;
  notified_at: string | null;
  confirmed_at: string | null;
  closed_at: string | null;
  created_at: string;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface AnalyticsDashboard {
  period: {
    start: string;
    end: string;
  };
  dons_trend: Array<{
    date: string;
    count: number;
  }>;
  stock_distribution: Array<{
    groupe: string;
    count: number;
  }>;
  commandes_status: Array<{
    statut: string;
    count: number;
  }>;
}
