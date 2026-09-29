import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { mediaUrl, type CmsBlock, type CmsInline } from "@/lib/cms";

// Rendu du champ « Rich text (Blocks) » de Strapi, aux mêmes styles que les
// articles statiques de la page /actualites/[slug].
const P: CSSProperties = { fontSize: 16.5, lineHeight: 1.7, color: "var(--ink-700)", marginBottom: 14 };
const H: CSSProperties = { fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.2, margin: "26px 0 12px" };

function Inline({ nodes }: { nodes: CmsInline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.type === "link") {
          return (
            <a key={i} href={n.url} style={{ color: "var(--brand)", textDecoration: "underline" }}>
              <Inline nodes={n.children} />
            </a>
          );
        }
        let el: ReactNode = n.text;
        if (n.code) el = <code>{el}</code>;
        if (n.bold) el = <strong>{el}</strong>;
        if (n.italic) el = <em>{el}</em>;
        if (n.underline) el = <u>{el}</u>;
        if (n.strikethrough) el = <s>{el}</s>;
        return <span key={i}>{el}</span>;
      })}
    </>
  );
}

export function CmsBlocks({ blocks }: { blocks: CmsBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "paragraph":
            return (
              <p key={i} style={P}>
                <Inline nodes={b.children} />
              </p>
            );
          case "heading":
            return (
              <h2 key={i} className="font-serif" style={H}>
                <Inline nodes={b.children} />
              </h2>
            );
          case "list": {
            const List = b.format === "ordered" ? "ol" : "ul";
            return (
              <List key={i} style={{ ...P, paddingLeft: 22 }}>
                {b.children.map((li, j) => (
                  <li key={j}>
                    <Inline nodes={li.children} />
                  </li>
                ))}
              </List>
            );
          }
          case "quote":
            return (
              <blockquote
                key={i}
                style={{
                  borderLeft: "4px solid var(--brand)",
                  background: "var(--red-50)",
                  borderRadius: "0 var(--r-md) var(--r-md) 0",
                  padding: "16px 20px",
                  margin: "8px 0 14px",
                }}
              >
                <p className="font-serif" style={{ fontSize: 18.5, lineHeight: 1.5, color: "var(--ink-900)" }}>
                  <Inline nodes={b.children} />
                </p>
              </blockquote>
            );
          case "code":
            return (
              <pre key={i} style={{ ...P, background: "var(--surface-3)", padding: 14, borderRadius: "var(--r-md)", overflowX: "auto" }}>
                <Inline nodes={b.children} />
              </pre>
            );
          case "image": {
            const src = mediaUrl(b.image);
            if (!src) return null;
            return (
              <div
                key={i}
                style={{ position: "relative", aspectRatio: "16 / 9", borderRadius: "var(--r-md)", overflow: "hidden", margin: "8px 0 18px" }}
              >
                <Image src={src} alt={b.image.alternativeText ?? ""} fill sizes="820px" style={{ objectFit: "cover" }} />
              </div>
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
}
