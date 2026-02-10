import Image from "next/image";
import Link from "next/link";
import { Check, X, Calendar, Scale, Heart, FileText, AlertTriangle, Clock } from "lucide-react";

export const metadata = {
  title: "Qui peut donner son sang ? — SGI-CNTS",
  description:
    "Conditions d'éligibilité au don de sang : âge, poids, état de santé, contre-indications temporaires et permanentes.",
};

export default function QuiPeutDonnerPage() {
  const conditionsBase = [
    { icon: <Calendar className="h-5 w-5" />, text: "Avoir entre 18 et 60 ans", detail: "À partir de 17 ans avec autorisation parentale" },
    { icon: <Scale className="h-5 w-5" />, text: "Peser au moins 50 kg", detail: "Garantit un volume de sang suffisant pour votre sécurité" },
    { icon: <Heart className="h-5 w-5" />, text: "Être en bonne santé générale", detail: "Pas de maladie aiguë ni de traitement en cours" },
    { icon: <FileText className="h-5 w-5" />, text: "Présenter une pièce d'identité", detail: "CNI, passeport ou carte de séjour en cours de validité" },
  ];

  const contreindicationsTemp = [
    { motif: "Soins dentaires (extraction, détartrage)", delai: "24h à 7 jours" },
    { motif: "Infection récente, fièvre, grippe", delai: "2 semaines après guérison" },
    { motif: "Tatouage, piercing, acupuncture", delai: "4 mois" },
    { motif: "Voyage en zone d'endémie palustre", delai: "4 mois après le retour" },
    { motif: "Intervention chirurgicale", delai: "4 à 6 mois" },
    { motif: "Grossesse et accouchement", delai: "6 mois après l'accouchement" },
    { motif: "Allaitement", delai: "6 mois après la fin de l'allaitement" },
    { motif: "Transfusion sanguine reçue", delai: "12 mois" },
    { motif: "Vaccination (selon le type)", delai: "48h à 4 semaines" },
    { motif: "Prise d'antibiotiques", delai: "7 à 14 jours après la fin du traitement" },
  ];

  const contreindicationsPerm = [
    "Maladies cardiaques ou respiratoires graves",
    "Diabète insulino-dépendant (type 1)",
    "Infection par le VIH",
    "Hépatites B ou C (antécédent ou porteur)",
    "Syphilis",
    "Maladies auto-immunes sévères",
    "Cancers (même traités)",
    "Épilepsie sous traitement",
    "Drépanocytose homozygote (SS)",
    "Maladies hémorragiques (hémophilie...)",
  ];

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* Hero */}
      <div className="bg-zinc-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm border border-white/20 mb-6">
                <Heart className="h-4 w-4 mr-2 fill-current text-red-500" />
                Éligibilité au don
              </div>
              <h1 className="text-4xl font-bold md:text-5xl mb-4">
                Qui peut donner son sang ?
              </h1>
              <p className="mt-4 text-zinc-300 max-w-xl text-lg">
                Vérifiez si vous remplissez les conditions pour faire un don de
                sang. En cas de doute, notre équipe médicale vous accompagnera lors
                de l'entretien pré-don.
              </p>
            </div>
            <div className="hidden md:block w-80 h-64 relative shrink-0">
              <Image src="/images/illustration-don-sang.svg" alt="Illustration don de sang" fill className="object-contain drop-shadow-2xl" priority />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-20">
        {/* Conditions de base */}
        <section>
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-10">
            Les conditions de base
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {conditionsBase.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900">{item.text}</h3>
                  <p className="text-sm text-zinc-600 mt-1">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contre-indications temporaires */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Clock className="h-7 w-7 text-orange-500" />
            <h2 className="text-3xl font-bold text-zinc-900">
              Contre-indications temporaires
            </h2>
          </div>
          <p className="text-zinc-600 mb-6">
            Ces situations vous empêchent de donner temporairement. Une fois le
            délai passé, vous pourrez à nouveau donner.
          </p>

          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-6 py-3 text-sm font-semibold text-zinc-900">
                    Motif
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-zinc-900">
                    Délai d'attente
                  </th>
                </tr>
              </thead>
              <tbody>
                {contreindicationsTemp.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-6 py-4 text-sm text-zinc-700">
                      {item.motif}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700">
                        {item.delai}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Contre-indications permanentes */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <AlertTriangle className="h-7 w-7 text-red-500" />
            <h2 className="text-3xl font-bold text-zinc-900">
              Contre-indications permanentes
            </h2>
          </div>
          <p className="text-zinc-600 mb-6">
            Ces conditions ne permettent pas le don de sang, pour votre sécurité
            et celle des receveurs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contreindicationsPerm.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-white p-4 rounded-lg border border-zinc-200"
              >
                <X className="h-5 w-5 text-red-500 shrink-0" />
                <span className="text-zinc-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Note rassurante */}
        <section className="bg-green-50 rounded-2xl p-8 md:p-12 border border-green-100">
          <div className="flex items-start gap-4">
            <Check className="h-8 w-8 text-green-600 shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                En cas de doute, venez quand même !
              </h3>
              <p className="text-zinc-700">
                Un médecin ou un infirmier vous recevra en entretien confidentiel
                avant le don. Il évaluera votre aptitude et répondra à toutes
                vos questions. Votre venue n'est jamais perdue : elle contribue à
                sensibiliser votre entourage.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/donner-sang/parcours-donneur"
              className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-8 py-3 hover:bg-primary/90 transition-colors"
            >
              Le parcours du donneur
            </Link>
            <Link
              href="/espace-patient"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-900 font-medium px-8 py-3 hover:bg-zinc-50 transition-colors"
            >
              Prendre rendez-vous
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
