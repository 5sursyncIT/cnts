import Link from "next/link";

import { hasPermission, perm, type User } from "@cnts/rbac";

export function TopNav(props: { user: User }) {
  const canReadDonneurs = hasPermission({ user: props.user, permission: perm("donneurs", "read") });
  const canReadDons = hasPermission({ user: props.user, permission: perm("dons", "read") });
  const canReadLabo = hasPermission({ user: props.user, permission: perm("analyses", "read") }) || 
                      hasPermission({ user: props.user, permission: perm("liberation", "read") });
  const canReadStock = hasPermission({ user: props.user, permission: perm("stock", "read") });
  const canReadDistribution = hasPermission({ user: props.user, permission: perm("distribution", "read") });
  const canReadHemovigilance = hasPermission({ user: props.user, permission: perm("hemovigilance", "read") });
  const canReadAnalytics = hasPermission({ user: props.user, permission: perm("analytics", "read") });
  const canReadAudit = hasPermission({ user: props.user, permission: perm("audit", "read") });
  const canReadAdmin = hasPermission({ user: props.user, permission: perm("administration", "read") });

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-semibold text-zinc-900">
            SGI-CNTS
          </Link>
          <nav className="hidden items-center gap-3 md:flex" aria-label="Navigation principale">
            <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/dashboard">
              Tableau de bord
            </Link>
            {canReadDonneurs && (
              <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/donneurs">
                Donneurs
              </Link>
            )}
            {canReadDons && (
              <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/dons">
                Dons
              </Link>
            )}
            {canReadLabo && (
              <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/laboratoire">
                Laboratoire
              </Link>
            )}
            {canReadStock && (
              <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/stock">
                Stock
              </Link>
            )}
            {canReadDistribution && (
              <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/distribution">
                Distribution
              </Link>
            )}
            {canReadHemovigilance && (
              <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/hemovigilance">
                Hémovigilance
              </Link>
            )}
            {canReadAnalytics && (
              <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/analytics">
                Analyses
              </Link>
            )}
            {canReadAudit && (
              <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/audit">
                Audit
              </Link>
            )}
            {canReadAdmin && (
              <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/admin/roles">
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-zinc-600 md:inline">{props.user.displayName}</span>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

