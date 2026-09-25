"use client";

import { useContactMessages, useSetContactMessageStatus, type ContactMessageStatus } from "@cnts/api";
import { Mail, Phone, Inbox } from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { ContentNav } from "@/components/content-nav";

const FILTERS: { value: ContactMessageStatus | ""; label: string }[] = [
  { value: "NOUVEAU", label: "Nouveaux" },
  { value: "TRAITE", label: "Traités" },
  { value: "ARCHIVE", label: "Archivés" },
  { value: "", label: "Tous" },
];

const STATUS_LABEL: Record<ContactMessageStatus, string> = {
  NOUVEAU: "Nouveau",
  TRAITE: "Traité",
  ARCHIVE: "Archivé",
};

export default function MessagesPage() {
  const [filter, setFilter] = useState<ContactMessageStatus | "">("NOUVEAU");
  const { data: messages, status, refetch } = useContactMessages(apiClient, {
    status: filter || undefined,
    limit: 200,
  });
  const setStatus = useSetContactMessageStatus(apiClient);

  const move = async (id: string, next: ContactMessageStatus) => {
    await setStatus.mutate({ id, status: next });
    await refetch();
  };

  return (
    <div className="space-y-8">
      <ContentNav />
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Messages de contact</h1>
        <p className="text-zinc-500 mt-1">
          Messages envoyés depuis le formulaire de la page publique{" "}
          <span className="font-mono text-xs">/contact</span>.
        </p>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {status === "loading" && <p className="text-sm text-zinc-500">Chargement…</p>}
      {status === "error" && (
        <p className="text-sm text-red-600">Impossible de charger les messages.</p>
      )}
      {status === "success" && (messages ?? []).length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-zinc-500">
          <Inbox className="h-8 w-8" />
          Aucun message.
        </div>
      )}

      <div className="space-y-4">
        {(messages ?? []).map((m) => (
          <article key={m.id} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">{m.subject}</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {m.name} ·{" "}
                  {new Date(m.created_at).toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <Badge variant={m.status === "NOUVEAU" ? "default" : "secondary"}>
                {STATUS_LABEL[m.status]}
              </Badge>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-zinc-700">{m.message}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-4 text-sm">
              <a
                href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                className="inline-flex items-center gap-1.5 font-medium text-zinc-900 hover:underline"
              >
                <Mail className="h-4 w-4" /> {m.email}
              </a>
              {m.phone && (
                <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1.5 text-zinc-700">
                  <Phone className="h-4 w-4" /> {m.phone}
                </a>
              )}
              <div className="ml-auto flex gap-2">
                {m.status !== "TRAITE" && (
                  <button
                    type="button"
                    onClick={() => move(m.id, "TRAITE")}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-800"
                  >
                    Marquer traité
                  </button>
                )}
                {m.status !== "ARCHIVE" && (
                  <button
                    type="button"
                    onClick={() => move(m.id, "ARCHIVE")}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50"
                  >
                    Archiver
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
