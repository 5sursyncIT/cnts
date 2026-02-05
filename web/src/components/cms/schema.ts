import * as z from "zod";

export const articleSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  slug: z.string().min(1, "Le slug est requis").regex(/^[a-z0-9-]+$/, "Format invalide (a-z, 0-9, -)"),
  category: z.enum(["ACTUALITE", "EVENEMENT", "COMMUNIQUE", "SANTE", "RESSOURCE"]),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED"]),
  excerpt: z.string().optional(),
  content: z.string().min(1, "Le contenu est requis"),
  image_url: z.string().optional(),
});

export type ArticleFormValues = z.infer<typeof articleSchema>;
