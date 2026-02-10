import Image from "next/image";
import Link from "next/link";
import { Stethoscope, Heart, Activity, Users, ClipboardList } from "lucide-react";

export const metadata = {
  title: "Hématologie clinique — SGI-CNTS",
  description:
    "Service d'hématologie clinique du CNTS : prise en charge des patients drépanocytaires, hémophiles et autres pathologies hématologiques.",
};

export default function HematologiePage() {
  const activites = [
    {
      titre: "Prise en charge de la drépanocytose",
      description:
        "La drépanocytose est la première maladie génétique au Sénégal. Le CNTS assure le suivi transfusionnel des patients drépanocytaires, avec des protocoles d'échanges transfusionnels et de transfusions simples.",
      points: [
        "Échanges transfusionnels (manuels et automatisés)",
        "Suivi régulier du taux d'HbS",
        "Phénotypage étendu pour compatibilité optimale",
        "Éducation thérapeutique des patients et familles",
      ],
      icon: <Heart className="h-7 w-7 text-red-500" />,
    },
    {
      titre: "Hémostase et coagulation",
      description:
        "Diagnostic et suivi des troubles de l'hémostase : hémophilies, maladie de von Willebrand, thrombopénies. Le service assure l'accès aux facteurs de coagulation et aux transfusions plaquettaires.",
      points: [
        "Bilan d'hémostase complet",
        "Suivi des patients hémophiles",
        "Traitement substitutif par facteurs de coagulation",
        "Conseil génétique",
      ],
      icon: <Activity className="h-7 w-7 text-blue-500" />,
    },
    {
      titre: "Conseil transfusionnel",
      description:
        "Le CNTS met à disposition des cliniciens un service de conseil transfusionnel 24h/24 pour les cas complexes : patients poly-immunisés, groupes rares, transfusions massives.",
      points: [
        "Avis spécialisé pour patients immunisés",
        "Recherche de donneurs compatibles pour groupes rares",
        "Protocoles de transfusion massive",
        "Formation continue des équipes hospitalières",
      ],
      icon: <ClipboardList className="h-7 w-7 text-green-600" />,
    },
    {
      titre: "Hémovigilance",
      description:
        "Surveillance et prévention des effets indésirables liés à la transfusion. Le CNTS participe au système national d'hémovigilance et assure le suivi de chaque incident.",
      points: [
        "Déclaration et investigation des EIR",
        "Contrôle ultime au lit du malade (CULM)",
        "Suivi per-transfusionnel",
        "Traçabilité complète donneur-receveur",
      ],
      icon: <Users className="h-7 w-7 text-amber-600" />,
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
                <Stethoscope className="h-4 w-4 mr-2" />
                Soins spécialisés
              </div>
              <h1 className="text-4xl font-bold md:text-5xl mb-4">
                Hématologie clinique
              </h1>
              <p className="mt-4 text-zinc-300 max-w-xl text-lg">
                Le service d'hématologie clinique du CNTS assure la prise en charge
                des patients atteints de pathologies hématologiques nécessitant un
                support transfusionnel.
              </p>
            </div>
            <div className="hidden md:block w-72 h-56 relative shrink-0">
              <Image src="/images/illustration-laboratoire.svg" alt="Illustration hématologie" fill className="object-contain drop-shadow-2xl" priority />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-12">
        {activites.map((activite, idx) => (
          <section
            key={idx}
            className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 bg-zinc-50 rounded-xl flex items-center justify-center shrink-0">
                {activite.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">
                  {activite.titre}
                </h2>
                <p className="text-zinc-600 mt-2">{activite.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              {activite.points.map((point, pidx) => (
                <div
                  key={pidx}
                  className="flex items-center gap-2 p-3 bg-zinc-50 rounded-lg"
                >
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span className="text-sm text-zinc-700">{point}</span>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Chiffres */}
        <section className="bg-primary/5 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-8">
            Chiffres clés
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">1 200+</p>
              <p className="text-sm text-zinc-600 mt-1">
                Patients drépanocytaires suivis
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">5 000+</p>
              <p className="text-sm text-zinc-600 mt-1">
                Transfusions par an
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">24h/24</p>
              <p className="text-sm text-zinc-600 mt-1">
                Conseil transfusionnel
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">100%</p>
              <p className="text-sm text-zinc-600 mt-1">
                Traçabilité assurée
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/services/laboratoires"
              className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-8 py-3 hover:bg-primary/90 transition-colors"
            >
              Nos laboratoires
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-900 font-medium px-8 py-3 hover:bg-zinc-50 transition-colors"
            >
              Contacter le service
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
