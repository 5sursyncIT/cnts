import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, Users, Network, Phone, Globe } from "lucide-react";

export const metadata = {
  title: "Organisation & Réseau — SGI-CNTS",
  description:
    "Découvrez l'organisation du Centre National de Transfusion Sanguine du Sénégal, sa direction, ses services et son réseau régional.",
};

export default function OrganisationPage() {
  const directions = [
    {
      titre: "Direction Générale",
      responsable: "Directeur Général",
      description:
        "Assure la gouvernance stratégique, la représentation institutionnelle et la coordination de l'ensemble des activités du CNTS.",
      icon: <Building2 className="h-6 w-6 text-primary" />,
    },
    {
      titre: "Direction Technique",
      responsable: "Directeur Technique",
      description:
        "Supervise les opérations de collecte, de qualification biologique, de préparation des produits sanguins et de distribution.",
      icon: <Users className="h-6 w-6 text-primary" />,
    },
    {
      titre: "Direction du Laboratoire",
      responsable: "Chef de Laboratoire",
      description:
        "Pilote les analyses sérologiques, immuno-hématologiques et de biologie moléculaire pour la sécurité transfusionnelle.",
      icon: <Globe className="h-6 w-6 text-primary" />,
    },
    {
      titre: "Direction Administrative et Financière",
      responsable: "DAF",
      description:
        "Gère les ressources humaines, la comptabilité, les approvisionnements et la logistique du centre.",
      icon: <Building2 className="h-6 w-6 text-primary" />,
    },
  ];

  const services = [
    "Service de Collecte et Promotion du Don",
    "Service de Qualification Biologique des Dons",
    "Service de Préparation des Produits Sanguins",
    "Service de Distribution et Approvisionnement",
    "Service d'Hémovigilance et Sécurité Transfusionnelle",
    "Service d'Immunohématologie et Groupes Rares",
    "Service de Contrôle Qualité",
    "Service Informatique et Système d'Information",
  ];

  const centresRegionaux = [
    {
      nom: "CTS de Dakar (Centre National)",
      region: "Dakar",
      type: "Centre National",
      telephone: "+221 33 821 82 72",
    },
    {
      nom: "CTS de Thiès",
      region: "Thiès",
      type: "Centre Régional",
      telephone: "+221 33 951 XX XX",
    },
    {
      nom: "CTS de Saint-Louis",
      region: "Saint-Louis",
      type: "Centre Régional",
      telephone: "+221 33 961 XX XX",
    },
    {
      nom: "CTS de Ziguinchor",
      region: "Ziguinchor",
      type: "Centre Régional",
      telephone: "+221 33 991 XX XX",
    },
    {
      nom: "CTS de Kaolack",
      region: "Kaolack",
      type: "Centre Régional",
      telephone: "+221 33 941 XX XX",
    },
    {
      nom: "CTS de Tambacounda",
      region: "Tambacounda",
      type: "Poste de Transfusion",
      telephone: "+221 33 981 XX XX",
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
                <Network className="h-4 w-4 mr-2" />
                Notre organisation
              </div>
              <h1 className="text-4xl font-bold md:text-5xl mb-4">
                Organisation & Réseau
              </h1>
              <p className="mt-4 text-zinc-300 max-w-xl text-lg">
                Le CNTS est structuré en directions et services spécialisés, avec un
                réseau de centres régionaux couvrant l'ensemble du territoire
                sénégalais.
              </p>
            </div>
            <div className="hidden md:block w-80 h-64 relative shrink-0">
              <Image src="/images/illustration-reseau.svg" alt="Carte du réseau CNTS au Sénégal" fill className="object-contain drop-shadow-2xl" priority />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-20">
        {/* Organigramme */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-zinc-900">
              Directions principales
            </h2>
            <p className="mt-2 text-zinc-600">
              L'organigramme du CNTS s'articule autour de quatre directions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {directions.map((dir, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                    {dir.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">
                      {dir.titre}
                    </h3>
                    <p className="text-sm text-primary font-medium mt-1">
                      {dir.responsable}
                    </p>
                    <p className="text-zinc-600 mt-2">{dir.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="bg-white rounded-2xl p-8 md:p-12 border border-zinc-200">
          <h2 className="text-2xl font-bold text-zinc-900 mb-8">
            Services et divisions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-4 rounded-lg bg-zinc-50"
              >
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="text-zinc-700 font-medium">{service}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Réseau régional */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-zinc-900">
              Réseau régional
            </h2>
            <p className="mt-2 text-zinc-600">
              Le CNTS s'appuie sur un réseau de centres régionaux et de postes
              de transfusion répartis sur tout le territoire.
            </p>
          </div>

          {/* Carte du réseau */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-10 flex justify-center">
            <div className="w-full max-w-lg h-72 relative">
              <Image src="/images/illustration-reseau.svg" alt="Carte du réseau de centres de transfusion au Sénégal" fill className="object-contain" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {centresRegionaux.map((centre, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm"
              >
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-zinc-900">{centre.nom}</h3>
                    <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-primary">
                      {centre.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600 mt-3">
                  <Phone className="h-4 w-4" />
                  {centre.telephone}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">
            En savoir plus sur le CNTS
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/qui-sommes-nous"
              className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-8 py-3 hover:bg-primary/90 transition-colors"
            >
              Notre mission
            </Link>
            <Link
              href="/qui-sommes-nous/textes-reference"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-900 font-medium px-8 py-3 hover:bg-zinc-50 transition-colors"
            >
              Textes de référence
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
