import * as z from "zod";

export const faqSchema = z.object({
  question: z.string().min(1, "La question est requise"),
  answer: z.string().min(1, "La réponse est requise"),
  category: z.string().min(1, "La catégorie est requise"),
  display_order: z.number().int("Doit être un entier").min(0, "Doit être positif"),
  is_published: z.boolean(),
});

export type FaqFormValues = z.infer<typeof faqSchema>;

export const SUGGESTED_FAQ_CATEGORIES = [
  "Le Don de Sang",
  "Conditions & Contre-indications",
  "Espace Patient & Résultats",
  "Général",
];
