"use client";

import { useFaqItems } from "@cnts/api";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { Plus, Edit, HelpCircle, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ContentNav } from "@/components/content-nav";

export default function FaqAdminPage() {
  const { data: items, status } = useFaqItems(apiClient, { published_only: false, limit: 200 });
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = (items || []).filter(
    (item) =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <ContentNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Foire Aux Questions</h1>
          <p className="text-zinc-500 mt-1">
            Gérez les questions/réponses affichées sur la page publique{" "}
            <span className="font-mono text-xs">/faq</span>.
          </p>
        </div>
        <Link
          href="/faq/new"
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-900/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle question
        </Link>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Rechercher une question..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-zinc-50/50 text-left text-xs font-medium uppercase text-zinc-500 tracking-wider">
              <th className="px-6 py-4">Question</th>
              <th className="px-6 py-4">Rubrique</th>
              <th className="px-6 py-4">Ordre</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {status === "loading" && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-zinc-500">
                  Chargement des questions...
                </td>
              </tr>
            )}
            {status === "success" && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center gap-2">
                    <HelpCircle className="h-8 w-8 text-zinc-300" />
                    <p>Aucune question trouvée.</p>
                  </div>
                </td>
              </tr>
            )}
            {status === "success" &&
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900 line-clamp-2 max-w-md">
                      {item.question}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="font-medium">
                      {item.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 font-mono">{item.display_order}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        item.is_published
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200"
                      }`}
                    >
                      {item.is_published ? "Publiée" : "Masquée"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/faq/${item.id}`}
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
  );
}
