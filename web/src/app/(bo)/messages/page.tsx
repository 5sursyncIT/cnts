"use client";

import { useContactMessages, useSetContactMessageStatus, type ContactMessageStatus } from "@cnts/api";
import { Archive, Check, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { ContentNav } from "@/components/content-nav";
import { cn } from "@/lib/utils";

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
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { data: messages, status, refetch } = useContactMessages(apiClient, {
    status: filter || undefined,
    limit: 200,
  });
  const setStatus = useSetContactMessageStatus(apiClient);

  const move = async (id: string, next: ContactMessageStatus) => {
    setPendingId(id);
    try {
      await setStatus.mutate({ id, status: next });
      toast.success(next === "TRAITE" ? "Message marqué comme traité" : "Message archivé");
      await refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Impossible de mettre à jour le message."));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ContentNav />
      <PageHeader
        title="Messages de contact"
        description={
          <>
            Messages envoyés depuis le formulaire de la page publique <span className="font-mono text-xs">/contact</span>.
          </>
        }
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f.value
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {status === "loading" && (
        <Card>
          <LoadingState />
        </Card>
      )}
      {status === "error" && (
        <Card>
          <ErrorState message="Impossible de charger les messages." onRetry={refetch} />
        </Card>
      )}
      {status === "success" && (messages ?? []).length === 0 && (
        <Card>
          <EmptyState title="Aucun message" description="Aucun message ne correspond à ce filtre." />
        </Card>
      )}

      {status === "success" && (
        <div className="space-y-4">
          {(messages ?? []).map((m) => (
            <Card key={m.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900">{m.subject}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {m.name} ·{" "}
                    {new Date(m.created_at).toLocaleString("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <Badge tone={m.status === "NOUVEAU" ? "info" : "neutral"} dot>
                  {STATUS_LABEL[m.status]}
                </Badge>
              </div>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm text-gray-800">{m.message}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 text-sm">
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                  className="inline-flex min-w-0 items-center gap-1.5 break-all font-medium text-blue-700 hover:underline"
                >
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" /> {m.email}
                </a>
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1.5 text-gray-700 hover:underline">
                    <Phone className="h-4 w-4" aria-hidden="true" /> {m.phone}
                  </a>
                )}
                <div className="ml-auto flex flex-wrap gap-2">
                  {m.status !== "TRAITE" && (
                    <Button
                      size="sm"
                      variant="success"
                      loading={pendingId === m.id}
                      disabled={pendingId !== null}
                      icon={<Check className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => move(m.id, "TRAITE")}
                    >
                      Marquer traité
                    </Button>
                  )}
                  {m.status !== "ARCHIVE" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={pendingId !== null}
                      icon={<Archive className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => move(m.id, "ARCHIVE")}
                    >
                      Archiver
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
