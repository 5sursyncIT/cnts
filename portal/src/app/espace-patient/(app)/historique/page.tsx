"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Droplet, Calendar, MapPin, CheckCircle, Clock, Loader2 } from "lucide-react";

interface Don {
  id: string;
  din: string;
  date_don: string;
  type_don: string;
  statut_qualification: string;
  volume_ml: number | null;
  site_name?: string;
  created_at: string;
}

export default function HistoriqueDonsPage() {
  const [dons, setDons] = useState<Don[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDons() {
      try {
        const res = await fetch("/api/backend/dons?limit=50");
        if (res.ok) {
          setDons(await res.json());
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchDons();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const statutConfig: Record<string, { label: string; classe: string }> = {
    EN_ATTENTE: { label: "En attente", classe: "bg-amber-50 text-amber-700" },
    LIBERE: { label: "Libéré", classe: "bg-green-50 text-green-700" },
    NON_CONFORME: { label: "Non conforme", classe: "bg-red-50 text-red-700" },
  };

  const typeDonLabels: Record<string, string> = {
    SANG_TOTAL: "Sang total",
    PLAQUETTAPHERESE: "Plaquettaphérèse",
    PLASMAPHERESE: "Plasmaphérèse",
  };

  return (
    <div className="py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Historique de mes dons
        </h1>
        <p className="text-zinc-600 mt-1">
          Retrouvez l'ensemble de vos dons de sang effectués au CNTS.
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 text-center">
          <p className="text-2xl font-bold text-primary">{dons.length}</p>
          <p className="text-xs text-zinc-600 mt-1">Total dons</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 text-center">
          <p className="text-2xl font-bold text-green-600">
            {dons.filter((d) => d.statut_qualification === "LIBERE").length}
          </p>
          <p className="text-xs text-zinc-600 mt-1">Dons libérés</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 text-center">
          <p className="text-2xl font-bold text-zinc-900">
            {dons.length > 0
              ? Math.round(
                  dons
                    .filter((d) => d.volume_ml)
                    .reduce((sum, d) => sum + (d.volume_ml || 0), 0) / 1000
                )
              : 0}{" "}
            L
          </p>
          <p className="text-xs text-zinc-600 mt-1">Volume total</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {dons.length > 0
              ? new Date(dons[0].date_don).toLocaleDateString("fr-FR", {
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </p>
          <p className="text-xs text-zinc-600 mt-1">Dernier don</p>
        </div>
      </div>

      {/* Liste des dons */}
      {dons.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-56 h-44 relative mx-auto mb-6">
            <Image src="/images/illustration-don-sang.svg" alt="Don de sang" fill className="object-contain" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            Aucun don enregistré
          </h2>
          <p className="text-zinc-600">
            Votre historique apparaîtra ici après votre premier don de sang.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dons.map((don) => {
            const statut =
              statutConfig[don.statut_qualification] || statutConfig.EN_ATTENTE;
            return (
              <div
                key={don.id}
                className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                      <Droplet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-zinc-900">
                          {typeDonLabels[don.type_don] || don.type_don}
                        </h3>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statut.classe}`}
                        >
                          {statut.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(don.date_don).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        {don.volume_ml && (
                          <span className="flex items-center gap-1">
                            <Droplet className="h-3.5 w-3.5" />
                            {don.volume_ml} ml
                          </span>
                        )}
                        {don.site_name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {don.site_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-zinc-400 font-mono">
                      {don.din}
                    </p>
                    {don.statut_qualification === "LIBERE" && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Qualifié
                      </span>
                    )}
                    {don.statut_qualification === "EN_ATTENTE" && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        En cours
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
