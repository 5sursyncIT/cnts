import Link from "next/link";
import { Handshake, Globe, Building2, Heart, GraduationCap } from "lucide-react";

export const metadata = {
  title: "Nos partenaires — SGI-CNTS",
  description:
    "Les partenaires nationaux et internationaux du CNTS : institutions, ONG, organisations internationales et partenaires techniques.",
};

export default function PartenairesPage() {
  const partenairesInstitutionnels = [
    {
      nom: "Ministère de la Santé et de l'Action Sociale",
      description:
        "Tutelle institutionnelle du CNTS. Définit les politiques nationales de santé et assure le financement public de la transfusion sanguine.",
      type: "Tutelle",
    },
    {
      nom: "Programme National de Transfusion Sanguine (PNTS)",
      description:
        "Coordonne la mise en œuvre de la politique nationale de transfusion sanguine et assure le suivi des indicateurs de performance.",
      type: "Programme",
    },
    {
      nom: "Direction de la Pharmacie et du Médicament",
      description:
        "Assure la réglementation et le contrôle de la qualité des produits sanguins labiles au niveau national.",
      type: "Réglementation",
    },
    {
      nom: "Hôpitaux et Centres de Santé du Sénégal",
      description:
        "Partenaires de proximité pour la distribution des produits sanguins et le suivi transfusionnel des patients.",
      type: "Soins",
    },
  ];

  const partenairesInternationaux = [
    {
      nom: "Organisation Mondiale de la Santé (OMS)",
      description:
        "Appui technique et normatif pour la sécurité transfusionnelle. Fournit les recommandations et les lignes directrices internationales.",
      domaine: "Santé publique",
    },
    {
      nom: "Croix-Rouge / Croissant-Rouge",
      description:
        "Partenaire historique pour la promotion du don de sang bénévole et l'organisation de collectes mobiles.",
      domaine: "Humanitaire",
    },
    {
      nom: "Etablissement Français du Sang (EFS)",
      description:
        "Coopération technique bilatérale : formation du personnel, transfert de technologies, échanges d'expertise.",
      domaine: "Coopération technique",
    },
    {
      nom: "ISBT (International Society of Blood Transfusion)",
      description:
        "Référentiel scientifique et technique. Le CNTS applique la norme ISBT 128 pour l'étiquetage et la traçabilité.",
      domaine: "Standards",
    },
    {
      nom: "AABB (Association for the Advancement of Blood & Biotherapies)",
      description:
        "Formation continue et accréditation. Fournit les normes de bonnes pratiques pour les services de transfusion.",
      domaine: "Accréditation",
    },
    {
      nom: "Africa Society for Blood Transfusion (AfSBT)",
      description:
        "Réseau panafricain pour l'amélioration de la transfusion sanguine en Afrique. Échanges d'expériences et certification.",
      domaine: "Réseau africain",
    },
  ];

  const partenairesAcademiques = [
    {
      nom: "Université Cheikh Anta Diop (UCAD)",
      description:
        "Partenariat recherche et formation : stages, thèses, projets de recherche en immunohématologie et virologie.",
    },
    {
      nom: "Université Gaston Berger (UGB)",
      description:
        "Collaboration sur les projets de santé publique et d'épidémiologie liés à la transfusion sanguine.",
    },
    {
      nom: "Institut Pasteur de Dakar",
      description:
        "Partenariat scientifique pour les analyses virologiques avancées et la surveillance épidémiologique.",
    },
  ];

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* Hero */}
      <div className="bg-zinc-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm border border-white/20 mb-6">
            <Handshake className="h-4 w-4 mr-2" />
            Ensemble pour la transfusion
          </div>
          <h1 className="text-4xl font-bold md:text-5xl mb-4">
            Nos partenaires
          </h1>
          <p className="mt-4 text-zinc-300 max-w-2xl mx-auto text-lg">
            Le CNTS collabore avec de nombreux partenaires nationaux et
            internationaux pour garantir la sécurité transfusionnelle au
            Sénégal.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-20">
        {/* Partenaires institutionnels */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="h-7 w-7 text-primary" />
            <h2 className="text-3xl font-bold text-zinc-900">
              Partenaires institutionnels
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partenairesInstitutionnels.map((p, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-primary mb-3">
                  {p.type}
                </span>
                <h3 className="text-lg font-bold text-zinc-900">{p.nom}</h3>
                <p className="text-zinc-600 mt-2">{p.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Partenaires internationaux */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Globe className="h-7 w-7 text-primary" />
            <h2 className="text-3xl font-bold text-zinc-900">
              Partenaires internationaux
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partenairesInternationaux.map((p, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm"
              >
                <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 mb-3">
                  {p.domaine}
                </span>
                <h3 className="font-bold text-zinc-900">{p.nom}</h3>
                <p className="text-zinc-600 mt-2 text-sm">{p.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Partenaires académiques */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <GraduationCap className="h-7 w-7 text-primary" />
            <h2 className="text-3xl font-bold text-zinc-900">
              Partenaires académiques
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {partenairesAcademiques.map((p, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm"
              >
                <h3 className="font-bold text-zinc-900">{p.nom}</h3>
                <p className="text-zinc-600 mt-2 text-sm">{p.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Devenir partenaire */}
        <section className="bg-primary/5 rounded-2xl p-8 md:p-12 text-center">
          <Heart className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">
            Devenir partenaire du CNTS
          </h2>
          <p className="text-zinc-600 max-w-xl mx-auto mb-6">
            Vous souhaitez contribuer à l'amélioration de la transfusion
            sanguine au Sénégal ? Contactez-nous pour explorer les possibilités
            de partenariat.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-8 py-3 hover:bg-primary/90 transition-colors"
          >
            Nous contacter
          </Link>
        </section>
      </div>
    </div>
  );
}
