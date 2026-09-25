"use client";

import { usePartner, useUpdatePartner, useDeletePartner } from "@cnts/api";
import { useRouter } from "next/navigation";
import { use } from "react";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { PartnerForm } from "@/components/partners/partner-form";

export default function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: partner, status: loadStatus } = usePartner(apiClient, resolvedParams.id);
  const { mutate: updatePartner, status: saveStatus } = useUpdatePartner(apiClient);
  const { mutate: deletePartner, status: deleteStatus } = useDeletePartner(apiClient);

  if (loadStatus === "loading") {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Partenaire introuvable</p>
        <Link href="/partenaires" className="text-blue-600 hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const handleSubmit = async (data: any) => {
    try {
      await updatePartner({ id: partner.id, data });
      toast.success("Partenaire mis à jour");
      router.push("/partenaires");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce partenaire ?")) return;
    try {
      await deletePartner(partner.id);
      toast.success("Partenaire supprimé");
      router.push("/partenaires");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/partenaires" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Éditer le partenaire</h1>
      </div>

      <PartnerForm
        key={partner.id}
        initialData={partner as any}
        onSubmit={handleSubmit}
        isSubmitting={saveStatus === "loading"}
        onCancel={() => router.push("/partenaires")}
        onDelete={handleDelete}
        isDeleting={deleteStatus === "loading"}
      />
    </div>
  );
}
