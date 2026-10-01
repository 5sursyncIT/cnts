import { hasPermission, perm, type User } from "@cnts/rbac";

import type { NavSection } from "./nav-types";

/**
 * Menu filtré selon les permissions de l'utilisateur. Calculé côté serveur ;
 * le rendu (repli des groupes, tiroir mobile) est assuré par <BackOfficeShell>.
 */
export function buildNavigation(user: User): NavSection[] {
  const can = (resource: Parameters<typeof perm>[0]) => hasPermission({ user, permission: perm(resource, "read") });

  const sections: NavSection[] = [
    {
      title: null,
      items: [{ label: "Tableau de bord", href: "/dashboard", icon: "dashboard" }],
    },
    {
      title: "Chaîne transfusionnelle",
      items: [
        {
          label: "Donneurs",
          icon: "donneurs",
          enabled: can("donneurs"),
          children: [
            { label: "Liste des donneurs", href: "/donneurs" },
            { label: "Fidélisation", href: "/donneurs/fidelisation" },
          ],
        },
        { label: "Collectes", href: "/collectes", icon: "collectes", enabled: can("collectes") },
        { label: "Dons", href: "/dons", icon: "dons", enabled: can("dons") },
        {
          label: "Laboratoire",
          icon: "laboratoire",
          enabled: can("analyses") || can("liberation"),
          children: [
            { label: "Vue d’ensemble", href: "/laboratoire" },
            { label: "Saisie des analyses", href: "/laboratoire/analyses" },
            { label: "Libération", href: "/laboratoire/liberation" },
          ],
        },
        {
          label: "Stock",
          icon: "stock",
          enabled: can("stock"),
          children: [
            { label: "Poches", href: "/stock" },
            { label: "Fractionnement", href: "/stock/fractionnement" },
            { label: "Transferts", href: "/stock/transferts" },
            { label: "Règles de stock", href: "/stock/regles" },
            { label: "Étiquetage ISBT 128", href: "/production/etiquetage" },
          ],
        },
        {
          label: "Distribution",
          icon: "distribution",
          enabled: can("distribution"),
          children: [
            { label: "Vue d’ensemble", href: "/distribution" },
            { label: "Commandes", href: "/distribution/commandes" },
            { label: "Hôpitaux", href: "/distribution/hopitaux" },
            { label: "Receveurs", href: "/distribution/receveurs" },
          ],
        },
        {
          label: "Hémovigilance",
          icon: "hemovigilance",
          enabled: can("hemovigilance"),
          children: [
            { label: "Transfusions", href: "/hemovigilance/transfusions" },
            { label: "Rappels de lots", href: "/hemovigilance/rappels" },
            { label: "Événements indésirables", href: "/hemovigilance/eir" },
          ],
        },
      ],
    },
    {
      title: "Pilotage",
      items: [
        {
          label: "Analyses statistiques",
          icon: "analytics",
          enabled: can("analytics"),
          children: [
            { label: "Vue d’ensemble", href: "/analytics" },
            { label: "Indicateurs", href: "/analytics/kpi" },
            { label: "Rapports", href: "/analytics/rapports" },
          ],
        },
        {
          label: "Qualité",
          icon: "qualite",
          enabled: can("qualite"),
          children: [
            { label: "Système qualité", href: "/qualite" },
            { label: "Équipements", href: "/qualite/equipements" },
          ],
        },
        { label: "Facturation", href: "/facturation", icon: "facturation", enabled: can("facturation") },
        { label: "Audit", href: "/audit", icon: "audit", enabled: can("audit") },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          label: "Paramétrage",
          icon: "parametrage",
          enabled: can("parametrage"),
          children: [
            { label: "Utilisateurs", href: "/parametrage/utilisateurs" },
            { label: "Sites", href: "/parametrage/sites" },
            { label: "Règles produits", href: "/parametrage/regles-produits" },
            { label: "Péremption", href: "/parametrage/peremption" },
            { label: "Recettes", href: "/parametrage/recettes" },
          ],
        },
        {
          label: "Contenus & messages",
          icon: "contenus",
          children: [
            { label: "Contenus (Strapi)", href: "/cms" },
            { label: "Messages de contact", href: "/messages" },
          ],
        },
        {
          label: "Système",
          icon: "systeme",
          enabled: can("administration"),
          children: [
            { label: "Rôles & permissions", href: "/admin/roles" },
            { label: "Supervision", href: "/monitoring" },
          ],
        },
      ],
    },
  ];

  return sections
    .map((s) => ({ ...s, items: s.items.filter((i) => i.enabled !== false) }))
    .filter((s) => s.items.length > 0);
}
