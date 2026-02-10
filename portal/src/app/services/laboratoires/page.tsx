import Image from "next/image";
import Link from "next/link";
import { FlaskConical, Microscope, Shield, CheckCircle, Dna } from "lucide-react";

export const metadata = {
  title: "Laboratoires — SGI-CNTS",
  description:
    "Les laboratoires du CNTS : qualification biologique, immuno-hématologie, biologie moléculaire et contrôle qualité.",
};

export default function LaboratoiresPage() {
  const laboratoires = [
    {
      nom: "Laboratoire de Qualification Biologique des Dons (QBD)",
      description:
        "Réalise les 6 tests obligatoires sur chaque don de sang pour garantir la sécurité transfusionnelle. Aucun produit sanguin n'est libéré sans validation biologique complète.",
      tests: [
        "Groupage ABO / Rhésus (D, C, E, c, e, Kell)",
        "Dépistage VIH 1/2 (Anticorps + Ag p24)",
        "Dépistage Hépatite B (Ag HBs)",
        "Dépistage Hépatite C (Anticorps anti-VHC)",
        "Dépistage Syphilis (TPHA/VDRL)",
        "Tests NAT (PCR) pour VIH, VHB, VHC",
      ],
      icon: <Shield className="h-8 w-8 text-primary" />,
    },
    {
      nom: "Laboratoire d'Immuno-Hématologie",
      description:
        "Spécialisé dans la compatibilité transfusionnelle, le phénotypage étendu et l'identification des anticorps irréguliers. Gère le registre national des groupes rares.",
      tests: [
        "Phénotypage étendu (Kell, Duffy, Kidd, MNS, Lewis)",
        "Recherche d'Agglutinines Irrégulières (RAI)",
        "Épreuves de compatibilité au laboratoire",
        "Identification d'anticorps complexes",
        "Registre national des donneurs de groupes rares",
        "Conseil transfusionnel pour patients immunisés",
      ],
      icon: <Microscope className="h-8 w-8 text-blue-600" />,
    },
    {
      nom: "Laboratoire de Biologie Moléculaire",
      description:
        "Effectue les tests de détection génomique virale (NAT/PCR), permettant de réduire la période fenêtre sérologique et d'améliorer la détection précoce des infections.",
      tests: [
        "PCR VIH (période fenêtre réduite à 7 jours)",
        "PCR VHB (période fenêtre réduite à 20 jours)",
        "PCR VHC (période fenêtre réduite à 7 jours)",
        "Contrôle de qualité interne des réactifs",
        "Participation aux contrôles externes (EEQ)",
      ],
      icon: <Dna className="h-8 w-8 text-green-600" />,
    },
    {
      nom: "Laboratoire de Contrôle Qualité",
      description:
        "Assure le contrôle de la conformité des produits sanguins préparés : volume, taux d'hémoglobine résiduel, contamination bactérienne, et respect des normes de stockage.",
      tests: [
        "Contrôle des CGR (Ht, Hb, volume, leucocytes résiduels)",
        "Contrôle des PFC (facteurs de coagulation, fibrinogène)",
        "Contrôle des CP (numération plaquettaire, pH, stérilité)",
        "Monitoring température des enceintes de stockage",
        "Contrôle microbiologique",
      ],
      icon: <FlaskConical className="h-8 w-8 text-amber-600" />,
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
                Excellence scientifique
              </div>
              <h1 className="text-4xl font-bold md:text-5xl mb-4">
                Nos laboratoires
              </h1>
              <p className="mt-4 text-zinc-300 max-w-xl text-lg">
                Le CNTS dispose de laboratoires de pointe pour assurer la sécurité
                biologique de chaque produit sanguin distribué.
              </p>
            </div>
            <div className="hidden md:block w-80 h-64 relative shrink-0">
              <Image src="/images/illustration-laboratoire.svg" alt="Illustration laboratoire" fill className="object-contain drop-shadow-2xl" priority />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-12">
        {laboratoires.map((labo, idx) => (
          <section
            key={idx}
            className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-zinc-50 rounded-xl flex items-center justify-center shrink-0">
                {labo.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">{labo.nom}</h2>
                <p className="text-zinc-600 mt-2">{labo.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 pl-0 md:pl-18">
              {labo.tests.map((test, tidx) => (
                <div
                  key={tidx}
                  className="flex items-start gap-2 p-3 bg-zinc-50 rounded-lg"
                >
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-700">{test}</span>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Accréditation */}
        <section className="bg-blue-50 rounded-2xl p-8 md:p-12 border border-blue-100">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">
            Démarche qualité
          </h2>
          <p className="text-zinc-700 mb-4">
            Les laboratoires du CNTS participent régulièrement aux programmes
            d'évaluation externe de la qualité (EEQ) et suivent les
            recommandations de l'OMS pour les services de transfusion sanguine.
          </p>
          <p className="text-zinc-700">
            L'objectif est l'accréditation selon la norme ISO 15189 pour les
            laboratoires de biologie médicale et la certification AfSBT (Africa
            Society for Blood Transfusion).
          </p>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/services/produits-sanguins"
              className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-8 py-3 hover:bg-primary/90 transition-colors"
            >
              Nos produits sanguins
            </Link>
            <Link
              href="/recherche"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-900 font-medium px-8 py-3 hover:bg-zinc-50 transition-colors"
            >
              Recherche & Innovation
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
