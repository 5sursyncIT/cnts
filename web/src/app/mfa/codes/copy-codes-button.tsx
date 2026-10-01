"use client";

import { useState } from "react";
import { Check, Copy, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CopyCodesButton({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        onClick={async () => {
          await navigator.clipboard.writeText(codes.join("\n"));
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Copiés" : "Copier"}
      </Button>
      <Button variant="secondary" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
        Imprimer
      </Button>
    </div>
  );
}
