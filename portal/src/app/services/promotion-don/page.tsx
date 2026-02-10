import Image from "next/image";
import Link from "next/link";
import { Megaphone, Users, GraduationCap, Radio, Calendar, Heart, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Promotion du don de sang — SGI-CNTS",
  description:
    "Actions de sensibilisation et de promotion du don de sang bénévole : campagnes, partenariats, éducation et événements.",
};

export default function PromotionDonPage() {
  const axes = [
    {
      titre: "Campagnes de sensibilisation",
      description:
        "Le CNTS organise des campagnes nationales et régionales de sensibilisation tout au long de l'année pour encourager le don de sang bénévole et régulier.",
      actions: [
        "Journée mondiale du donneur de sang (14 juin)",
        "Campagnes pendant le Ramadan et les fêtes religieuses",
        "Spots radio et TV en langues locales (wolof, pulaar, sérère)",
        "Présence sur les réseaux sociaux",
      ],
      icon: <Megaphone className="h-7 w-7 text-primary" />,
    },
    {
      titre: "Collectes mobiles",
      description:
        "Des équipes mobiles se déplacent dans les entreprises, universités, casernes et lieux publics pour faciliter l'accès au don de sang.",
      actions: [
        "Collectes en entreprise (partenariats RSE)",
        "Collectes universitaires (UCAD, UGB, polytechnique...)",
        "Collectes dans les garnisons militaires",
        "Collectes lors de grands événements (foire, marathon...)",
      ],
      icon: <Calendar className="h-7 w-7 text-green-600" />,
    },
    {
      titre: "Associations de donneurs",
      description:
        "Le CNTS travaille en étroite collaboration avec les associations de donneurs bénévoles qui constituent un relais essentiel dans la communauté.",
      actions: [
        "Formation des présidents d'associations",
        "Soutien logistique pour les campagnes associatives",
        "Réseau de donneurs fidélisés pour les urgences",
        "Animation de clubs de donneurs dans les quartiers",
      ],
      icon: <Users className="h-7 w-7 text-blue-600" />,
    },
    {
      titre: "Éducation et formation",
      description:
        "Le service de promotion mène des actions éducatives dans les établissements scolaires et les structures communautaires.",
      actions: [
        "Interventions dans les lycées et collèges",
        "Formation des agents de santé communautaire",
        "Ateliers de sensibilisation pour les leaders religieux",
        "Production de supports pédagogiques en langues locales",
      ],
      icon: <GraduationCap className="h-7 w-7 text-amber-600" />,
    },
  ];

  const chiffres = [
    { valeur: "50+", label: "Collectes mobiles / an" },
    { valeur: "200+", label: "Partenaires entreprises" },
    { valeur: "15 000+", label: "Donneurs fidélisés" },
    { valeur: "5", label: "Langues de communication" },
  ];

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* Hero */}
      <div className="bg-zinc-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm border border-white/20 mb-6">
                <Radio className="h-4 w-4 mr-2" />
                Sensibilisation
              </div>
              <h1 className="text-4xl font-bold md:text-5xl mb-4">
                Promotion du don de sang
              </h1>
              <p className="mt-4 text-zinc-300 max-w-xl text-lg">
                Le CNTS mène des actions continues de promotion du don de sang
                bénévole pour garantir un approvisionnement suffisant et sûr en
                produits sanguins.
              </p>
            </div>
            <div className="hidden md:block w-80 h-64 relative shrink-0">
              <Image src="/images/illustration-collecte.svg" alt="Illustration collecte mobile" fill className="object-contain drop-shadow-2xl" priority />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-20">
        {/* Chiffres clés */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {chiffres.map((chiffre, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm text-center"
            >
              <p className="text-3xl font-bold text-primary">
                {chiffre.valeur}
              </p>
              <p className="text-sm text-zinc-600 mt-1">{chiffre.label}</p>
            </div>
          ))}
        </section>

        {/* Axes */}
        {axes.map((axe, idx) => (
          <section
            key={idx}
            className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-zinc-50 rounded-xl flex items-center justify-center shrink-0">
                {axe.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">{axe.titre}</h2>
                <p className="text-zinc-600 mt-2">{axe.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {axe.actions.map((action, aidx) => (
                <div
                  key={aidx}
                  className="flex items-center gap-2 p-3 bg-zinc-50 rounded-lg"
                >
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span className="text-sm text-zinc-700">{action}</span>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <section className="bg-primary/5 rounded-2xl p-8 md:p-12 text-center">
          <Heart className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">
            Organisez une collecte dans votre structure
          </h2>
          <p className="text-zinc-600 max-w-xl mx-auto mb-6">
            Entreprise, université, association ou collectivité : le CNTS vous
            accompagne pour organiser une collecte de sang sur votre site.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-8 py-3 hover:bg-primary/90 transition-colors"
            >
              Nous contacter
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            <Link
              href="/collectes"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-900 font-medium px-8 py-3 hover:bg-zinc-50 transition-colors"
            >
              Voir le calendrier des collectes
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
