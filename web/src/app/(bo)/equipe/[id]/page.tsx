"use client";

import { useTeamMember, useUpdateTeamMember, useDeleteTeamMember } from "@cnts/api";
import { useRouter } from "next/navigation";
import { use } from "react";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { TeamForm } from "@/components/team/team-form";

export default function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: member, status: loadStatus } = useTeamMember(apiClient, resolvedParams.id);
  const { mutate: updateMember, status: saveStatus } = useUpdateTeamMember(apiClient);
  const { mutate: deleteMember, status: deleteStatus } = useDeleteTeamMember(apiClient);

  if (loadStatus === "loading") {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Membre introuvable</p>
        <Link href="/equipe" className="text-blue-600 hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const handleSubmit = async (data: any) => {
    try {
      await updateMember({ id: member.id, data });
      toast.success("Membre mis à jour");
      router.push("/equipe");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) return;
    try {
      await deleteMember(member.id);
      toast.success("Membre supprimé");
      router.push("/equipe");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/equipe" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Éditer le membre</h1>
      </div>

      <TeamForm
        key={member.id}
        initialData={member as any}
        onSubmit={handleSubmit}
        isSubmitting={saveStatus === "loading"}
        onCancel={() => router.push("/equipe")}
        onDelete={handleDelete}
        isDeleting={deleteStatus === "loading"}
      />
    </div>
  );
}
