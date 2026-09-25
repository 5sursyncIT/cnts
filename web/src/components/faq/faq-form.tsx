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

import { faqSchema, type FaqFormValues, SUGGESTED_FAQ_CATEGORIES } from "./schema";

interface FaqFormProps {
  initialData?: Partial<FaqFormValues>;
  onSubmit: (data: FaqFormValues) => Promise<void>;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function FaqForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  onDelete,
  isDeleting,
}: FaqFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FaqFormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: initialData?.question || "",
      answer: initialData?.answer || "",
      category: initialData?.category || "Le Don de Sang",
      display_order: initialData?.display_order ?? 0,
      is_published: initialData?.is_published ?? true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="question" className="text-base font-semibold">
              Question
            </Label>
            <Input
              id="question"
              {...register("question")}
              placeholder="Ex: Combien de temps dure un don de sang ?"
            />
            {errors.question && <p className="text-xs text-red-500">{errors.question.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">Réponse</Label>
            <Textarea
              id="answer"
              {...register("answer")}
              placeholder="Rédigez la réponse affichée sur le portail public..."
              className="min-h-[160px]"
            />
            {errors.answer && <p className="text-xs text-red-500">{errors.answer.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="category">Catégorie (rubrique)</Label>
              <Input
                id="category"
                list="faq-categories"
                {...register("category")}
                placeholder="Le Don de Sang"
              />
              <datalist id="faq-categories">
                {SUGGESTED_FAQ_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
            </div>

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
                {...register("is_published", {
                  setValueAs: (v) => v === "true" || v === true,
                })}
              >
                <option value="true">Publiée</option>
                <option value="false">Masquée</option>
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
            {initialData ? "Mettre à jour" : "Créer la question"}
          </Button>
        </div>
      </div>
    </form>
  );
}
