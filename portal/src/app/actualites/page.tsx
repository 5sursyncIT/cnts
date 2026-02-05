import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { logger } from "@/lib/logger";

export const metadata = {
  title: "Actualités — SGI-CNTS"
};

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  let articles: any[] = [];
  try {
    articles = await apiClient.articles.list({ published_only: true });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch articles");
  }

  return (
    <main className="bg-zinc-50 min-h-screen">
      {/* Header */}
      <div className="bg-zinc-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Actualités & Événements</h1>
          <p className="mt-4 text-zinc-300 max-w-2xl mx-auto text-lg">
            Retrouvez toutes les informations sur nos campagnes, événements et communiqués officiels.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-16">
        {articles.length === 0 ? (
          <div className="text-center text-zinc-500 py-12">
            Aucune actualité disponible pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((item) => (
              <article key={item.slug} className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="h-56 bg-zinc-200 w-full relative">
                  {item.image_url ? (
                     <Image
                       src={item.image_url}
                       alt={item.title}
                       fill
                       className="object-cover"
                     />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400 bg-zinc-100">
                      <Calendar className="h-10 w-10 opacity-20" />
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-primary bg-red-50 px-2 py-1 rounded-full">{item.category}</span>
                    <span className="text-xs text-zinc-500">{new Date(item.published_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 mb-3">
                    <Link href={`/actualites/${item.slug}`} className="hover:text-primary transition-colors">
                      {item.title}
                    </Link>
                  </h2>
                  <p className="text-zinc-600 text-sm line-clamp-3 mb-6 flex-1">
                    {item.excerpt}
                  </p>
                  <Link 
                    href={`/actualites/${item.slug}`} 
                    className="text-sm font-medium text-primary hover:underline mt-auto inline-flex items-center"
                  >
                    Lire la suite <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
