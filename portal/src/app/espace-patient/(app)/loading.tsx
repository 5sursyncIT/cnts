// Squelette affiché pendant le chargement des données du donneur (style v2).
const bloc = (h: number, extra: React.CSSProperties = {}) => (
  <div style={{ height: h, borderRadius: "var(--r-lg)", background: "var(--surface-2)", animation: "snSkel 1.4s ease-in-out infinite", ...extra }} />
);

export default function Loading() {
  return (
    <div role="status" aria-label="Chargement de votre espace" style={{ display: "grid", gap: 20 }}>
      <style>{`@keyframes snSkel{0%,100%{opacity:1}50%{opacity:.55}}`}</style>
      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
        {bloc(230, { borderRadius: "var(--r-xl)" })}
        {bloc(230)}
      </div>
      <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 16 }}>
        {bloc(120)}
        {bloc(120)}
        {bloc(120)}
      </div>
    </div>
  );
}
