"use client";

import { useEffect, useState } from "react";
import type { Don } from "@cnts/api";

type Procedure = { id: string; don_id: string; statut: string; volume_preleve_ml: number | null };

export default function ApheresisCollection({ don, onSaved }: {
  don: Don; onSaved: () => Promise<void>;
}) {
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volumePreleve, setVolumePreleve] = useState("");
  const [volumeProduit, setVolumeProduit] = useState("");
  const [typeProduit, setTypeProduit] = useState(don.type_don === "PLASMAPHERESE" ? "PFC" : "CP");
  const [peremption, setPeremption] = useState("");

  useEffect(() => {
    fetch(`/api/apherese?donneur_id=${don.donneur_id}&limit=100`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Erreur ${response.status}`);
        const rows: Procedure[] = await response.json();
        setProcedure(rows.find((row) => row.don_id === don.id) || null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Lecture impossible"))
      .finally(() => setLoading(false));
  }, [don.donneur_id, don.id]);

  const submit = async (path: string, body: Record<string, unknown>, method = "POST") => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/${path}`, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!response.ok) {
        const details = await response.json();
        throw new Error(typeof details.detail === "string" ? details.detail : `Erreur ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
      return null;
    } finally {
      setSaving(false);
    }
  };

  return <div className="rounded-lg bg-white p-6 shadow">
    <h2 className="mb-2 text-lg font-semibold text-gray-900">Collecte par aphérèse</h2>
    <p className="mb-4 text-sm text-gray-700">Aucune poche de sang total n’est créée automatiquement. La procédure et le produit réellement collecté doivent être enregistrés avant libération.</p>
    {loading ? <p className="text-sm text-gray-700">Chargement...</p> : !procedure ? (
      <button disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        onClick={async () => {
          const row = await submit("apherese", {
            don_id: don.id, donneur_id: don.donneur_id, type_apherese: don.type_don,
          });
          if (row) setProcedure(row);
        }}>Démarrer la procédure</button>
    ) : procedure.statut === "EN_COURS" ? (
      <form onSubmit={async (event) => {
        event.preventDefault();
        const row = await submit(`apherese/${procedure.id}`, {
          statut: "TERMINE", volume_preleve_ml: Number(volumePreleve),
        }, "PATCH");
        if (row) setProcedure(row);
      }} className="flex flex-wrap items-end gap-3">
        <label htmlFor="volume-preleve" className="text-sm text-gray-800">Volume prélevé (ml)
          <input id="volume-preleve" type="number" min="1" max="2000" required value={volumePreleve}
            onChange={(event) => setVolumePreleve(event.target.value)} className="mt-1 block rounded border p-2" />
        </label>
        <button disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">Terminer la procédure</button>
      </form>
    ) : procedure.statut === "TERMINE" ? (
      <form onSubmit={async (event) => {
        event.preventDefault();
        const row = await submit("poches", {
          don_id: don.id, type_produit: typeProduit, volume_ml: Number(volumeProduit),
          date_peremption: peremption, emplacement_stock: "COLLECTE",
        });
        if (row) { setVolumeProduit(""); setPeremption(""); await onSaved(); }
      }} className="grid gap-3 sm:grid-cols-3">
        <label htmlFor="produit-apherese" className="text-sm text-gray-800">Produit collecté
          <select id="produit-apherese" value={typeProduit} onChange={(event) => setTypeProduit(event.target.value)}
            className="mt-1 block w-full rounded border p-2">
            {(don.type_don === "PLASMAPHERESE" ? ["PFC"] : ["CP", "CGR"])
              .map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label htmlFor="volume-produit" className="text-sm text-gray-800">Volume du produit (ml)
          <input id="volume-produit" type="number" min="1" max="2000" required value={volumeProduit}
            onChange={(event) => setVolumeProduit(event.target.value)} className="mt-1 block w-full rounded border p-2" />
        </label>
        <label htmlFor="peremption-produit" className="text-sm text-gray-800">Date de péremption vérifiée
          <input id="peremption-produit" type="date" min={new Date().toISOString().slice(0, 10)}
            required value={peremption} onChange={(event) => setPeremption(event.target.value)}
            className="mt-1 block w-full rounded border p-2" />
        </label>
        <button disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50 sm:col-span-3">Enregistrer le produit</button>
      </form>
    ) : <p className="text-sm text-red-700">Procédure interrompue : aucun produit ne peut être libéré.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </div>;
}
