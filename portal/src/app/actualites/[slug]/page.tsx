import Image from "next/image";
import { notFound } from "next/navigation";
import { getArticle, getArticles, type CmsArticle } from "@/lib/cms";
import { CmsBlocks } from "@/components/cnts/cms-blocks";
import { Button, Card, PageBanner } from "@/components/cnts/primitives";
import { frDate } from "@/components/cnts/format";
import { news } from "@/components/cnts/data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

// L'article vient du CMS (Strapi) en priorité ; à défaut, des articles statiques
// repris de cnts.gouv.sn (data.ts), rendus avec le même gabarit.
async function resolveArticle(slug: string): Promise<CmsArticle | null> {
  return (await getArticle(slug)) ?? news.find((n) => n.slug === slug) ?? null;
}

export async function generateMetadata(props: Props) {
  const { slug } = await props.params;
  const item = await resolveArticle(slug);
  return { title: item ? `${item.title} — CNTS Sénégal` : "Actualité — CNTS Sénégal" };
}

export default async function NewsDetailPage(props: Props) {
  const { slug } = await props.params;
  const item = await resolveArticle(slug);
  if (!item) notFound();

  const others = ((await getArticles({ limit: 3 })) ?? news).filter((n) => n.slug !== slug).slice(0, 2);

  return (
    <div>
      <PageBanner kicker={`${item.cat} · ${frDate(item.date)}`} title={item.title} />
      <article style={{ maxWidth: 820, margin: "0 auto", padding: "var(--gutter)" }}>
        {item.img && (
          <div
            style={{
              position: "relative",
              aspectRatio: "16 / 9",
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
              border: "1px solid var(--line)",
              marginBottom: 32,
              background: "var(--surface-3)",
            }}
          >
            <Image src={item.img} alt={item.title} fill priority sizes="(max-width: 900px) 100vw, 820px" style={{ objectFit: "cover" }} />
          </div>
        )}

        {item.blocks && item.blocks.length > 0 && <CmsBlocks blocks={item.blocks} />}

        {item.body.map((block, i) => (
          <section key={i} style={{ marginBottom: 26 }}>
            {block.h && (
              <h2
                className="font-serif"
                style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.2, marginBottom: 12 }}
              >
                {block.h}
              </h2>
            )}
            {block.p?.map((p, j) => (
              <p key={j} style={{ fontSize: 16.5, lineHeight: 1.7, color: "var(--ink-700)", marginBottom: 14 }}>
                {p}
              </p>
            ))}
            {block.list && (
              <ul style={{ paddingLeft: 22, marginBottom: 14, color: "var(--ink-700)", fontSize: 16.5, lineHeight: 1.7 }}>
                {block.list.map((li, j) => (
                  <li key={j}>{li}</li>
                ))}
              </ul>
            )}
            {block.quote && (
              <blockquote
                style={{
                  borderLeft: "4px solid var(--brand)",
                  background: "var(--red-50)",
                  borderRadius: "0 var(--r-md) var(--r-md) 0",
                  padding: "16px 20px",
                  margin: "8px 0 14px",
                }}
              >
                <p className="font-serif" style={{ fontSize: 18.5, lineHeight: 1.5, color: "var(--ink-900)" }}>
                  « {block.quote.text} »
                </p>
                {block.quote.by && (
                  <footer style={{ marginTop: 8, fontSize: 13.5, fontWeight: 700, color: "var(--brand)" }}>— {block.quote.by}</footer>
                )}
              </blockquote>
            )}
          </section>
        ))}

        {item.gallery && item.gallery.length > 0 && (
          <section style={{ marginTop: 12 }}>
            <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 600, marginBottom: 14 }}>
              En images
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {item.gallery.map((src) => (
                <div
                  key={src}
                  style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: "var(--r-md)", overflow: "hidden", background: "var(--surface-3)" }}
                >
                  <Image src={src} alt="" fill sizes="(max-width: 900px) 50vw, 270px" style={{ objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </section>
        )}

        <div style={{ marginTop: 36 }}>
          <Button variant="outline" icon="chevL" href="/actualites">
            Toutes les actualités
          </Button>
        </div>

        {others.length > 0 && (
          <section style={{ marginTop: 44, paddingTop: 28, borderTop: "1px solid var(--line)" }}>
            <div className="kicker" style={{ marginBottom: 14 }}>
              À lire aussi
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {others.map((n) => (
                <Card key={n.slug} hover href={`/actualites/${n.slug}`} pad={18}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--brand)", marginBottom: 6 }}>
                    {n.cat} · {frDate(n.date, { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.3 }}>{n.title}</div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
