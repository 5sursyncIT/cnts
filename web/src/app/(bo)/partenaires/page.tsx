"use client";

import { usePartners } from "@cnts/api";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { Plus, Edit, Handshake, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ContentNav } from "@/components/content-nav";

export default function PartnersAdminPage() {
  const { data: partners, status } = usePartners(apiClient, { published_only: false, limit: 200 });
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = (partners || []).filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <ContentNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Partenaires</h1>
          <p className="text-zinc-500 mt-1">
            Gérez les partenaires affichés sur{" "}
            <span className="font-mono text-xs">/qui-sommes-nous/partenaires</span>.
          </p>
        </div>
        <Link
          href="/partenaires/new"
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-900/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau partenaire
        </Link>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Rechercher un partenaire..."
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
              <th className="px-6 py-4">Partenaire</th>
              <th className="px-6 py-4">Catégorie</th>
              <th className="px-6 py-4">Sous-libellé</th>
              <th className="px-6 py-4">Ordre</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {status === "loading" && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-zinc-500">
                  Chargement des partenaires...
                </td>
              </tr>
            )}
            {status === "success" && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center gap-2">
                    <Handshake className="h-8 w-8 text-zinc-300" />
                    <p>Aucun partenaire trouvé.</p>
                  </div>
                </td>
              </tr>
            )}
            {status === "success" &&
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-200 shrink-0">
                        {p.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.logo_url} alt="" className="h-full w-full object-contain p-1" />
                        ) : (
                          <Handshake className="h-5 w-5 text-zinc-400" />
                        )}
                      </div>
                      <div className="font-semibold text-zinc-900 line-clamp-1 max-w-xs">{p.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="font-medium">
                      {p.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{p.type || "—"}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500 font-mono">{p.display_order}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        p.is_published
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200"
                      }`}
                    >
                      {p.is_published ? "Publié" : "Masqué"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/partenaires/${p.id}`}
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
