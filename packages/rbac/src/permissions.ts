import type { Permission, PermissionAction, Role } from "./model";

export type CntsModule =
  | "donneurs"
  | "dons"
  | "analyses"
  | "liberation"
  | "stock"
  | "distribution"
  | "hemovigilance"
  | "analytics"
  | "parametrage"
  | "administration"
  | "audit"
  | "qualite"
  | "facturation"
  | "collectes"
  | "sites";

export function perm(module: CntsModule, action: PermissionAction): Permission {
  return { module, action };
}

export const roles = {
  admin: {
    id: "role_admin",
    name: "Administrateur",
    permissions: [
      perm("donneurs", "read"),
      perm("donneurs", "write"),
      perm("donneurs", "delete"),
      perm("dons", "read"),
      perm("dons", "write"),
      perm("dons", "delete"),
      perm("analyses", "read"),
      perm("analyses", "write"),
      perm("analyses", "delete"),
      perm("liberation", "read"),
      perm("liberation", "validate"),
      perm("stock", "read"),
      perm("stock", "write"),
      perm("stock", "delete"),
      perm("distribution", "read"),
      perm("distribution", "write"),
      perm("distribution", "delete"),
      perm("distribution", "validate"),
      perm("hemovigilance", "read"),
      perm("hemovigilance", "write"),
      perm("analytics", "read"),
      perm("analytics", "write"),
      perm("parametrage", "read"),
      perm("parametrage", "write"),
      perm("administration", "read"),
      perm("administration", "write"),
      perm("administration", "delete"),
      perm("audit", "read"),
      perm("qualite", "read"),
      perm("qualite", "write"),
      perm("facturation", "read"),
      perm("facturation", "write"),
      perm("collectes", "read"),
      perm("collectes", "write"),
      perm("sites", "read"),
      perm("sites", "write")
    ]
  } satisfies Role,
  agentStock: {
    id: "role_agent_stock",
    name: "Agent Stock",
    permissions: [perm("stock", "read"), perm("stock", "write")]
  } satisfies Role,
  technicienLabo: {
    id: "role_technicien_labo",
    name: "Technicien de laboratoire",
    permissions: [
      perm("donneurs", "read"), perm("dons", "read"), perm("dons", "write"),
      perm("analyses", "read"), perm("analyses", "write"), perm("liberation", "read"),
      perm("stock", "read"), perm("stock", "write")
    ]
  } satisfies Role,
  agentDistribution: {
    id: "role_agent_distribution",
    name: "Agent de distribution",
    permissions: [
      perm("stock", "read"), perm("distribution", "read"), perm("distribution", "write"),
      perm("hemovigilance", "read"), perm("hemovigilance", "write")
    ]
  } satisfies Role,
  agentAccueil: {
    id: "role_agent_accueil",
    name: "Agent d'accueil",
    permissions: [
      perm("donneurs", "read"), perm("donneurs", "write"), perm("dons", "read"),
      perm("dons", "write"), perm("collectes", "read"), perm("collectes", "write")
    ]
  } satisfies Role,
  medecin: {
    id: "role_medecin",
    name: "Médecin",
    permissions: [
      perm("donneurs", "read"), perm("dons", "read"), perm("dons", "write"), perm("analyses", "read"),
      perm("liberation", "read"), perm("distribution", "read"), perm("hemovigilance", "read")
    ]
  } satisfies Role,
  biologiste: {
    id: "role_biologiste",
    name: "Biologiste",
    permissions: [perm("analyses", "read"), perm("analyses", "write"), perm("liberation", "validate")]
  } satisfies Role,
  lectureSeule: {
    id: "role_lecture_seule",
    name: "Lecture seule",
    permissions: [
      perm("donneurs", "read"),
      perm("dons", "read"),
      perm("analyses", "read"),
      perm("liberation", "read"),
      perm("stock", "read"),
      perm("distribution", "read"),
      perm("audit", "read")
    ]
  } satisfies Role
};
