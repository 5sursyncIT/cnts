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

import { partnerSchema, type PartnerFormValues, SUGGESTED_PARTNER_CATEGORIES } from "./schema";

interface PartnerFormProps {
  initialData?: Partial<PartnerFormValues>;
  onSubmit: (data: PartnerFormValues) => Promise<void>;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function PartnerForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  onDelete,
  isDeleting,
}: PartnerFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      category: initialData?.category || "Institutionnel",
      type: initialData?.type || "",
      logo_url: initialData?.logo_url || "",
      website_url: initialData?.website_url || "",
      display_order: initialData?.display_order ?? 0,
      is_published: initialData?.is_published ?? true,
    },
  });

  const logoUrl = watch("logo_url");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du partenaire</Label>
            <Input id="name" {...register("name")} placeholder="Organisation Mondiale de la Santé" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie (section)</Label>
              <Input
                id="category"
                list="partner-categories"
                {...register("category")}
                placeholder="Institutionnel"
              />
              <datalist id="partner-categories">
                {SUGGESTED_PARTNER_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Sous-libellé (optionnel)</Label>
              <Input id="type" {...register("type")} placeholder="Tutelle, Santé publique..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Rôle du partenaire affiché sur la fiche..."
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo (URL, optionnel)</Label>
              <Input id="logo_url" {...register("logo_url")} placeholder="https://..." />
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Aperçu"
                  className="h-16 object-contain border border-zinc-200 rounded p-1 bg-white"
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="website_url">Site web (optionnel)</Label>
              <Input id="website_url" {...register("website_url")} placeholder="https://..." />
            </div>
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
            {initialData ? "Mettre à jour" : "Ajouter le partenaire"}
          </Button>
        </div>
      </div>
    </form>
  );
}
