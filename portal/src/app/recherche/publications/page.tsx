import Link from "next/link";
import { BookOpen, ExternalLink, Calendar } from "lucide-react";

export const metadata = {
  title: "Publications scientifiques — SGI-CNTS",
  description:
    "Publications scientifiques du CNTS : articles, thèses, communications et travaux de recherche en transfusion sanguine.",
};

export default function PublicationsPage() {
  const publications = [
    {
      titre: "Séroprévalence des marqueurs viraux chez les donneurs de sang au Sénégal : étude rétrospective sur 10 ans",
      auteurs: "Equipe CNTS et al.",
      revue: "Transfusion Clinique et Biologique",
      annee: "2024",
      type: "Article original",
    },
    {
      titre: "Distribution des phénotypes érythrocytaires dans la population des donneurs de sang à Dakar",
      auteurs: "Equipe CNTS, UCAD",
      revue: "Revue Africaine de Médecine Transfusionnelle",
      annee: "2023",
      type: "Article original",
    },
    {
      titre: "Impact de l'introduction des tests NAT sur la sécurité transfusionnelle au CNTS de Dakar",
      auteurs: "Equipe CNTS",
      revue: "Vox Sanguinis",
      annee: "2023",
      type: "Article original",
    },
    {
      titre: "Prise en charge transfusionnelle de la drépanocytose au Sénégal : expérience du CNTS",
      auteurs: "Equipe CNTS, Hôpital A. Le Dantec",
      revue: "Médecine d'Afrique Noire",
      annee: "2022",
      type: "Revue",
    },
    {
      titre: "Évaluation d'un système d'information pour la traçabilité des produits sanguins labiles",
      auteurs: "Equipe CNTS",
      revue: "Journal Africain de Technologie Médicale",
      annee: "2022",
      type: "Article original",
    },
    {
      titre: "Registre national des donneurs de groupes sanguins rares au Sénégal : bilan et perspectives",
      auteurs: "Equipe CNTS, AfSBT",
      revue: "ISBT Science Series",
      annee: "2021",
      type: "Communication",
    },
  ];

  const theses = [
    {
      titre: "Étude des anticorps irréguliers chez les patients polytransfusés au CNTS de Dakar",
      auteur: "Dr. A. Diallo",
      universite: "UCAD - Faculté de Médecine",
      annee: "2024",
      type: "Thèse de médecine",
    },
    {
      titre: "Prévalence de l'infection occulte par le VHB chez les donneurs de sang séronégatifs",
      auteur: "Dr. M. Ndiaye",
      universite: "UCAD - Faculté de Pharmacie",
      annee: "2023",
      type: "Thèse de pharmacie",
    },
    {
      titre: "Optimisation de la gestion des stocks de produits sanguins par l'intelligence artificielle",
      auteur: "M. S. Fall",
      universite: "UGB - Master Informatique",
      annee: "2023",
      type: "Mémoire de master",
    },
  ];

  const typeColors: Record<string, string> = {
    "Article original": "bg-blue-50 text-blue-700",
    "Revue": "bg-green-50 text-green-700",
    "Communication": "bg-purple-50 text-purple-700",
    "Thèse de médecine": "bg-red-50 text-red-700",
    "Thèse de pharmacie": "bg-amber-50 text-amber-700",
    "Mémoire de master": "bg-teal-50 text-teal-700",
  };

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* Hero */}
      <div className="bg-zinc-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm border border-white/20 mb-6">
            <BookOpen className="h-4 w-4 mr-2" />
            Productions scientifiques
          </div>
          <h1 className="text-4xl font-bold md:text-5xl mb-4">
            Publications
          </h1>
          <p className="mt-4 text-zinc-300 max-w-2xl mx-auto text-lg">
            Les travaux scientifiques du CNTS publiés dans les revues nationales
            et internationales.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-20">
        {/* Articles */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 mb-8">
            Articles et communications
          </h2>
          <div className="space-y-4">
            {publications.map((pub, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColors[pub.type] || "bg-zinc-100 text-zinc-700"}`}
                  >
                    {pub.type}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-zinc-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {pub.annee}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-900">{pub.titre}</h3>
                <p className="text-sm text-zinc-600 mt-1">{pub.auteurs}</p>
                <p className="text-sm text-primary font-medium mt-1 flex items-center gap-1">
                  {pub.revue}
                  <ExternalLink className="h-3.5 w-3.5" />
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Thèses */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 mb-8">
            Thèses et mémoires
          </h2>
          <div className="space-y-4">
            {theses.map((these, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColors[these.type] || "bg-zinc-100 text-zinc-700"}`}
                  >
                    {these.type}
                  </span>
                  <span className="text-sm text-zinc-500">{these.annee}</span>
                </div>
                <h3 className="font-bold text-zinc-900">{these.titre}</h3>
                <p className="text-sm text-zinc-600 mt-1">
                  {these.auteur} — {these.universite}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/recherche/projets"
              className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-8 py-3 hover:bg-primary/90 transition-colors"
            >
              Projets en cours
            </Link>
            <Link
              href="/recherche/appels"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-900 font-medium px-8 py-3 hover:bg-zinc-50 transition-colors"
            >
              Appels à collaboration
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
