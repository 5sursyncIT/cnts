import Link from "next/link";
import { FolderKanban, Clock, Users, Target } from "lucide-react";

export const metadata = {
  title: "Projets en cours — SGI-CNTS",
  description:
    "Les projets de recherche et d'innovation actuellement menés par le CNTS : sécurité transfusionnelle, digitalisation, formation.",
};

export default function ProjetsPage() {
  const projets = [
    {
      titre: "Déploiement du SGI-CNTS",
      statut: "En cours",
      periode: "2024 — 2026",
      partenaires: ["CNTS", "Ministère de la Santé"],
      description:
        "Mise en place d'un système de gestion intégré (SGI) couvrant l'ensemble de la chaîne transfusionnelle : du donneur au receveur, avec traçabilité complète selon la norme ISBT 128.",
      objectifs: [
        "Digitalisation complète du processus de collecte et distribution",
        "Traçabilité en temps réel des produits sanguins",
        "Tableaux de bord de pilotage pour la direction",
        "Interopérabilité avec les systèmes hospitaliers (HL7 FHIR)",
      ],
      couleur: "border-l-primary",
    },
    {
      titre: "Introduction des tests NAT en routine",
      statut: "Phase pilote",
      periode: "2023 — 2025",
      partenaires: ["CNTS", "OMS", "EFS"],
      description:
        "Évaluation et déploiement de la technologie NAT (Nucleic Acid Testing) pour la détection précoce du VIH, VHB et VHC chez les donneurs de sang, réduisant significativement la période fenêtre sérologique.",
      objectifs: [
        "Réduction de la période fenêtre (VIH : de 22 à 7 jours)",
        "Évaluation coût-efficacité en contexte africain",
        "Formation du personnel technique",
        "Extension aux centres régionaux",
      ],
      couleur: "border-l-blue-500",
    },
    {
      titre: "Registre national des groupes rares",
      statut: "En cours",
      periode: "2022 — en cours",
      partenaires: ["CNTS", "UCAD", "ISBT"],
      description:
        "Constitution d'un registre national de donneurs de groupes sanguins rares, en collaboration avec les bases de données internationales pour les patients difficiles à transfuser.",
      objectifs: [
        "Cartographie des phénotypes rares au Sénégal",
        "Base de données de donneurs volontaires disponibles",
        "Connexion avec les registres ISBT internationaux",
        "Protocole d'alerte et de rappel des donneurs rares",
      ],
      couleur: "border-l-green-500",
    },
    {
      titre: "Prévision de la demande par IA",
      statut: "Recherche",
      periode: "2024 — 2026",
      partenaires: ["CNTS", "UGB", "Polytechnique Dakar"],
      description:
        "Développement d'un modèle prédictif basé sur l'intelligence artificielle pour anticiper la demande en produits sanguins et optimiser les campagnes de collecte.",
      objectifs: [
        "Modèle de prévision saisonnière de la demande",
        "Alertes automatiques de pénurie imminente",
        "Optimisation du calendrier des collectes mobiles",
        "Réduction du gaspillage (péremption) de 20%",
      ],
      couleur: "border-l-amber-500",
    },
  ];

  const statutColors: Record<string, string> = {
    "En cours": "bg-green-50 text-green-700",
    "Phase pilote": "bg-blue-50 text-blue-700",
    Recherche: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* Hero */}
      <div className="bg-zinc-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm border border-white/20 mb-6">
            <FolderKanban className="h-4 w-4 mr-2" />
            Innovation en marche
          </div>
          <h1 className="text-4xl font-bold md:text-5xl mb-4">
            Projets en cours
          </h1>
          <p className="mt-4 text-zinc-300 max-w-2xl mx-auto text-lg">
            Les projets de recherche et d'innovation portés par le CNTS et ses
            partenaires.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-16 space-y-8">
        {projets.map((projet, idx) => (
          <section
            key={idx}
            className={`bg-white p-8 rounded-xl border border-zinc-200 shadow-sm border-l-4 ${projet.couleur}`}
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statutColors[projet.statut] || "bg-zinc-100 text-zinc-700"}`}
              >
                {projet.statut}
              </span>
              <span className="flex items-center gap-1 text-sm text-zinc-500">
                <Clock className="h-3.5 w-3.5" />
                {projet.periode}
              </span>
            </div>

            <h2 className="text-xl font-bold text-zinc-900 mb-2">
              {projet.titre}
            </h2>
            <p className="text-zinc-600 mb-4">{projet.description}</p>

            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-zinc-500" />
              <span className="text-sm text-zinc-600">
                {projet.partenaires.join(" · ")}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-1">
                <Target className="h-4 w-4 text-primary" />
                Objectifs
              </h3>
              {projet.objectifs.map((obj, oidx) => (
                <div
                  key={oidx}
                  className="flex items-start gap-2 text-sm text-zinc-700 pl-5"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  {obj}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <section className="text-center pt-8">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/recherche/appels"
              className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-8 py-3 hover:bg-primary/90 transition-colors"
            >
              Collaborer avec nous
            </Link>
            <Link
              href="/recherche/publications"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-900 font-medium px-8 py-3 hover:bg-zinc-50 transition-colors"
            >
              Nos publications
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
