import { SearchX } from "lucide-react";

import { ButtonLink, Card, EmptyState } from "@/components/ui";

export default function BackOfficeNotFound() {
  return (
    <Card className="mx-auto max-w-xl">
      <EmptyState
        icon={<SearchX className="h-6 w-6" />}
        title="Page introuvable"
        description="Cette page n’existe pas ou a été déplacée."
        action={<ButtonLink href="/dashboard">Retour au tableau de bord</ButtonLink>}
      />
    </Card>
  );
}
