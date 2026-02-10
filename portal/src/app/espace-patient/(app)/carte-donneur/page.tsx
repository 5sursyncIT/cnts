"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { CreditCard, Star, Droplet, Calendar, Award, Loader2 } from "lucide-react";

interface CarteDonneur {
  id: string;
  numero_carte: string;
  niveau: string;
  points: number;
  total_dons: number;
  date_premier_don: string | null;
  date_dernier_don: string | null;
  is_active: boolean;
  qr_code_data: string;
}

interface PointsHistorique {
  id: string;
  type_operation: string;
  points: number;
  description: string;
  created_at: string;
}

const niveauConfig: Record<string, { label: string; couleur: string; bg: string; icon: string }> = {
  BRONZE: { label: "Bronze", couleur: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: "🥉" },
  ARGENT: { label: "Argent", couleur: "text-zinc-600", bg: "bg-zinc-100 border-zinc-300", icon: "🥈" },
  OR: { label: "Or", couleur: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "🥇" },
  PLATINE: { label: "Platine", couleur: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: "💎" },
};

export default function CarteDonneurPage() {
  const [carte, setCarte] = useState<CarteDonneur | null>(null);
  const [historique, setHistorique] = useState<PointsHistorique[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/backend/fidelisation/cartes?limit=1");
        if (res.ok) {
          const cartes = await res.json();
          if (cartes.length > 0) {
            setCarte(cartes[0]);
            const histRes = await fetch(
              `/api/backend/fidelisation/points/${cartes[0].id}?limit=10`
            );
            if (histRes.ok) {
              setHistorique(await histRes.json());
            }
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!carte) {
    return (
      <div className="py-12">
        <div className="text-center">
          <div className="w-64 h-48 relative mx-auto mb-6">
            <Image src="/images/illustration-carte-donneur.svg" alt="Carte de donneur" fill className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            Carte de donneur
          </h1>
          <p className="text-zinc-600 max-w-md mx-auto">
            Votre carte de donneur sera disponible après votre premier don de
            sang au CNTS. Prenez rendez-vous pour effectuer votre premier don !
          </p>
        </div>
      </div>
    );
  }

  const config = niveauConfig[carte.niveau] || niveauConfig.BRONZE;

  return (
    <div className="py-6 space-y-8">
      <h1 className="text-2xl font-bold text-zinc-900">Ma carte de donneur</h1>

      {/* Carte visuelle */}
      <div
        className={`relative overflow-hidden rounded-2xl border-2 p-8 ${config.bg}`}
      >
        <div className="absolute top-4 right-4 text-4xl">{config.icon}</div>
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Centre National de Transfusion Sanguine
            </p>
            <p className="text-2xl font-bold text-zinc-900 mt-1 tracking-widest">
              {carte.numero_carte}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-zinc-500">Niveau</p>
              <p className={`font-bold text-lg ${config.couleur}`}>
                {config.label}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Points</p>
              <p className="font-bold text-lg text-zinc-900">{carte.points}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total dons</p>
              <p className="font-bold text-lg text-zinc-900">
                {carte.total_dons}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Statut</p>
              <p className="font-bold text-lg text-green-600">
                {carte.is_active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          <div className="flex gap-6 text-sm text-zinc-600">
            {carte.date_premier_don && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Premier don :{" "}
                {new Date(carte.date_premier_don).toLocaleDateString("fr-FR")}
              </span>
            )}
            {carte.date_dernier_don && (
              <span className="flex items-center gap-1">
                <Droplet className="h-4 w-4" />
                Dernier don :{" "}
                {new Date(carte.date_dernier_don).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progression */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Progression
        </h2>
        <div className="space-y-3">
          {["BRONZE", "ARGENT", "OR", "PLATINE"].map((niveau) => {
            const seuils: Record<string, number> = {
              BRONZE: 0,
              ARGENT: 200,
              OR: 500,
              PLATINE: 1000,
            };
            const nc = niveauConfig[niveau];
            const atteint = carte.points >= seuils[niveau];
            return (
              <div key={niveau} className="flex items-center gap-3">
                <span className="text-lg">{nc.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium ${atteint ? nc.couleur : "text-zinc-400"}`}
                    >
                      {nc.label}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {seuils[niveau]} pts
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 rounded-full">
                    <div
                      className={`h-2 rounded-full transition-all ${atteint ? "bg-primary" : "bg-zinc-200"}`}
                      style={{
                        width: `${Math.min(100, (carte.points / seuils[niveau]) * 100 || 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historique des points */}
      {historique.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Historique des points
          </h2>
          <div className="space-y-3">
            {historique.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {entry.description || entry.type_operation}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(entry.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className={`font-bold ${entry.points > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {entry.points > 0 ? "+" : ""}
                  {entry.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
