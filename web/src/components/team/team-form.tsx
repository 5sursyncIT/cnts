"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

import { teamSchema, type TeamFormValues } from "./schema";

interface TeamFormProps {
  initialData?: Partial<TeamFormValues>;
  onSubmit: (data: TeamFormValues) => Promise<void>;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function TeamForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  onDelete,
  isDeleting,
}: TeamFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: initialData?.name || "",
      role: initialData?.role || "",
      specialty: initialData?.specialty || "",
      bio: initialData?.bio || "",
      photo_url: initialData?.photo_url || "",
      display_order: initialData?.display_order ?? 0,
      is_published: initialData?.is_published ?? true,
    },
  });

  const photoUrl = watch("photo_url");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" {...register("name")} placeholder="Pr. Saliou Diop" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Fonction</Label>
              <Input id="role" {...register("role")} placeholder="Directeur Général" />
              {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty">Spécialité (optionnel)</Label>
            <Input id="specialty" {...register("specialty")} placeholder="Hématologie" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biographie</Label>
            <Textarea
              id="bio"
              {...register("bio")}
              placeholder="Présentation affichée sur la fiche du membre..."
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo_url">Photo (URL, optionnel)</Label>
            <Input id="photo_url" {...register("photo_url")} placeholder="https://..." />
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="Aperçu"
                className="h-20 w-20 rounded-full object-cover border border-zinc-200"
              />
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_order">Ordre d'affichage</Label>
              <Input
                id="display_order"
                type="number"
                min={0}
                {...register("display_order", { valueAsNumber: true })}
              />
              {errors.display_order && (
                <p className="text-xs text-red-500">{errors.display_order.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_published">Visibilité</Label>
              <Select
                id="is_published"
                {...register("is_published", { setValueAs: (v) => v === "true" || v === true })}
              >
                <option value="true">Publié</option>
                <option value="false">Masqué</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          {onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={isDeleting || isSubmitting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash className="mr-2 h-4 w-4" />
              )}
              Supprimer
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Mettre à jour" : "Ajouter le membre"}
          </Button>
        </div>
      </div>
    </form>
  );
}
