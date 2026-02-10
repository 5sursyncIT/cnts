import Link from "next/link";
import { FileText, Scale, Shield, BookOpen, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Textes de référence — SGI-CNTS",
  description:
    "Cadre juridique et réglementaire régissant la transfusion sanguine au Sénégal : lois, décrets, arrêtés et normes internationales.",
};

export default function TextesReferencePage() {
  const textesNationaux = [
    {
      titre: "Loi n° 2001-03 relative à la transfusion sanguine",
      description:
        "Texte fondateur organisant la transfusion sanguine au Sénégal. Définit les principes d'éthique (bénévolat, anonymat, non-profit), les missions du CNTS et les obligations des établissements de santé.",
      type: "Loi",
      date: "Janvier 2001",
    },
    {
      titre: "Décret n° 2002-806 portant organisation du CNTS",
      description:
        "Fixe l'organisation administrative et technique du Centre National de Transfusion Sanguine, ses attributions et son fonctionnement.",
      type: "Décret",
      date: "Août 2002",
    },
    {
      titre: "Arrêté ministériel sur les bonnes pratiques transfusionnelles",
      description:
        "Établit les normes de bonnes pratiques pour la collecte, la préparation, la qualification biologique et la distribution des produits sanguins labiles.",
      type: "Arrêté",
      date: "2005",
    },
    {
      titre: "Plan National de Développement de la Transfusion Sanguine",
      description:
        "Document stratégique pluriannuel définissant les axes prioritaires pour l'amélioration de la sécurité transfusionnelle au Sénégal.",
      type: "Plan",
      date: "2020-2025",
    },
    {
      titre: "Politique Nationale de Transfusion Sanguine",
      description:
        "Cadre politique national visant à garantir un approvisionnement suffisant et sûr en produits sanguins pour l'ensemble de la population.",
      type: "Politique",
      date: "2019",
    },
  ];

  const normesInternationales = [
    {
      titre: "Recommandations OMS sur la transfusion sanguine",
      description:
        "Lignes directrices de l'Organisation Mondiale de la Santé pour la sécurité et la disponibilité des produits sanguins.",
      organisme: "OMS",
    },
    {
      titre: "Standards ISBT 128",
      description:
        "Norme internationale de codification et d'étiquetage des produits sanguins, adoptée par le CNTS pour la traçabilité.",
      organisme: "ISBT",
    },
    {
      titre: "Normes AABB (Association for the Advancement of Blood & Biotherapies)",
      description:
        "Référentiel de bonnes pratiques pour les banques de sang et les services de transfusion.",
      organisme: "AABB",
    },
    {
      titre: "Guide technique OMS pour les pays en développement",
      description:
        "Guide pratique adapté au contexte africain pour la mise en place de systèmes nationaux de transfusion sanguine.",
      organisme: "OMS/Afrique",
    },
  ];

  const typeColors: Record<string, string> = {
    Loi: "bg-red-50 text-red-700",
    Décret: "bg-blue-50 text-blue-700",
    Arrêté: "bg-amber-50 text-amber-700",
    Plan: "bg-green-50 text-green-700",
    Politique: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* Hero */}
      <div className="bg-zinc-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm border border-white/20 mb-6">
            <Scale className="h-4 w-4 mr-2" />
            Cadre réglementaire
          </div>
          <h1 className="text-4xl font-bold md:text-5xl mb-4">
            Textes de référence
          </h1>
          <p className="mt-4 text-zinc-300 max-w-2xl mx-auto text-lg">
            Le cadre juridique et réglementaire qui régit la transfusion
            sanguine au Sénégal, conforme aux standards internationaux.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-20">
        {/* Textes nationaux */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <FileText className="h-7 w-7 text-primary" />
            <h2 className="text-3xl font-bold text-zinc-900">
              Textes nationaux
            </h2>
          </div>

          <div className="space-y-4">
            {textesNationaux.map((texte, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColors[texte.type] || "bg-zinc-100 text-zinc-700"}`}
                    >
                      {texte.type}
                    </span>
                    <span className="text-sm text-zinc-500">{texte.date}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">
                      {texte.titre}
                    </h3>
                    <p className="text-zinc-600 mt-1">{texte.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Normes internationales */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-7 w-7 text-primary" />
            <h2 className="text-3xl font-bold text-zinc-900">
              Normes internationales
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {normesInternationales.map((norme, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                    {norme.organisme}
                  </span>
                  <ExternalLink className="h-4 w-4 text-zinc-400" />
                </div>
                <h3 className="font-bold text-zinc-900">{norme.titre}</h3>
                <p className="text-zinc-600 mt-2 text-sm">
                  {norme.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Principes éthiques */}
        <section className="bg-primary/5 rounded-2xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="h-7 w-7 text-primary" />
            <h2 className="text-2xl font-bold text-zinc-900">
              Principes éthiques fondamentaux
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">Bénévolat</h3>
              <p className="text-zinc-600">
                Le don de sang est un acte bénévole et gratuit. Aucune
                rémunération n'est accordée au donneur.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">Anonymat</h3>
              <p className="text-zinc-600">
                L'identité du donneur n'est pas communiquée au receveur, et
                inversement, conformément à la loi.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                Non-profit
              </h3>
              <p className="text-zinc-600">
                Le sang et ses dérivés ne peuvent faire l'objet d'aucun commerce
                à but lucratif.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/qui-sommes-nous/organisation"
              className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-8 py-3 hover:bg-primary/90 transition-colors"
            >
              Notre organisation
            </Link>
            <Link
              href="/qui-sommes-nous/partenaires"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-900 font-medium px-8 py-3 hover:bg-zinc-50 transition-colors"
            >
              Nos partenaires
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
