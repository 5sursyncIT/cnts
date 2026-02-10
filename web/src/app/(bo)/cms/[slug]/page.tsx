"use client";

import { useArticle, useUpdateArticle, useDeleteArticle, useUpload } from "@cnts/api";
import { useRouter } from "next/navigation";
import { use } from "react";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { ArticleForm } from "@/components/cms/article-form";

export default function EditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: article, status: loadStatus } = useArticle(apiClient, resolvedParams.slug);
  const { mutate: updateArticle, status: saveStatus } = useUpdateArticle(apiClient);
  const { mutate: deleteArticle, status: deleteStatus } = useDeleteArticle(apiClient);
  const { mutate: uploadFile, status: uploadStatus } = useUpload(apiClient);

  if (loadStatus === "loading") {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Article non trouvé</p>
        <Link href="/cms" className="text-blue-600 hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const handleSubmit = async (data: any) => {
    try {
      await updateArticle({ id: article.id, data });
      toast.success("Article mis à jour avec succès");
      router.push("/cms");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) return;
    try {
      await deleteArticle(article.id);
      toast.success("Article supprimé");
      router.push("/cms");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cms" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Éditer l'Article</h1>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <ArticleForm
          key={article.id}
          initialData={article as any}
          onSubmit={handleSubmit}
          onUpload={uploadFile}
          uploadStatus={uploadStatus}
          isSubmitting={saveStatus === "loading"}
          onCancel={() => router.push("/cms")}
          onDelete={handleDelete}
          isDeleting={deleteStatus === "loading"}
        />
      </div>
    </div>
  );
}
