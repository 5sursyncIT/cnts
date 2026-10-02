import { Card } from "@/components/cnts/primitives";

/** Mise en page des écrans courts du compte (confirmation d'email, mot de passe). */
export function AuthCard({ title, intro, children }: { title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ padding: "40px var(--gutter) 80px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", display: "grid", gap: 18 }}>
        <div className="kicker">Espace donneur</div>
        <Card pad={30} style={{ display: "grid", gap: 18 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>{title}</h1>
          {intro && <p style={{ color: "var(--ink-600)", lineHeight: 1.6 }}>{intro}</p>}
          {children}
        </Card>
      </div>
    </section>
  );
}
