import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, Heart, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Périodicité du don de sang — SGI-CNTS",
  description:
    "Fréquence des dons de sang : intervalles entre les dons pour les hommes et les femmes, types de dons et calendrier.",
};

export default function PeriodicitePage() {
  const typesDeDons = [
    {
      type: "Don de sang total",
      duree: "10 à 15 minutes",
      intervalle_homme: "8 semaines (56 jours)",
      intervalle_femme: "12 semaines (84 jours)",
      max_homme: "6 dons / an",
      max_femme: "4 dons / an",
      volume: "450 ml",
      description:
        "Le don le plus courant. Le sang total est ensuite séparé en ses composants (globules rouges, plasma, plaquettes).",
    },
    {
      type: "Don de plaquettes (aphérèse)",
      duree: "1h30 à 2h",
      intervalle_homme: "4 semaines",
      intervalle_femme: "4 semaines",
      max_homme: "12 dons / an",
      max_femme: "12 dons / an",
      volume: "Variable",
      description:
        "Seules les plaquettes sont prélevées, les autres composants vous sont restitués. Essentiel pour les patients en chimiothérapie.",
    },
    {
      type: "Don de plasma (aphérèse)",
      duree: "45 minutes à 1h",
      intervalle_homme: "2 semaines",
      intervalle_femme: "2 semaines",
      max_homme: "24 dons / an",
      max_femme: "24 dons / an",
      volume: "600 ml max",
      description:
        "Seul le plasma est prélevé. Il sert à la fabrication de médicaments dérivés du sang et aux transfusions.",
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
                <Calendar className="h-4 w-4 mr-2" />
                Fréquence des dons
              </div>
              <h1 className="text-4xl font-bold md:text-5xl mb-4">
                Périodicité du don
              </h1>
              <p className="mt-4 text-zinc-300 max-w-xl text-lg">
                Combien de fois peut-on donner son sang par an ? Quels sont les
                intervalles à respecter entre chaque don ?
              </p>
            </div>
            <div className="hidden md:block w-72 h-56 relative shrink-0">
              <Image src="/images/illustration-don-sang.svg" alt="Illustration don de sang" fill className="object-contain drop-shadow-2xl" priority />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-20">
        {/* Résumé rapide */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <Heart className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">Hommes</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                <span className="text-zinc-700">Intervalle minimum</span>
                <span className="font-bold text-zinc-900">8 semaines</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                <span className="text-zinc-700">Maximum par an</span>
                <span className="font-bold text-zinc-900">6 dons</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                <span className="text-zinc-700">Volume par don</span>
                <span className="font-bold text-zinc-900">450 ml</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center">
                <Heart className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">Femmes</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                <span className="text-zinc-700">Intervalle minimum</span>
                <span className="font-bold text-zinc-900">12 semaines</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                <span className="text-zinc-700">Maximum par an</span>
                <span className="font-bold text-zinc-900">4 dons</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                <span className="text-zinc-700">Volume par don</span>
                <span className="font-bold text-zinc-900">450 ml</span>
              </div>
            </div>
          </div>
        </section>

        {/* Info intervalle */}
        <section className="bg-blue-50 rounded-2xl p-8 md:p-12 border border-blue-100">
          <div className="flex items-start gap-4">
            <Clock className="h-8 w-8 text-blue-600 shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                Pourquoi ces intervalles ?
              </h3>
              <p className="text-zinc-700">
                Le corps a besoin de temps pour régénérer les globules rouges
                prélevés. Le fer perdu lors du don est reconstitué en environ 8
                semaines chez l'homme et 12 semaines chez la femme (en raison des
                pertes menstruelles). Respecter ces délais garantit votre santé
                et la qualité du sang collecté.
              </p>
            </div>
          </div>
        </section>

        {/* Types de dons */}
        <section>
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-10">
            Les différents types de dons
          </h2>

          <div className="space-y-6">
            {typesDeDons.map((don, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm"
              >
                <h3 className="text-xl font-bold text-zinc-900 mb-2">
                  {don.type}
                </h3>
                <p className="text-zinc-600 mb-6">{don.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-zinc-50 rounded-lg text-center">
                    <p className="text-xs text-zinc-500 mb-1">Durée</p>
                    <p className="font-bold text-zinc-900 text-sm">
                      {don.duree}
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-lg text-center">
                    <p className="text-xs text-zinc-500 mb-1">Volume</p>
                    <p className="font-bold text-zinc-900 text-sm">
                      {don.volume}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-blue-600 mb-1">
                      Homme : max/an
                    </p>
                    <p className="font-bold text-zinc-900 text-sm">
                      {don.max_homme}
                    </p>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg text-center">
                    <p className="text-xs text-pink-600 mb-1">
                      Femme : max/an
                    </p>
                    <p className="font-bold text-zinc-900 text-sm">
                      {don.max_femme}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">
            Prêt à planifier votre prochain don ?
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/espace-patient"
              className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-8 py-3 hover:bg-primary/90 transition-colors"
            >
              Prendre rendez-vous
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            <Link
              href="/donner-sang/conseils"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-900 font-medium px-8 py-3 hover:bg-zinc-50 transition-colors"
            >
              Conseils au donneur
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
