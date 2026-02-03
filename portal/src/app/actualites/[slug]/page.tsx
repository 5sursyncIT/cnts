import { notFound } from "next/navigation";

import { getNewsItem, news } from "@/lib/content/news";

export async function generateStaticParams() {
  return news.map((n) => ({ slug: n.slug }));
}

export default async function NewsDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const item = getNewsItem(slug);
  if (!item) notFound();

  return (
    <main className="bg-zinc-50">
      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900">{item.title}</h1>
        <div className="mt-2 text-xs text-zinc-500">{item.date}</div>
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm leading-6 text-zinc-800">{item.content}</p>
        </div>
      </article>
    </main>
  );
}

