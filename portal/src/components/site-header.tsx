import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-sm font-semibold text-zinc-900">
          SGI-CNTS
        </Link>
        <nav className="flex items-center gap-4" aria-label="Navigation principale">
          <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/services">
            Services
          </Link>
          <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/equipe">
            Équipe médicale
          </Link>
          <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/actualites">
            Actualités
          </Link>
          <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/contact">
            Contact
          </Link>
          <Link
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            href="/espace-patient"
          >
            Espace patient
          </Link>
        </nav>
      </div>
    </header>
  );
}

