"use client";

import { useCreatePartner } from "@cnts/api";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { PartnerForm } from "@/components/partners/partner-form";

export default function NewPartnerPage() {
  const router = useRouter();
  const { mutate: createPartner, status } = useCreatePartner(apiClient);

  const handleSubmit = async (data: any) => {
    try {
      await createPartner(data);
      toast.success("Partenaire ajouté avec succès");
      router.push("/partenaires");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'ajout du partenaire");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/partenaires" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau partenaire</h1>
      </div>

      <PartnerForm
        onSubmit={handleSubmit}
        isSubmitting={status === "loading"}
        onCancel={() => router.push("/partenaires")}
      />
    </div>
  );
}
