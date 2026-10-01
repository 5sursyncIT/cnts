"use client";

import { useEffect } from "react";

import { ButtonLink, Button, Card, ErrorState } from "@/components/ui";

export default function BackOfficeError(props: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Erreur Back Office :", props.error);
  }, [props.error]);

  return (
    <Card className="mx-auto max-w-xl">
      <ErrorState
        title="Cette page n’a pas pu s’afficher"
        message={
          <>
            Une erreur inattendue est survenue ; vos données n’ont pas été modifiées.
            {props.error.digest ? <span className="mt-1 block font-mono text-xs text-gray-400">Réf. {props.error.digest}</span> : null}
          </>
        }
      />
      <div className="flex justify-center gap-3 pb-8">
        <Button onClick={props.reset}>Réessayer</Button>
        <ButtonLink href="/dashboard" variant="secondary">Tableau de bord</ButtonLink>
      </div>
    </Card>
  );
}
