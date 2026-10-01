export type NavIcon =
  | "dashboard"
  | "donneurs"
  | "collectes"
  | "dons"
  | "laboratoire"
  | "stock"
  | "distribution"
  | "hemovigilance"
  | "analytics"
  | "qualite"
  | "facturation"
  | "audit"
  | "parametrage"
  | "contenus"
  | "systeme";

export type NavLeaf = { label: string; href: string };

export type NavItem = {
  label: string;
  icon: NavIcon;
  enabled?: boolean;
  href?: string;
  children?: NavLeaf[];
};

export type NavSection = { title: string | null; items: NavItem[] };
