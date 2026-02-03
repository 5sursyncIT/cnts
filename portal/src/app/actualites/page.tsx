import Link from "next/link";

import { news } from "@/lib/content/news";

export const metadata = {
  title: "Actualités — SGI-CNTS"
};

export default function NewsPage() {
  return (
    <main className="bg-zinc-50">
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900">Actualités</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-700">
          Dernières informations. Contenu à connecter à un CMS ou une source éditoriale.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {news.map((n) => (
            <article key={n.slug} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">{n.title}</h2>
              <div className="mt-1 text-xs text-zinc-500">{n.date}</div>
              <p className="mt-3 text-sm text-zinc-700">{n.excerpt}</p>
              <div className="mt-4">
                <Link className="text-sm font-medium text-zinc-900 underline" href={`/actualites/${n.slug}`}>
                  Lire la suite
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

