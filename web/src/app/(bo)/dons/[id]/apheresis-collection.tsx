"use client";

import { useEffect, useState } from "react";
import type { Don } from "@cnts/api";
import { toast } from "sonner";

import { Alert, Button, Card, CardBody, CardHeader, Field, Input, LoadingState, Select } from "@/components/ui";

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

  return (
    <Card>
      <CardHeader
        title="Collecte par aphérèse"
        description="Aucune poche de sang total n’est créée automatiquement. La procédure et le produit réellement collecté doivent être enregistrés avant libération."
      />
      <CardBody className="space-y-4">
        {loading ? (
          <LoadingState rows={2} className="p-0" />
        ) : !procedure ? (
          <Button
            loading={saving}
            onClick={async () => {
              const row = await submit("apherese", {
                don_id: don.id, donneur_id: don.donneur_id, type_apherese: don.type_don,
              });
              if (row) {
                setProcedure(row);
                toast.success("Procédure d’aphérèse démarrée");
              }
            }}
          >
            Démarrer la procédure
          </Button>
        ) : procedure.statut === "EN_COURS" ? (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const row = await submit(`apherese/${procedure.id}`, {
                statut: "TERMINE", volume_preleve_ml: Number(volumePreleve),
              }, "PATCH");
              if (row) {
                setProcedure(row);
                toast.success("Procédure terminée");
              }
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <Field label="Volume prélevé (ml)" required className="w-full sm:w-56">
              <Input
                id="volume-preleve"
                type="number"
                min="1"
                max="2000"
                inputMode="numeric"
                value={volumePreleve}
                onChange={(event) => setVolumePreleve(event.target.value)}
              />
            </Field>
            <Button type="submit" loading={saving}>
              Terminer la procédure
            </Button>
          </form>
        ) : procedure.statut === "TERMINE" ? (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const row = await submit("poches", {
                don_id: don.id, type_produit: typeProduit, volume_ml: Number(volumeProduit),
                date_peremption: peremption, emplacement_stock: "COLLECTE",
              });
              if (row) {
                setVolumeProduit("");
                setPeremption("");
                toast.success("Produit enregistré");
                await onSaved();
              }
            }}
            className="grid gap-4 sm:grid-cols-3"
          >
            <Field label="Produit collecté">
              <Select id="produit-apherese" value={typeProduit} onChange={(event) => setTypeProduit(event.target.value)}>
                {(don.type_don === "PLASMAPHERESE" ? ["PFC"] : ["CP", "CGR"])
                  .map((type) => <option key={type} value={type}>{type}</option>)}
              </Select>
            </Field>
            <Field label="Volume du produit (ml)" required>
              <Input
                id="volume-produit"
                type="number"
                min="1"
                max="2000"
                inputMode="numeric"
                value={volumeProduit}
                onChange={(event) => setVolumeProduit(event.target.value)}
              />
            </Field>
            <Field label="Date de péremption vérifiée" required>
              <Input
                id="peremption-produit"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={peremption}
                onChange={(event) => setPeremption(event.target.value)}
              />
            </Field>
            <div className="flex justify-end sm:col-span-3">
              <Button type="submit" loading={saving}>
                Enregistrer le produit
              </Button>
            </div>
          </form>
        ) : (
          <Alert tone="danger">Procédure interrompue : aucun produit ne peut être libéré.</Alert>
        )}
        {error && <Alert tone="danger">{error}</Alert>}
      </CardBody>
    </Card>
  );
}
