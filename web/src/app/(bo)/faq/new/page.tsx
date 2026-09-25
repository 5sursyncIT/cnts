"use client";

import { useCreateFaqItem } from "@cnts/api";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { FaqForm } from "@/components/faq/faq-form";

export default function NewFaqPage() {
  const router = useRouter();
  const { mutate: createFaqItem, status } = useCreateFaqItem(apiClient);

  const handleSubmit = async (data: any) => {
    try {
      await createFaqItem(data);
      toast.success("Question créée avec succès");
      router.push("/faq");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la création de la question");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/faq" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle question</h1>
      </div>

      <FaqForm
        onSubmit={handleSubmit}
        isSubmitting={status === "loading"}
        onCancel={() => router.push("/faq")}
      />
    </div>
  );
}
