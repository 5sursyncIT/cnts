import Image from "next/image";
import Link from "next/link";
import { FlaskConical, BookOpen, FolderKanban, Handshake, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Recherche & Innovation — SGI-CNTS",
  description:
    "La cellule de recherche du CNTS : projets de recherche, publications scientifiques, innovations en transfusion sanguine.",
};

export default function RecherchePage() {
  const axes = [
    {
      titre: "Sécurité transfusionnelle",
      description:
        "Amélioration continue des techniques de dépistage, réduction de la période fenêtre sérologique, développement de nouveaux algorithmes de qualification biologique.",
    },
    {
      titre: "Immunohématologie",
      description:
        "Études sur la distribution des phénotypes érythrocytaires dans la population sénégalaise, caractérisation des groupes sanguins rares en Afrique de l'Ouest.",
    },
    {
      titre: "Épidémiologie",
      description:
        "Surveillance épidémiologique des agents transmissibles par le sang (VIH, VHB, VHC, paludisme) dans la population des donneurs.",
    },
    {
      titre: "Innovation technologique",
      description:
        "Évaluation de nouvelles technologies : tests rapides, systèmes d'information, automatisation des analyses, intelligence artificielle pour la prévision des besoins.",
    },
  ];

  const sections = [
    {
      href: "/recherche/publications",
      titre: "Publications scientifiques",
      description: "Articles, thèses et communications du CNTS dans les revues scientifiques nationales et internationales.",
      icon: <BookOpen className="h-8 w-8 text-blue-600" />,
    },
    {
      href: "/recherche/projets",
      titre: "Projets en cours",
      description: "Les projets de recherche et d'innovation actuellement menés par le CNTS et ses partenaires.",
      icon: <FolderKanban className="h-8 w-8 text-green-600" />,
    },
    {
      href: "/recherche/appels",
      titre: "Appels à collaboration",
      description: "Opportunités de collaboration scientifique, stages de recherche et partenariats académiques.",
      icon: <Handshake className="h-8 w-8 text-amber-600" />,
    },
  ];

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* Hero */}
      <div className="bg-zinc-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm border border-white/20 mb-6">
                <FlaskConical className="h-4 w-4 mr-2" />
                Innovation et savoir
              </div>
              <h1 className="text-4xl font-bold md:text-5xl mb-4">
                Recherche & Innovation
              </h1>
              <p className="mt-4 text-zinc-300 max-w-xl text-lg">
                Le CNTS dispose d'une cellule de recherche dédiée à l'amélioration
                continue de la sécurité transfusionnelle et au développement de
                solutions innovantes adaptées au contexte africain.
              </p>
            </div>
            <div className="hidden md:block w-80 h-64 relative shrink-0">
              <Image src="/images/illustration-recherche.svg" alt="Illustration recherche et innovation" fill className="object-contain drop-shadow-2xl" priority />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-20">
        {/* Cellule de recherche */}
        <section>
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-4">
            La cellule de recherche
          </h2>
          <p className="text-zinc-600 text-center max-w-3xl mx-auto mb-10">
            Créée pour renforcer les capacités scientifiques du CNTS, la cellule
            de recherche mène des travaux dans quatre axes prioritaires liés à
            la transfusion sanguine.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {axes.map((axe, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-bold text-zinc-900 mb-2">
                  {axe.titre}
                </h3>
                <p className="text-zinc-600">{axe.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sous-sections */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sections.map((section, idx) => (
              <Link
                key={idx}
                href={section.href}
                className="group bg-white p-8 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-all hover:border-primary/30"
              >
                <div className="w-16 h-16 bg-zinc-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/5 transition-colors">
                  {section.icon}
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2 group-hover:text-primary transition-colors">
                  {section.titre}
                </h3>
                <p className="text-zinc-600 text-sm">{section.description}</p>
                <span className="inline-flex items-center mt-4 text-sm font-medium text-primary">
                  En savoir plus
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Partenariats */}
        <section className="bg-primary/5 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">
            Partenariats scientifiques
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                Universités
              </h3>
              <p className="text-zinc-600 text-sm">
                UCAD (Dakar), UGB (Saint-Louis), Institut Pasteur de Dakar.
                Accueil de stagiaires et co-encadrement de thèses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                International
              </h3>
              <p className="text-zinc-600 text-sm">
                Établissement Français du Sang (EFS), OMS, AfSBT. Échanges
                d'expertise et projets collaboratifs multicentriques.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                Financement
              </h3>
              <p className="text-zinc-600 text-sm">
                Fonds de recherche du Ministère de la Santé, financements OMS,
                subventions de fondations internationales.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
