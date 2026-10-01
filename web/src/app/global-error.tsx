"use client";

export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", textAlign: "center" }}>
        <h1>Le Back Office a rencontré une erreur</h1>
        <p>Rechargez la page. Si le problème persiste, contactez l’administrateur.</p>
        {props.error.digest ? <p style={{ fontFamily: "monospace", color: "#888" }}>Réf. {props.error.digest}</p> : null}
        <button onClick={props.reset} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
          Réessayer
        </button>
      </body>
    </html>
  );
}
