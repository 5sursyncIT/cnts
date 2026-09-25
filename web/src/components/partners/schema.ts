import * as z from "zod";

export const partnerSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  category: z.string().min(1, "La catégorie est requise"),
  type: z.string().optional(),
  logo_url: z.string().optional(),
  website_url: z.string().optional(),
  display_order: z.number().int("Doit être un entier").min(0, "Doit être positif"),
  is_published: z.boolean(),
});

export type PartnerFormValues = z.infer<typeof partnerSchema>;

export const SUGGESTED_PARTNER_CATEGORIES = ["Institutionnel", "International", "Académique"];
