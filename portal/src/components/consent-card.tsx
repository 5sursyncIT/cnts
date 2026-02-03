"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConsentCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(value: "accepted" | "declined") {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("value", value);
      const res = await fetch("/api/consent", { method: "POST", body: form });
      if (!res.ok) throw new Error("save_failed");
      router.refresh();
    } catch {
      setError("Impossible d’enregistrer votre choix.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">Consentement explicite (GDPR)</h2>
      <p className="mt-2 text-sm text-zinc-700">
        Pour accéder aux données de santé (comptes-rendus, documents, messagerie), votre consentement est requis.
      </p>
      {error ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={loading}
          onClick={() => save("accepted")}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          J’accepte le traitement
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => save("declined")}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
        >
          Je refuse
        </button>
      </div>
    </div>
  );
}

