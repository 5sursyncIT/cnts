"use client";

import { useArticles } from "@cnts/api";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { Plus, Edit, Trash, FileText, CheckCircle, Clock, Search, Filter } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CMSPage() {
  const { data: articles, status } = useArticles(apiClient, { limit: 100, published_only: false });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredArticles = articles?.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.slug.includes(searchTerm.toLowerCase())
  ) || [];

  const stats = {
    total: articles?.length || 0,
    published: articles?.filter(a => a.status === 'PUBLISHED').length || 0,
    drafts: articles?.filter(a => a.status === 'DRAFT').length || 0,
  };

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Gestion des Contenus</h1>
            <p className="text-zinc-500 mt-1">Gérez les actualités, événements et communiqués du portail.</p>
          </div>
          <Link
            href="/cms/new"
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-900/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvel Article
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-500">Total Articles</div>
                <div className="text-2xl font-bold text-zinc-900">{stats.total}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-500">Publiés</div>
                <div className="text-2xl font-bold text-zinc-900">{stats.published}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-500">Brouillons</div>
                <div className="text-2xl font-bold text-zinc-900">{stats.drafts}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Rechercher un article..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden md:flex">
              <Filter className="mr-2 h-4 w-4" />
              Filtres
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-zinc-50/50 text-left text-xs font-medium uppercase text-zinc-500 tracking-wider">
                <th className="px-6 py-4">Article</th>
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Publication</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {status === "loading" && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-zinc-500">
                    Chargement des articles...
                  </td>
                </tr>
              )}
              {status === "success" && filteredArticles.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-zinc-300" />
                      <p>Aucun article trouvé.</p>
                      {searchTerm && <p className="text-sm">Essayez de modifier votre recherche.</p>}
                    </div>
                  </td>
                </tr>
              )}
              {status === "success" && filteredArticles.map((article) => (
                <tr key={article.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-200 shrink-0">
                        {article.image_url ? (
                          <img src={article.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <FileText className="h-5 w-5 text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900 group-hover:text-primary transition-colors line-clamp-1">{article.title}</div>
                        <div className="text-xs text-zinc-500 truncate max-w-[200px] font-mono mt-0.5">{article.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="font-medium">
                      {article.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      article.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' :
                      article.status === 'DRAFT' ? 'bg-zinc-100 text-zinc-700 border-zinc-200' :
                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {article.status === 'PUBLISHED' ? 'Publié' : article.status === 'DRAFT' ? 'Brouillon' : 'En relecture'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {new Date(article.published_at).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/cms/${article.slug}`}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md text-zinc-400 hover:text-primary hover:bg-primary/5 transition-colors"
                      title="Éditer"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
