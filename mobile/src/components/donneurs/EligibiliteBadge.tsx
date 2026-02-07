import React from "react";
import { Badge } from "../ui/Badge";
import { checkEligibilite } from "../../utils/date";

interface Props {
  sexe: "H" | "F";
  dernierDon: string | null;
}

export function EligibiliteBadge({ sexe, dernierDon }: Props) {
  if (!dernierDon) {
    return <Badge label="Éligible" variant="success" />;
  }

  const result = checkEligibilite(sexe, dernierDon);
  if (result.eligible) {
    return <Badge label="Éligible" variant="success" />;
  }
  return <Badge label={`J-${result.joursRestants}`} variant="warning" />;
}
