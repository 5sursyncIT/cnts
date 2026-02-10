import Image from "next/image";
import Link from "next/link";
import { Heart, UserPlus, MapPin, Phone, Clock, Star, Users, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Devenir donneur volontaire — SGI-CNTS",
  description:
    "Rejoignez la communauté des donneurs de sang volontaires du Sénégal. Inscription, avantages et engagement citoyen.",
};

export default function DevenirDonneurPage() {
  const avantages = [
    {
      icon: <Heart className="h-6 w-6 text-primary" />,
      titre: "Sauvez des vies",
      description: "Chaque don peut sauver jusqu'à 3 personnes. Votre geste est vital pour les patients en besoin.",
    },
    {
      icon: <Star className="h-6 w-6 text-amber-500" />,
      titre: "Bilan de santé gratuit",
      description: "À chaque don, vous bénéficiez d'un mini-bilan : tension, hémoglobine, analyses sérologiques.",
    },
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      titre: "Carte de donneur",
      description: "Recevez votre carte de donneur avec votre groupe sanguin et votre historique de dons.",
    },
    {
      icon: <Clock className="h-6 w-6 text-green-600" />,
      titre: "Priorité transfusionnelle",
      description: "Les donneurs réguliers et leur famille bénéficient d'une priorité en cas de besoin transfusionnel.",
    },
  ];

  const etapesInscription = [
    {
      numero: 1,
      titre: "Inscrivez-vous en ligne",
      description: "Créez votre compte sur notre portail patient. Renseignez vos informations de base et choisissez un créneau.",
    },
    {
      numero: 2,
      titre: "Rendez-vous au CNTS",
      description: "Présentez-vous au centre le jour choisi avec votre pièce d'identité. Pas besoin de rendez-vous pour un premier don.",
    },
    {
      numero: 3,
      titre: "Passez l'entretien médical",
      description: "Un professionnel de santé vérifie votre aptitude au don en toute confidentialité.",
    },
    {
      numero: 4,
      titre: "Faites votre premier don",
      description: "En 45 minutes, vous devenez un héros ! Recevez votre carte de donneur et rejoignez la communauté.",
    },
  ];

  const pointsDeCollecte = [
    { nom: "CNTS Dakar (Siège)", adresse: "Avenue Cheikh Anta Diop, Dakar", horaires: "Lun-Ven : 8h-16h, Sam : 8h-13h" },
    { nom: "CTS de Thiès", adresse: "Centre hospitalier régional de Thiès", horaires: "Lun-Ven : 8h-15h" },
    { nom: "CTS de Saint-Louis", adresse: "Hôpital régional de Saint-Louis", horaires: "Lun-Ven : 8h-15h" },
    { nom: "CTS de Ziguinchor", adresse: "Hôpital régional de Ziguinchor", horaires: "Lun-Ven : 8h-15h" },
    { nom: "CTS de Kaolack", adresse: "Hôpital régional de Kaolack", horaires: "Lun-Ven : 8h-15h" },
  ];

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* Hero */}
      <div className="bg-zinc-900 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 z-0" />
        <div className="mx-auto max-w-7xl px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm border border-white/20 mb-6">
                <UserPlus className="h-4 w-4 mr-2" />
                Rejoignez-nous
              </div>
              <h1 className="text-4xl font-bold md:text-5xl lg:text-6xl mb-6">
                Devenez donneur volontaire
              </h1>
              <p className="mt-4 text-zinc-300 max-w-xl text-lg md:text-xl">
                Le Sénégal a besoin de 180 000 poches de sang par an. Chaque donneur
                volontaire contribue à sauver des vies et à assurer la sécurité
                transfusionnelle.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                <Link
                  href="/espace-patient/inscription"
                  className="inline-flex items-center justify-center rounded-md bg-white text-primary font-bold px-8 py-3 text-base shadow-lg hover:bg-zinc-100 transition-colors"
                >
                  S'inscrire maintenant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
                <Link
                  href="/donner-sang/qui-peut-donner"
                  className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800/50 text-white font-medium px-8 py-3 text-base hover:bg-zinc-800 transition-colors"
                >
                  Suis-je éligible ?
                </Link>
              </div>
            </div>
            <div className="hidden md:block w-80 h-72 relative shrink-0">
              <Image src="/images/illustration-don-sang.svg" alt="Illustration don de sang" fill className="object-contain drop-shadow-2xl" priority />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-20">
        {/* Avantages */}
        <section>
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-10">
            Les avantages d'être donneur
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {avantages.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm text-center hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold text-zinc-900 mb-2">{item.titre}</h3>
                <p className="text-sm text-zinc-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Étapes d'inscription */}
        <section>
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-10">
            Comment s'inscrire ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {etapesInscription.map((etape, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm mb-4">
                    {etape.numero}
                  </div>
                  <h3 className="font-bold text-zinc-900 mb-2">
                    {etape.titre}
                  </h3>
                  <p className="text-sm text-zinc-600">{etape.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Points de collecte */}
        <section>
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-10">
            Où donner ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pointsDeCollecte.map((point, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm"
              >
                <h3 className="font-bold text-zinc-900 mb-3">{point.nom}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-zinc-600">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    {point.adresse}
                  </div>
                  <div className="flex items-start gap-2 text-zinc-600">
                    <Clock className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    {point.horaires}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-zinc-500 mt-6">
            Le CNTS organise également des collectes mobiles dans les
            entreprises, universités et communes.{" "}
            <Link
              href="/collectes"
              className="text-primary font-medium hover:underline"
            >
              Voir le calendrier
            </Link>
          </p>
        </section>

        {/* Urgence */}
        <section className="bg-primary/5 rounded-2xl p-8 md:p-12">
          <div className="flex items-start gap-4">
            <Phone className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                Besoin urgent de sang ?
              </h3>
              <p className="text-zinc-700 mb-4">
                En cas de pénurie critique ou d'urgence transfusionnelle, le CNTS
                lance des appels à dons via SMS et réseaux sociaux. Inscrivez-vous
                pour être alerté.
              </p>
              <Link
                href="/espace-patient/inscription"
                className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-6 py-2.5 hover:bg-primary/90 transition-colors text-sm"
              >
                Créer mon compte donneur
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
