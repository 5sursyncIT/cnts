"use client";

import { useCreateTeamMember } from "@cnts/api";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { TeamForm } from "@/components/team/team-form";

export default function NewTeamMemberPage() {
  const router = useRouter();
  const { mutate: createMember, status } = useCreateTeamMember(apiClient);

  const handleSubmit = async (data: any) => {
    try {
      await createMember(data);
      toast.success("Membre ajouté avec succès");
      router.push("/equipe");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'ajout du membre");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/equipe" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau membre</h1>
      </div>

      <TeamForm
        onSubmit={handleSubmit}
        isSubmitting={status === "loading"}
        onCancel={() => router.push("/equipe")}
      />
    </div>
  );
}
