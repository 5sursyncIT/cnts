import Link from "next/link";
import { Handshake, GraduationCap, FlaskConical, Calendar, Mail, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Appels à collaboration — SGI-CNTS",
  description:
    "Opportunités de collaboration scientifique avec le CNTS : stages, thèses, projets de recherche et partenariats.",
};

export default function AppelsPage() {
  const opportunites = [
    {
      type: "Stage de recherche",
      titre: "Caractérisation des variants ABO dans la population sénégalaise",
      description:
        "Stage de 6 mois au laboratoire d'immuno-hématologie pour étudier les sous-groupes ABO par techniques moléculaires.",
      profil: "Master 2 ou thèse en biologie / hématologie",
      duree: "6 mois",
      disponible: true,
    },
    {
      type: "Projet collaboratif",
      titre: "Évaluation de tests rapides de dépistage en collecte mobile",
      description:
        "Évaluation comparative de nouveaux tests rapides combinés (VIH/VHB/VHC/Syphilis) pour les collectes en zone rurale.",
      profil: "Laboratoire ou institution de recherche",
      duree: "18 mois",
      disponible: true,
    },
    {
      type: "Thèse de doctorat",
      titre: "Modélisation prédictive de la demande transfusionnelle au Sénégal",
      description:
        "Co-encadrement d'une thèse en data science appliquée à la prévision des besoins en produits sanguins.",
      profil: "Doctorant en informatique / biostatistiques",
      duree: "3 ans",
      disponible: true,
    },
    {
      type: "Partenariat technique",
      titre: "Interfaçage automates — système d'information du CNTS",
      description:
        "Développement de connecteurs ASTM/HL7 pour l'interfaçage automatique des automates d'analyses avec le SGI-CNTS.",
      profil: "Entreprise ou laboratoire d'informatique biomédicale",
      duree: "12 mois",
      disponible: false,
    },
  ];

  const typeIcons: Record<string, React.ReactNode> = {
    "Stage de recherche": <GraduationCap className="h-5 w-5 text-blue-600" />,
    "Projet collaboratif": <FlaskConical className="h-5 w-5 text-green-600" />,
    "Thèse de doctorat": <GraduationCap className="h-5 w-5 text-purple-600" />,
    "Partenariat technique": <Handshake className="h-5 w-5 text-amber-600" />,
  };

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* Hero */}
      <div className="bg-zinc-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm border border-white/20 mb-6">
            <Handshake className="h-4 w-4 mr-2" />
            Collaborons ensemble
          </div>
          <h1 className="text-4xl font-bold md:text-5xl mb-4">
            Appels à collaboration
          </h1>
          <p className="mt-4 text-zinc-300 max-w-2xl mx-auto text-lg">
            Le CNTS est ouvert aux collaborations scientifiques et techniques.
            Découvrez les opportunités actuelles.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-16 space-y-8">
        {opportunites.map((opp, idx) => (
          <section
            key={idx}
            className={`bg-white p-8 rounded-xl border shadow-sm ${opp.disponible ? "border-zinc-200" : "border-zinc-200 opacity-60"}`}
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700">
                {typeIcons[opp.type]}
                {opp.type}
              </span>
              <span className="flex items-center gap-1 text-sm text-zinc-500">
                <Calendar className="h-3.5 w-3.5" />
                {opp.duree}
              </span>
              {opp.disponible ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                  Ouvert
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500">
                  Pourvu
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-zinc-900 mb-2">
              {opp.titre}
            </h2>
            <p className="text-zinc-600 mb-4">{opp.description}</p>
            <p className="text-sm text-zinc-700">
              <span className="font-medium">Profil recherché :</span>{" "}
              {opp.profil}
            </p>
          </section>
        ))}

        {/* Comment postuler */}
        <section className="bg-primary/5 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">
            Comment postuler ?
          </h2>
          <div className="space-y-4 text-zinc-700">
            <p>
              Pour toute candidature ou proposition de collaboration, envoyez un
              dossier comprenant :
            </p>
            <ul className="space-y-2 pl-4">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                Une lettre de motivation précisant l'opportunité visée
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                Un CV détaillé ou présentation de votre structure
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                Un résumé de votre projet de recherche (si applicable)
              </li>
            </ul>
            <div className="flex items-center gap-2 mt-6 p-4 bg-white rounded-lg border border-zinc-200">
              <Mail className="h-5 w-5 text-primary shrink-0" />
              <span className="font-medium">recherche@cnts.sn</span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pt-4">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-8 py-3 hover:bg-primary/90 transition-colors"
            >
              Nous contacter
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            <Link
              href="/recherche"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-900 font-medium px-8 py-3 hover:bg-zinc-50 transition-colors"
            >
              Retour Recherche
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
