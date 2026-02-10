import Image from "next/image";
import Link from "next/link";
import { Utensils, Droplets, Ban, Dumbbell, Moon, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Conseils au donneur — SGI-CNTS",
  description:
    "Conseils pratiques avant, pendant et après le don de sang : alimentation, hydratation, repos et précautions.",
};

export default function ConseilsDonneurPage() {
  const conseilsAvant = [
    {
      icon: <Utensils className="h-6 w-6 text-green-600" />,
      titre: "Mangez bien",
      description:
        "Prenez un repas léger mais complet avant le don. Évitez les aliments trop gras. Ne venez jamais à jeun !",
    },
    {
      icon: <Droplets className="h-6 w-6 text-blue-600" />,
      titre: "Hydratez-vous",
      description:
        "Buvez au moins un demi-litre d'eau dans les heures précédant le don. Une bonne hydratation facilite le prélèvement.",
    },
    {
      icon: <Moon className="h-6 w-6 text-indigo-600" />,
      titre: "Dormez suffisamment",
      description:
        "Une bonne nuit de sommeil (7-8 heures) vous assure d'être en forme pour le don.",
    },
    {
      icon: <Ban className="h-6 w-6 text-red-600" />,
      titre: "Évitez l'alcool",
      description:
        "Pas d'alcool dans les 24 heures précédant le don. L'alcool déshydrate et peut altérer les analyses.",
    },
  ];

  const conseilsApres = [
    {
      icon: <Droplets className="h-6 w-6 text-blue-600" />,
      titre: "Continuez à boire",
      description:
        "Buvez abondamment dans les heures qui suivent (eau, jus de fruits) pour reconstituer votre volume sanguin.",
    },
    {
      icon: <Utensils className="h-6 w-6 text-green-600" />,
      titre: "Mangez bien",
      description:
        "Privilégiez les aliments riches en fer : viande rouge, lentilles, épinards, poisson. Associez-les à de la vitamine C (agrumes).",
    },
    {
      icon: <Dumbbell className="h-6 w-6 text-orange-600" />,
      titre: "Évitez les efforts intenses",
      description:
        "Pas de sport intense ni de travail physique lourd pendant 24 heures après le don.",
    },
    {
      icon: <AlertCircle className="h-6 w-6 text-amber-600" />,
      titre: "Surveillez-vous",
      description:
        "En cas de malaise, vertige ou saignement au point de ponction, contactez le CNTS ou rendez-vous aux urgences.",
    },
  ];

  const alimentsFerriches = [
    { aliment: "Foie de boeuf", teneur: "7 mg / 100g" },
    { aliment: "Lentilles cuites", teneur: "3,3 mg / 100g" },
    { aliment: "Épinards cuits", teneur: "3,6 mg / 100g" },
    { aliment: "Viande rouge", teneur: "2,6 mg / 100g" },
    { aliment: "Haricots rouges", teneur: "2,9 mg / 100g" },
    { aliment: "Tofu", teneur: "5,4 mg / 100g" },
    { aliment: "Poisson (thon)", teneur: "1,3 mg / 100g" },
    { aliment: "Chocolat noir", teneur: "10,7 mg / 100g" },
  ];

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* Hero */}
      <div className="bg-zinc-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm border border-white/20 mb-6">
                <CheckCircle className="h-4 w-4 mr-2" />
                Bien préparer son don
              </div>
              <h1 className="text-4xl font-bold md:text-5xl mb-4">
                Conseils au donneur
              </h1>
              <p className="mt-4 text-zinc-300 max-w-xl text-lg">
                Quelques conseils simples pour que votre don se passe dans les
                meilleures conditions possibles.
              </p>
            </div>
            <div className="hidden md:block w-72 h-56 relative shrink-0">
              <Image src="/images/illustration-don-sang.svg" alt="Illustration don de sang" fill className="object-contain drop-shadow-2xl" priority />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-20">
        {/* Avant le don */}
        <section>
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-2">
            Avant le don
          </h2>
          <p className="text-zinc-600 text-center mb-10">
            Une bonne préparation garantit un don sans souci.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {conseilsAvant.map((conseil, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-zinc-50 rounded-lg flex items-center justify-center shrink-0">
                  {conseil.icon}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900">{conseil.titre}</h3>
                  <p className="text-zinc-600 mt-1 text-sm">
                    {conseil.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pendant le don */}
        <section className="bg-white rounded-2xl p-8 md:p-12 border border-zinc-200">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">
            Pendant le don
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                Restez détendu
              </h3>
              <p className="text-zinc-600 text-sm">
                Respirez calmement et détendez votre bras. Le prélèvement est
                indolore et dure environ 10 minutes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                Signalez tout malaise
              </h3>
              <p className="text-zinc-600 text-sm">
                Si vous ressentez un vertige, des nausées ou un malaise,
                prévenez immédiatement l'équipe soignante.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">
                Serrez la balle
              </h3>
              <p className="text-zinc-600 text-sm">
                Si on vous donne une balle anti-stress, serrez-la régulièrement
                pour faciliter le flux sanguin.
              </p>
            </div>
          </div>
        </section>

        {/* Après le don */}
        <section>
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-2">
            Après le don
          </h2>
          <p className="text-zinc-600 text-center mb-10">
            Prenez soin de vous pour une récupération rapide.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {conseilsApres.map((conseil, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-zinc-50 rounded-lg flex items-center justify-center shrink-0">
                  {conseil.icon}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900">{conseil.titre}</h3>
                  <p className="text-zinc-600 mt-1 text-sm">
                    {conseil.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Aliments riches en fer */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-8">
            Aliments riches en fer
          </h2>
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden max-w-2xl mx-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-6 py-3 text-sm font-semibold text-zinc-900">
                    Aliment
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-zinc-900">
                    Teneur en fer
                  </th>
                </tr>
              </thead>
              <tbody>
                {alimentsFerriches.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-6 py-3 text-sm text-zinc-700">
                      {item.aliment}
                    </td>
                    <td className="px-6 py-3 text-sm text-zinc-900 font-medium text-right">
                      {item.teneur}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-sm text-zinc-500 mt-4">
            Associez ces aliments à de la vitamine C (orange, citron) pour
            améliorer l'absorption du fer.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/donner-sang/parcours-donneur"
              className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-8 py-3 hover:bg-primary/90 transition-colors"
            >
              Le parcours du donneur
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            <Link
              href="/donner-sang/devenir-donneur"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-900 font-medium px-8 py-3 hover:bg-zinc-50 transition-colors"
            >
              Devenir donneur volontaire
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
