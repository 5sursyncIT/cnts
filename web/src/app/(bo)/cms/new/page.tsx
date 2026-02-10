"use client";

import { useCreateArticle, useUpload } from "@cnts/api";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { ArticleForm } from "@/components/cms/article-form";

export default function NewArticlePage() {
  const router = useRouter();
  const { mutate: createArticle, status } = useCreateArticle(apiClient);
  const { mutate: uploadFile, status: uploadStatus } = useUpload(apiClient);

  const handleSubmit = async (data: any) => {
    try {
      await createArticle(data);
      toast.success("Article créé avec succès");
      router.push("/cms");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la création de l'article");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cms" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouvel Article</h1>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <ArticleForm
          onSubmit={handleSubmit}
          onUpload={uploadFile}
          uploadStatus={uploadStatus}
          isSubmitting={status === "loading"}
          onCancel={() => router.push("/cms")}
        />
      </div>
    </div>
  );
}
