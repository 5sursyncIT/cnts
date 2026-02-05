import Link from "next/link";
import { Check, X, Clock, Heart, Scale, Calendar, AlertTriangle, Coffee, FileText, Droplet } from "lucide-react";

export const metadata = {
  title: "Pourquoi et comment donner son sang ? — SGI-CNTS",
  description: "Tout savoir sur le don de sang au Sénégal : conditions d'éligibilité, déroulement du don, contre-indications et prise de rendez-vous.",
};

export default function DonnerSangPage() {
  const eligibility = [
    { icon: <Calendar className="h-5 w-5" />, text: "Avoir entre 18 et 60 ans" },
    { icon: <Scale className="h-5 w-5" />, text: "Peser au moins 50 kg" },
    { icon: <Heart className="h-5 w-5" />, text: "Être en bonne santé" },
    { icon: <FileText className="h-5 w-5" />, text: "Avoir une pièce d'identité" },
  ];

  const processSteps = [
    {
      title: "1. L'accueil",
      description: "Enregistrement de votre dossier administratif avec votre pièce d'identité.",
      icon: <FileText className="h-6 w-6 text-primary" />,
    },
    {
      title: "2. L'entretien médical",
      description: "Entretien confidentiel avec un médecin ou un infirmier pour vérifier votre aptitude au don.",
      icon: <StethoscopeIcon className="h-6 w-6 text-primary" />,
    },
    {
      title: "3. Le prélèvement",
      description: "Le don dure environ 10 minutes. Le matériel est stérile et à usage unique.",
      icon: <Droplet className="h-6 w-6 text-primary" />,
    },
    {
      title: "4. La collation",
      description: "Moment de repos et collation offerte pour récupérer avant de repartir.",
      icon: <Coffee className="h-6 w-6 text-primary" />,
    },
  ];

  const contraindications = {
    temporary: [
      "Soins dentaires (24h à 7 jours)",
      "Infection récente / Fièvre (2 semaines)",
      "Tatouage ou piercing (4 mois)",
      "Voyage dans certaines zones (4 mois)",
      "Grossesse et accouchement (6 mois)",
      "Intervention chirurgicale (4 mois)",
    ],
    permanent: [
      "Maladies cardiaques ou respiratoires graves",
      "Diabète insulino-dépendant",
      "Maladies transmissibles par le sang (VIH, Hépatites B/C, Syphilis...)",
      "Maladies chroniques graves",
    ],
  };

  return (
    <main className="bg-zinc-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-zinc-900 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 z-0"></div>
        <div className="mx-auto max-w-7xl px-4 relative z-10 text-center">
          <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm border border-white/20 mb-6">
            <Heart className="h-4 w-4 mr-2 fill-current text-red-500" />
            Un geste simple pour sauver des vies
          </div>
          <h1 className="text-4xl font-bold md:text-5xl lg:text-6xl mb-6">
            Tout savoir sur le don de sang
          </h1>
          <p className="mt-4 text-zinc-300 max-w-2xl mx-auto text-lg md:text-xl">
            Vous avez le pouvoir de sauver 3 vies en seulement 45 minutes. 
            Découvrez comment devenir donneur et rejoignez notre communauté solidaire.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/espace-patient"
              className="inline-flex items-center justify-center rounded-md bg-white text-primary font-bold px-8 py-3 text-base shadow-lg hover:bg-zinc-100 transition-colors"
            >
              Prendre rendez-vous
            </Link>
            <Link
              href="#eligibilite"
              className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800/50 text-white font-medium px-8 py-3 text-base hover:bg-zinc-800 transition-colors"
            >
              Suis-je éligible ?
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-20">
        
        {/* Conditions d'éligibilité */}
        <section id="eligibilite" className="scroll-mt-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-zinc-900">Qui peut donner ?</h2>
            <p className="mt-2 text-zinc-600">Les conditions de base pour devenir donneur de sang.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {eligibility.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-50 text-primary rounded-full flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <span className="font-semibold text-zinc-900">{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Déroulement du don */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-zinc-900">Comment ça se passe ?</h2>
            <p className="mt-2 text-zinc-600">Le parcours du donneur en 4 étapes simples.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-zinc-200 -z-10 mx-16"></div>

            {processSteps.map((step, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm relative">
                <div className="w-12 h-12 bg-white border-2 border-primary text-primary rounded-full flex items-center justify-center mb-4 mx-auto lg:mx-0 z-10">
                  <span className="font-bold">{index + 1}</span>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">{step.title.split('. ')[1]}</h3>
                <p className="text-sm text-zinc-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contre-indications */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="h-6 w-6 text-orange-500" />
              <h3 className="text-xl font-bold text-zinc-900">Contre-indications temporaires</h3>
            </div>
            <ul className="space-y-3">
              {contraindications.temporary.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-zinc-700">
                  <Check className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-zinc-500 bg-zinc-50 p-4 rounded-lg">
              Une fois le délai passé, vous pourrez de nouveau donner votre sang.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className="text-xl font-bold text-zinc-900">Contre-indications permanentes</h3>
            </div>
            <ul className="space-y-3">
              {contraindications.permanent.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-zinc-700">
                  <X className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-zinc-500 bg-zinc-50 p-4 rounded-lg">
              Pour votre sécurité et celle des receveurs, ces conditions ne permettent pas le don.
            </p>
          </div>
        </section>

        {/* FAQ / Info importante */}
        <section className="bg-primary/5 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Bon à savoir</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">Fréquence des dons</h3>
              <p className="text-zinc-600">Les hommes peuvent donner jusqu'à 6 fois par an, les femmes jusqu'à 4 fois, avec 8 semaines d'intervalle minimum.</p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">Avant le don</h3>
              <p className="text-zinc-600">Ne venez pas à jeun ! Mangez léger et buvez beaucoup d'eau avant votre don.</p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 mb-2">Après le don</h3>
              <p className="text-zinc-600">Évitez les efforts physiques intenses dans les heures qui suivent et continuez à vous hydrater.</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">Prêt à sauver des vies ?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/espace-patient"
              className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-8 py-4 text-lg shadow-lg hover:bg-primary/90 transition-colors"
            >
              Je prends rendez-vous
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-900 font-medium px-8 py-4 text-lg hover:bg-zinc-50 transition-colors"
            >
              J'ai encore des questions
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

// Simple icon component for Stethoscope since it might not be exported by all lucide versions or under different name
function StethoscopeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  )
}
