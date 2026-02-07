import React from "react";
import { Badge } from "./Badge";

interface SyncStatusBadgeProps {
  status: "PENDING" | "SYNCED" | "FAILED";
}

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  switch (status) {
    case "SYNCED":
      return <Badge label="Synchronisé" variant="success" />;
    case "PENDING":
      return <Badge label="En attente" variant="warning" />;
    case "FAILED":
      return <Badge label="Erreur" variant="error" />;
  }
}
