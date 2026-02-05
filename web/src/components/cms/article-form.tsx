"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Image as ImageIcon, X, Eye, Edit2, UploadCloud, Bold, Italic, List, Link as LinkIcon, Heading, Quote, Code } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { articleSchema, type ArticleFormValues } from "./schema";

interface ArticleFormProps {
  initialData?: Partial<ArticleFormValues>;
  onSubmit: (data: ArticleFormValues) => Promise<void>;
  onUpload: (file: File) => Promise<{ url: string }>;
  isSubmitting?: boolean;
  uploadStatus?: "idle" | "loading" | "success" | "error";
  onCancel?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function ArticleForm({
  initialData,
  onSubmit,
  onUpload,
  isSubmitting,
  uploadStatus,
  onCancel,
  onDelete,
  isDeleting,
}: ArticleFormProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      category: (initialData?.category as any) || "ACTUALITE",
      status: (initialData?.status as any) || "DRAFT",
      excerpt: initialData?.excerpt || "",
      content: initialData?.content || "",
      image_url: initialData?.image_url || "",
    },
  });

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = form;
  const title = watch("title");
  const imageUrl = watch("image_url");
  const content = watch("content");

  // Auto-generate slug from title if slug is empty or was auto-generated
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue("title", newTitle);
    
    // Only auto-update slug if it's new or matches the old title slugified
    // For simplicity, we just suggest it if slug is empty
    if (!form.getValues("slug")) {
      const slug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", slug);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        const result = await onUpload(file);
        
        // Construct full URL if relative
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, "");
        const fullUrl = result.url.startsWith("http") ? result.url : `${baseUrl}${result.url}`;
        
        setValue("image_url", fullUrl);
      } catch (err) {
        console.error("Upload failed", err);
        alert("Erreur lors de l'upload");
      }
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("content") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = `${before}${prefix}${selection}${suffix}${after}`;
    setValue("content", newText);
    
    // Need to reset focus and cursor position, but React Hook Form handles value update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-lg font-semibold">Titre de l'article</Label>
                <Input
                  id="title"
                  {...register("title")}
                  onChange={(e) => {
                    register("title").onChange(e);
                    handleTitleChange(e);
                  }}
                  placeholder="Ex: Lancement de la campagne de don..."
                  className="text-lg py-6"
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm text-zinc-500">Slug (URL convivial)</Label>
                <div className="flex items-center">
                  <span className="bg-zinc-100 border border-r-0 border-zinc-200 rounded-l-md px-3 py-2 text-sm text-zinc-500">
                    /actualites/
                  </span>
                  <Input
                    id="slug"
                    {...register("slug")}
                    placeholder="lancement-campagne-don"
                    className="rounded-l-none font-mono text-sm"
                  />
                </div>
                {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Extrait (Résumé)</Label>
                <Textarea
                  id="excerpt"
                  {...register("excerpt")}
                  placeholder="Un bref résumé qui apparaîtra dans les listes et cartes..."
                  className="h-24 resize-none"
                />
                <p className="text-xs text-zinc-500 text-right">
                  {watch("excerpt")?.length || 0} caractères
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Contenu de l'article</CardTitle>
                <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-lg">
                  <Button
                    type="button"
                    variant={!isPreviewMode ? "white" : "ghost"}
                    size="sm"
                    className={cn("h-7 text-xs", !isPreviewMode && "bg-white shadow-sm")}
                    onClick={() => setIsPreviewMode(false)}
                  >
                    <Edit2 className="mr-2 h-3 w-3" />
                    Éditeur
                  </Button>
                  <Button
                    type="button"
                    variant={isPreviewMode ? "white" : "ghost"}
                    size="sm"
                    className={cn("h-7 text-xs", isPreviewMode && "bg-white shadow-sm")}
                    onClick={() => setIsPreviewMode(true)}
                  >
                    <Eye className="mr-2 h-3 w-3" />
                    Aperçu
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!isPreviewMode && (
                <div className="border-b bg-zinc-50 px-4 py-2 flex items-center gap-1 overflow-x-auto">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("**", "**")} title="Gras">
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("*", "*")} title="Italique">
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("### ")} title="Titre 3">
                    <Heading className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("> ")} title="Citation">
                    <Quote className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("- ")} title="Liste à puces">
                    <List className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("[", "](url)")} title="Lien">
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("```\n", "\n```")} title="Code">
                    <Code className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {isPreviewMode ? (
                <div className="min-h-[500px] p-6 prose prose-zinc max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                  {!content && <p className="text-zinc-400 italic text-center py-10">Le contenu est vide...</p>}
                </div>
              ) : (
                <Textarea
                  id="content"
                  {...register("content")}
                  placeholder="# Titre principal\n\nCommencez à rédiger votre article ici..."
                  className="min-h-[500px] border-0 rounded-none focus-visible:ring-0 p-6 font-mono resize-y"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Publication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select id="status" {...register("status")}>
                  <option value="DRAFT">Draft (Brouillon)</option>
                  <option value="REVIEW">Review (Relecture)</option>
                  <option value="PUBLISHED">Published (Publié)</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select id="category" {...register("category")}>
                  <option value="ACTUALITE">Actualité</option>
                  <option value="EVENEMENT">Événement</option>
                  <option value="COMMUNIQUE">Communiqué</option>
                  <option value="SANTE">Santé</option>
                  <option value="RESSOURCE">Ressource (Médiathèque)</option>
                </Select>
                <div className="text-xs text-zinc-500 bg-zinc-50 p-2 rounded border border-zinc-100 mt-1">
                  {watch("category") === "COMMUNIQUE" 
                    ? "Sera visible dans 'Actualités' ET 'Espace Presse'."
                    : watch("category") === "RESSOURCE"
                    ? "Sera visible uniquement dans la Médiathèque (Espace Presse)."
                    : "Sera visible uniquement dans 'Actualités'."}
                </div>
              </div>
              
              <Separator />
              
              <div className="flex flex-col gap-2 pt-2">
                <Button type="submit" className="w-full" disabled={isSubmitting || uploadStatus === "loading"}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {initialData ? "Mettre à jour" : "Publier l'article"}
                </Button>
                
                <div className="flex gap-2">
                  {onDelete && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={onDelete}
                      disabled={isDeleting || isSubmitting}
                      className="flex-1"
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                    </Button>
                  )}
                  {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                      Annuler
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label>Image de couverture</Label>
                
                {imageUrl ? (
                  <div className="relative group rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 aspect-video">
                    <img
                      src={imageUrl}
                      alt="Aperçu"
                      className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setValue("image_url", "")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-200 hover:border-primary/50 hover:bg-zinc-50 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors aspect-video"
                  >
                    <div className="p-3 bg-zinc-100 rounded-full mb-3">
                      <UploadCloud className="h-6 w-6 text-zinc-400" />
                    </div>
                    <p className="text-sm font-medium text-zinc-900">Cliquez pour uploader</p>
                    <p className="text-xs text-zinc-500 mt-1">PNG, JPG jusqu'à 5MB</p>
                  </div>
                )}
                
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {uploadStatus === "loading" && (
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Upload en cours...
                  </div>
                )}
                
                <div className="pt-2">
                  <Label htmlFor="image_url" className="text-xs text-zinc-500">Ou lien direct</Label>
                  <Input 
                    id="image_url" 
                    {...register("image_url")} 
                    placeholder="https://..." 
                    className="mt-1 h-8 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

// Helper component for toolbar buttons if needed
function ToolbarButton({ icon: Icon, onClick, title }: { icon: any, onClick: () => void, title: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={onClick}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

