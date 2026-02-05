import { notFound } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';

export default async function NewsDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  let item = null;
  try {
    item = await apiClient.articles.get(slug);
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch article");
  }

  if (!item) notFound();

  return (
    <main className="bg-zinc-50 min-h-screen">
      <article className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold text-primary bg-red-50 px-3 py-1 rounded-full">
              {item.category}
            </span>
            <span className="text-sm text-zinc-500">
              {new Date(item.published_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 leading-tight">
            {item.title}
          </h1>
        </div>

        {item.image_url && (
          <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
            <img src={item.image_url} alt={item.title} className="w-full h-auto object-cover" />
          </div>
        )}

        <div className="prose prose-lg prose-red max-w-none bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm">
           <div className="whitespace-pre-wrap">{item.content}</div>
        </div>
      </article>
    </main>
  );
}
