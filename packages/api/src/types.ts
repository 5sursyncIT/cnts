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
  date_naissance?: string;
  adresse?: string;
  region?: string;
  departement?: string;
  telephone?: string;
  email?: string;
  profession?: string;
  groupe_sanguin?: string;
}

export interface DonneurUpdate {
  nom?: string;
  prenom?: string;
  sexe?: "H" | "F";
  date_naissance?: string | null;
  adresse?: string | null;
  region?: string | null;
  departement?: string | null;
  telephone?: string | null;
  email?: string | null;
  profession?: string | null;
  groupe_sanguin?: string | null;
  cni?: string | null;
}

export interface Donneur {
  id: UUID;
  // Ni le CNI ni son empreinte (cni_hash) ne sont exposés par l'API (RGPD).
  nom: string;
  prenom: string;
  sexe: "H" | "F";
  date_naissance: string | null;
  adresse: string | null;
  region: string | null;
  departement: string | null;
  telephone: string | null;
  email: string | null;
  profession: string | null;
  groupe_sanguin: string | null;
  dernier_don: string | null; // ISO date
  numero_carte: string | null; // Donor card number (unique identifier)
  created_at?: string; // ISO datetime
}

export interface EligibiliteResponse {
  eligible: boolean;
  eligible_le: string | null; // ISO date
  raison: string | null;
  delai_jours: number | null;
  age: number | null;
}

// ============================================================================
// FIDELISATION - CARTES DONNEUR
// ============================================================================

export interface CarteDonneurCreate {
  donneur_id: UUID;
  numero_carte: string;
}

export interface CarteDonneur {
  id: UUID;
  donneur_id: UUID;
  numero_carte: string;
  qr_code_data: string | null;
  niveau: string;
  points: number;
  total_dons: number;
  date_premier_don: string | null;
  date_dernier_don: string | null;
  is_active: boolean;
  created_at: string;
}

// ============================================================================
// DONS
// ============================================================================

export interface DonCreate extends IdempotencyPayload {
  donneur_id: UUID;
  date_don: string; // ISO date
  type_don: string;
  ignorer_eligibilite?: boolean;
  motif_derogation?: string;
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
  statut_stock: "EN_STOCK" | "FRACTIONNEE" | "RESERVEE" | "DISTRIBUEE" | "DETRUITE" | "RAPPELEE";
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

export interface ExpirationRuleBase {
  product_type: string;
  preservation_type: string;
  min_temp: number;
  max_temp: number;
  shelf_life_value: number;
  shelf_life_unit: string;
  is_active: boolean;
  modified_by?: string | null;
}

export interface ExpirationRuleCreate extends ExpirationRuleBase { }

export interface ExpirationRuleUpdate extends ExpirationRuleBase { }

export interface ExpirationRule extends ExpirationRuleBase {
  id: UUID;
  version: number;
  created_at: string;
  updated_at: string;
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

export interface HopitalUpdate {
  nom?: string;
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

export interface CommandeConfirmationPayload {
  validateur_id?: UUID;
  note?: string;
}

export interface CommandeEvent {
  id: UUID;
  aggregate_type: string;
  aggregate_id: UUID;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
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
  prenom?: string;
  sexe?: "H" | "F";
  date_naissance?: string;
  adresse?: string;
  telephone?: string;
  hopital_id?: UUID;
  groupe_sanguin?: string;
}

export interface ReceveurUpdate {
  nom?: string;
  prenom?: string;
  sexe?: "H" | "F";
  date_naissance?: string;
  adresse?: string;
  telephone?: string;
  hopital_id?: UUID;
  groupe_sanguin?: string;
}

export interface Receveur {
  id: UUID;
  nom: string | null;
  prenom: string | null;
  sexe: "H" | "F" | null;
  date_naissance: string | null;
  adresse: string | null;
  telephone: string | null;
  hopital_id: UUID | null;
  hopital?: Hopital;
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
  din?: string;
  type_produit?: string;
  lot?: string;
}

export interface RappelCreate {
  type_cible: "DIN" | "LOT";
  valeur_cible: string;
  motif?: string;
}

export interface RappelAutoCreate {
  type_cible: "DIN" | "LOT";
  valeur_cible: string;
  motif?: string;
  source?: string;
}

export interface RappelActionCreate {
  validateur_id?: UUID;
  note?: string;
}

export interface RappelAction {
  id: UUID;
  rappel_id: UUID;
  action: string;
  validateur_id: UUID | null;
  note: string | null;
  created_at: string;
}

export interface ImpactRappel {
  poche_id: UUID;
  don_id: UUID;
  din: string;
  type_produit: string;
  lot: string | null;
  statut_distribution: string;
  hopital_id: UUID | null;
  receveur_id: UUID | null;
  commande_id: UUID | null;
  date_transfusion: string | null;
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

export interface RappelStatutStat {
  statut: string;
  total: number;
}

export interface TransfusionHopitalStat {
  hopital_id: UUID | null;
  total: number;
}

export interface RappelLotStat {
  lot: string | null;
  total: number;
}

export interface RapportAutorite {
  generated_at: string;
  rappels_par_statut: RappelStatutStat[];
  transfusions_par_hopital: TransfusionHopitalStat[];
  rappels_par_lot: RappelLotStat[];
}

export interface PartenaireEvent {
  id: UUID;
  aggregate_type: string;
  aggregate_id: UUID;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface PartenaireFlux {
  events: PartenaireEvent[];
  next_cursor?: string | null;
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

// ============================================================================
// CONTACT (formulaire du portail)
// ============================================================================

export type ContactMessageStatus = "NOUVEAU" | "TRAITE" | "ARCHIVE";

export interface ContactMessageCreate {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string;
  message: string;
  /** Pot de miel anti-robots : laisser vide. */
  website?: string;
}

export interface ContactMessage {
  id: UUID;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export type UserRole = "admin" | "biologiste" | "technicien_labo" | "agent_distribution" | "agent_accueil" | "PATIENT";

export interface User {
  id: UUID;
  email: string;
  is_active: boolean;
  role: UserRole;
  mfa_enabled: boolean;
  mfa_enabled_at: string | null;
  mfa_disabled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  role: UserRole;
  is_active?: boolean;
}

export interface UserUpdate {
  email?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface PasswordResetPayload {
  password: string;
}

export interface PasswordResetResult {
  user_id: UUID;
  success: boolean;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export type TimeGranularity = "day" | "week" | "month";

export interface TrendDataPoint {
  date: string;  // ISO date
  value: number;
  label?: string;
}

export interface TrendResponse {
  data: TrendDataPoint[];
  granularity?: string;
  product_type?: string;
}

export interface KPIMetric {
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  change_percent: number;
  previous_value: number;
}

export interface StockBreakdownItem {
  type_produit: string;
  available: number;
  reserved: number;
  distributed: number;
  non_distribuable: number;
}

export interface StockBreakdownResponse {
  breakdown: StockBreakdownItem[];
}

export interface AnalyticsDashboardResponse {
  period: {
    start: string;  // ISO date
    end: string;    // ISO date
  };
  dons_trend: Array<{ date: string; count: number }>;
  stock_distribution: Array<{ groupe: string; count: number }>;
  commandes_status: Array<{ statut: string; count: number }>;
}

export type ReportType = "monthly" | "compliance" | "kpi" | "activity" | "stock";
export type ReportFormat = "pdf" | "excel" | "csv";
export type ReportStatus = "pending" | "ready" | "failed";

export interface ReportMetadata {
  id: UUID;
  type: ReportType;
  period_start: string;  // ISO date
  period_end: string;    // ISO date
  format: ReportFormat;
  status: ReportStatus;
  download_url?: string;
  created_at: string;
}

export interface ReportGenerateRequest {
  type: ReportType;
  start_date: string;  // ISO date
  end_date: string;    // ISO date
  format: ReportFormat;
}

// ============================================================================
// COLLECTES
// ============================================================================

export type CampagneStatut = "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";
export type CampagneType = "FIXE" | "MOBILE" | "ENTREPRISE" | "UNIVERSITE";
export type InscriptionStatut = "INSCRIT" | "PRESENT" | "PRELEVE" | "ABSENT" | "ANNULE";

export type CampagneCollecte = {
  id: UUID;
  code: string;
  nom: string;
  site_id: UUID | null;
  type_campagne: CampagneType;
  lieu: string | null;
  adresse: string | null;
  latitude: number | null;
  longitude: number | null;
  date_debut: string;
  date_fin: string;
  objectif_dons: number | null;
  statut: CampagneStatut;
  responsable_id: UUID | null;
  materiel_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CampagneCollecteUpdate = Partial<
  Pick<CampagneCollecte, "nom" | "lieu" | "adresse" | "date_debut" | "date_fin" | "objectif_dons" | "materiel_notes">
>;

export type InscriptionCollecte = {
  id: UUID;
  campagne_id: UUID;
  donneur_id: UUID | null;
  nom: string | null;
  telephone: string | null;
  creneau: string | null;
  statut: InscriptionStatut;
  created_at: string;
};

export type InscriptionCollecteCreate = {
  donneur_id?: UUID;
  nom?: string;
  telephone?: string;
  creneau?: string;
};

export type BilanCampagne = {
  campagne_id: UUID;
  code: string;
  objectif_dons: number | null;
  inscrits: number;
  presents: number;
  preleves: number;
  absents: number;
  taux_presence: number;
  taux_realisation: number | null;
};

// ============================================================================
// EIR
// ============================================================================

export type TypeEIR =
  | "REACTION_FEBRILE"
  | "ALLERGIQUE"
  | "HEMOLYTIQUE_AIGUE"
  | "TACO"
  | "TRALI"
  | "INFECTION_BACTERIENNE"
  | "INCOMPATIBILITE_ABO"
  | "AUTRE";
export type GraviteEIR = "GRADE_1" | "GRADE_2" | "GRADE_3" | "GRADE_4";
export type ImputabiliteEIR = "CERTAINE" | "PROBABLE" | "POSSIBLE" | "DOUTEUSE" | "EXCLUE";
export type EvolutionEIR = "GUERISON_SANS_SEQUELLE" | "SEQUELLE" | "DECES" | "EN_COURS";
export type StatutInvestigationEIR = "OUVERTE" | "EN_COURS" | "CLOTUREE";

export type EIR = {
  id: UUID;
  acte_transfusionnel_id: UUID;
  receveur_id: UUID;
  poche_id: UUID;
  type_eir: TypeEIR;
  gravite: GraviteEIR;
  imputabilite: ImputabiliteEIR;
  delai_apparition_minutes: number | null;
  symptomes: string | null;
  conduite_tenue: string | null;
  evolution: EvolutionEIR;
  declarant_id: UUID | null;
  date_declaration: string | null;
  statut_investigation: StatutInvestigationEIR;
  conclusion: string | null;
  created_at: string;
};

export type EIRCreate = {
  acte_transfusionnel_id: UUID;
  type_eir: TypeEIR;
  gravite: GraviteEIR;
  imputabilite: ImputabiliteEIR;
  delai_apparition_minutes?: number;
  symptomes?: string;
  conduite_tenue?: string;
  evolution?: EvolutionEIR;
};

export type EIRUpdate = {
  imputabilite?: ImputabiliteEIR;
  conduite_tenue?: string;
  evolution?: EvolutionEIR;
  statut_investigation?: StatutInvestigationEIR;
  conclusion?: string;
};

export type StatistiquesEIR = {
  total: number;
  par_type: Record<string, number>;
  par_gravite: Record<string, number>;
  investigations_ouvertes: number;
};

export type ReservationCommande = {
  reservation_id: UUID;
  ligne_commande_id: UUID | null;
  poche_id: UUID;
  din: string;
  type_produit: string;
  groupe_sanguin: string | null;
  date_peremption: string;
  expires_at: string | null;
  receveur_id: UUID | null;
  crossmatch_requis: boolean;
  crossmatch: "COMPATIBLE" | "INCOMPATIBLE" | null;
};

export type MotifDestruction =
  | "PEREMPTION"
  | "SEROLOGIE_POSITIVE"
  | "NON_CONFORMITE"
  | "RUPTURE_CHAINE_FROID"
  | "RAPPEL"
  | "CASSE_FUITE"
  | "AUTRE";

export type PocheDestruction = { motif: MotifDestruction; commentaire?: string };

export type EtiquetteProduit = {
  poche_id: UUID;
  don_id: UUID;
  din: string;
  type_produit: string;
  code_produit_isbt: string | null;
  lot: string | null;
  division: number | null;
  date_prelevement: string;
  date_peremption: string;
  groupe_sanguin: string | null;
  statut_stock: string;
  statut_distribution: string;
  payload: { datamatrix_content?: string } & Record<string, unknown>;
};
