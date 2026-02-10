import Image from "next/image";
import Link from "next/link";
import { FileText, Stethoscope, Droplet, Coffee, Clock, CheckCircle, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Le parcours du donneur — SGI-CNTS",
  description:
    "Découvrez les étapes du don de sang au CNTS : accueil, entretien médical, prélèvement, collation et suivi.",
};

export default function ParcoursDonneurPage() {
  const etapes = [
    {
      numero: 1,
      titre: "Accueil et inscription",
      duree: "5 à 10 min",
      icon: <FileText className="h-6 w-6" />,
      description:
        "Vous êtes accueilli par notre équipe qui enregistre votre dossier administratif. Munissez-vous de votre pièce d'identité (CNI, passeport ou carte de séjour).",
      details: [
        "Vérification de votre identité",
        "Création ou mise à jour de votre dossier donneur",
        "Remise d'un questionnaire pré-don à remplir",
      ],
    },
    {
      numero: 2,
      titre: "Entretien médical",
      duree: "10 à 15 min",
      icon: <Stethoscope className="h-6 w-6" />,
      description:
        "Un médecin ou un infirmier vous reçoit en toute confidentialité pour évaluer votre aptitude au don. Cet entretien est essentiel pour votre sécurité et celle du receveur.",
      details: [
        "Revue du questionnaire de santé",
        "Prise de la tension artérielle et du pouls",
        "Contrôle du taux d'hémoglobine (goutte de sang au doigt)",
        "Vérification de l'intervalle depuis le dernier don",
        "Réponses à vos questions",
      ],
    },
    {
      numero: 3,
      titre: "Le prélèvement",
      duree: "10 à 15 min",
      icon: <Droplet className="h-6 w-6" />,
      description:
        "Le prélèvement lui-même est rapide et indolore. Vous êtes installé confortablement sur un fauteuil de don. Tout le matériel est stérile et à usage unique.",
      details: [
        "Désinfection du bras et pose de l'aiguille",
        "Prélèvement de 450 ml de sang (environ 10% de votre volume sanguin)",
        "Prélèvement d'échantillons pour les analyses de sécurité",
        "Surveillance continue par l'équipe soignante",
      ],
    },
    {
      numero: 4,
      titre: "Repos et collation",
      duree: "15 à 20 min",
      icon: <Coffee className="h-6 w-6" />,
      description:
        "Après le don, vous êtes invité à vous reposer et à prendre une collation offerte par le CNTS. Ce moment est important pour votre récupération.",
      details: [
        "Repos allongé ou assis pendant quelques minutes",
        "Boissons et collation offertes (jus, biscuits, fruits)",
        "Surveillance de votre état général",
        "Remise de votre carte de donneur ou mise à jour",
      ],
    },
    {
      numero: 5,
      titre: "Suivi post-don",
      duree: "Les jours suivants",
      icon: <CheckCircle className="h-6 w-6" />,
      description:
        "Votre sang est analysé, préparé et distribué aux patients qui en ont besoin. Vous recevez vos résultats d'analyses et pouvez suivre votre historique.",
      details: [
        "Analyses sérologiques et immuno-hématologiques",
        "Résultats disponibles dans votre espace patient",
        "Fractionnement du sang en composants (globules rouges, plasma, plaquettes)",
        "Distribution aux hôpitaux selon les besoins",
      ],
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
                <Droplet className="h-4 w-4 mr-2 fill-current text-red-500" />
                Étape par étape
              </div>
              <h1 className="text-4xl font-bold md:text-5xl mb-4">
                Le parcours du donneur
              </h1>
              <p className="mt-4 text-zinc-300 max-w-xl text-lg">
                De votre arrivée au CNTS à la distribution de votre sang : découvrez
                chaque étape du parcours en détail.
              </p>
              <div className="mt-6 flex items-center justify-center md:justify-start gap-2 text-zinc-400">
                <Clock className="h-5 w-5" />
                <span>Durée totale : environ 45 minutes à 1 heure</span>
              </div>
            </div>
            <div className="hidden md:block w-80 h-64 relative shrink-0">
              <Image src="/images/illustration-parcours.svg" alt="Les 5 étapes du parcours donneur" fill className="object-contain drop-shadow-2xl" priority />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-16 space-y-8">
        {/* Timeline */}
        {etapes.map((etape, idx) => (
          <div key={idx} className="relative">
            {/* Connecteur vertical */}
            {idx < etapes.length - 1 && (
              <div className="absolute left-6 top-20 bottom-0 w-0.5 bg-zinc-200 hidden md:block" />
            )}

            <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm">
              <div className="flex items-start gap-6">
                {/* Numéro */}
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                  {etape.numero}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                    <h2 className="text-xl font-bold text-zinc-900">
                      {etape.titre}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-sm text-zinc-500 bg-zinc-50 px-3 py-1 rounded-full">
                      <Clock className="h-3.5 w-3.5" />
                      {etape.duree}
                    </span>
                  </div>
                  <p className="text-zinc-600 mb-4">{etape.description}</p>

                  <ul className="space-y-2">
                    {etape.details.map((detail, didx) => (
                      <li
                        key={didx}
                        className="flex items-start gap-2 text-sm text-zinc-700"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Conseil */}
        <section className="bg-primary/5 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">
            Prêt pour votre premier don ?
          </h2>
          <p className="text-zinc-600 max-w-xl mx-auto mb-6">
            N'hésitez pas à venir accompagné ! Toute notre équipe est là pour
            vous guider et répondre à vos questions.
          </p>
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
              Conseils avant le don
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
