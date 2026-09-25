"use client";

import { useFaqItem, useUpdateFaqItem, useDeleteFaqItem } from "@cnts/api";
import { useRouter } from "next/navigation";
import { use } from "react";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { FaqForm } from "@/components/faq/faq-form";

export default function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: item, status: loadStatus } = useFaqItem(apiClient, resolvedParams.id);
  const { mutate: updateFaqItem, status: saveStatus } = useUpdateFaqItem(apiClient);
  const { mutate: deleteFaqItem, status: deleteStatus } = useDeleteFaqItem(apiClient);

  if (loadStatus === "loading") {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Question introuvable</p>
        <Link href="/faq" className="text-blue-600 hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const handleSubmit = async (data: any) => {
    try {
      await updateFaqItem({ id: item.id, data });
      toast.success("Question mise à jour");
      router.push("/faq");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette question ?")) return;
    try {
      await deleteFaqItem(item.id);
      toast.success("Question supprimée");
      router.push("/faq");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/faq" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Éditer la question</h1>
      </div>

      <FaqForm
        key={item.id}
        initialData={item as any}
        onSubmit={handleSubmit}
        isSubmitting={saveStatus === "loading"}
        onCancel={() => router.push("/faq")}
        onDelete={handleDelete}
        isDeleting={deleteStatus === "loading"}
      />
    </div>
  );
}
