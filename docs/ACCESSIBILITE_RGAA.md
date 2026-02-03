# Accessibilité (RGAA niveau AA) — Frontends

Objectif : conformité RGAA AA sur le Back Office (`web/`) et le Portail patient (`portal/`).

## Principes
- Navigation clavier complète, focus visible, ordre logique.
- Labels explicites pour tous les champs de formulaire.
- Titres hiérarchisés (`h1` unique par page), landmarks (`header`, `nav`, `main`, `footer`).
- Contrastes conformes AA, pas d’information portée uniquement par la couleur.
- Messages d’erreur annoncés (`role="alert"` ou équivalent).

## Checklist rapide
- Liens “Aller au contenu” présents.
- États focus visibles sur boutons, liens, champs.
- `aria-label` ou texte visible sur les actions icon-only.
- Tables : en-têtes `th` avec `scope`.
- Modales/menus : focus trap et fermeture au clavier.

## Contrôle automatisé
- ESLint a11y activé (plugin `jsx-a11y`).
- Tests d’accessibilité recommandés : axe-core (à intégrer en e2e).
