import * as z from "zod";

export const teamSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  role: z.string().min(1, "La fonction est requise"),
  specialty: z.string().optional(),
  bio: z.string().optional(),
  photo_url: z.string().optional(),
  display_order: z.number().int("Doit être un entier").min(0, "Doit être positif"),
  is_published: z.boolean(),
});

export type TeamFormValues = z.infer<typeof teamSchema>;
